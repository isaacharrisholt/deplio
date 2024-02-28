import { error, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { message, setError, superValidate } from 'sveltekit-superforms/client'
import { newApiKeyFormSchema, revokeApiKeyFormSchema } from '$lib/forms/settings'
import { generateApiKey, hashApiKey } from '$lib/apiKeys'
import parseDuration from 'parse-duration'
import { addHours } from 'date-fns'
import type { FormMessage } from '$lib/forms/client'

type FormMessageWithApiKey = FormMessage & { apiKey?: string }

export const load: PageServerLoad = async ({ locals: { supabase, user }, request }) => {
  const { data: apiKeys, error: apiKeyFetchError } = await supabase
    .from('api_key')
    .select(
      `
      id,
      name,
      created_at,
      revoked_at,
      expires_at,
      created_by (first_name, last_name),
      revoked_by (first_name, last_name),
      key_prefix
      `,
    )
    .eq('team_id', user.current_team_id)

  if (apiKeyFetchError) {
    console.error('error fetching api keys', apiKeyFetchError)
    throw error(500, 'error fetching api keys')
  }

  // Order by created_at descending where expired and revoked keys are at the bottom
  apiKeys.sort((a, b) => {
    if (a.revoked_at && !b.revoked_at) {
      return 1
    }
    if (!a.revoked_at && b.revoked_at) {
      return -1
    }
    if (a.expires_at && !b.expires_at) {
      return 1
    }
    if (!a.expires_at && b.expires_at) {
      return -1
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const newApiKeyForm = await superValidate<
    typeof newApiKeyFormSchema,
    FormMessageWithApiKey
  >(request, newApiKeyFormSchema)
  const revokeApiKeyForm = await superValidate(request, revokeApiKeyFormSchema)

  return { apiKeys, newApiKeyForm, revokeApiKeyForm }
}

export const actions: Actions = {
  new: async ({ locals: { supabase, user }, request }) => {
    const form = await superValidate<typeof newApiKeyFormSchema, FormMessageWithApiKey>(
      request,
      newApiKeyFormSchema,
    )

    if (!form.valid) {
      return fail(400, { form })
    }

    const key = generateApiKey()
    const hash = await hashApiKey(key)

    const { data: apiKeys, error: apiKeyFetchError } = await supabase
      .from('api_key')
      .select('name')
      .eq('team_id', user.current_team_id)

    if (apiKeyFetchError) {
      console.error('error fetching api keys', apiKeyFetchError)
      return message(form, { status: 'error', message: 'Error creating API key' })
    }

    if (apiKeys.find((k) => k.name.toLowerCase() === form.data.name.toLowerCase())) {
      return setError(form, 'name', 'You already have an API key with this name.')
    }

    const expiresAt =
      form.data.expiry === 'never'
        ? null
        : addHours(new Date(), parseDuration(form.data.expiry, 'h') || 0).toISOString()

    const { error: apiKeyInsertError } = await supabase.from('api_key').insert({
      created_by: user.id,
      team_id: user.current_team_id,
      key_hash: hash,
      name: form.data.name,
      expires_at: expiresAt,
      key_prefix: key.slice(0, 6),
    })

    if (apiKeyInsertError) {
      console.error('error inserting api key', apiKeyInsertError)
      return message(form, { status: 'error', message: 'Error creating API key' })
    }

    return message(form, {
      status: 'success',
      message: 'API key created',
      apiKey: key,
    })
  },
  revoke: async ({ locals: { supabase, user }, request }) => {
    const form = await superValidate(request, revokeApiKeyFormSchema)

    if (!form.valid) {
      console.log(form)
      return message(form, { status: 'error', message: 'Error revoking API key' })
    }

    const { error: apiKeyRevokeError } = await supabase
      .from('api_key')
      .update({
        revoked_by: user.id,
        revoked_at: new Date().toISOString(),
      })
      .match({ id: form.data.id, team_id: user.current_team_id })

    if (apiKeyRevokeError) {
      console.error('error revoking api key', apiKeyRevokeError)
      return message(form, { status: 'error', message: 'Error revoking API key' })
    }

    return message(form, {
      status: 'success',
      message: 'API key revoked',
    })
  },
}
