import { providerAuthFormSchema } from '$lib/forms/auth'
import { getSiteUrl } from '$lib/utils.server'
import { fail, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types'
import { cache } from '$lib/cache'

export const actions: Actions = {
  providerAuth: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, providerAuthFormSchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const provider = form.data.provider

    console.log('siteUrl', getSiteUrl())

    const { data: providerData, error: authError } =
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getSiteUrl()}/auth/provider/${provider}`,
          skipBrowserRedirect: true,
        },
      })

    if (authError) {
      console.log('error', authError)
      return message(
        form,
        {
          status: 'error',
          message: 'There was an error authenticating you. Please try again later.',
        },
        { status: 500 },
      )
    }

    console.log('providerData', providerData)

    throw redirect(303, providerData.url)
  },
}
