import { message, setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { null_form_schema } from '$lib/forms/null'
import { cache } from '$lib/cache'
import { create_team_form_schema } from '$lib/forms/team'
import { get_supabase_admin_client } from '$lib/utils.server'

export const load: PageServerLoad = async ({ request }) => {
  const form = await superValidate(request, create_team_form_schema)
  const avatar_form = await superValidate(request, null_form_schema)
  return { form, avatar_form }
}

export const actions: Actions = {
  default: async ({ request, locals: { user } }) => {
    const form = await superValidate(request, create_team_form_schema)
    if (!form.valid) {
      return fail(400, { form })
    }

    await cache.del(`user:${user.user_id}`)
    const supabase_admin = get_supabase_admin_client()

    const { data: existing_team, error: existing_team_fetch_error } =
      await supabase_admin
        .from('team')
        .select('id')
        .eq('name', form.data.name)
        .is('deleted_at', null)
        .maybeSingle()

    if (existing_team_fetch_error) {
      console.error('error fetching existing team', existing_team_fetch_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    if (existing_team) {
      return setError(form, 'name', 'A team with this name already exists.')
    }

    const { data: new_team, error: team_insert_error } = await supabase_admin
      .from('team')
      .insert({ name: form.data.name, type: 'organization' })
      .select('id')
      .single()

    if (team_insert_error) {
      console.error('error inserting team', team_insert_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    const { error: team_user_insert_error } = await supabase_admin
      .from('team_user')
      .insert({
        team_id: new_team.id,
        user_id: user.id,
        role: 'admin',
      })

    if (team_user_insert_error) {
      console.error('error inserting team_user, deleting team', team_user_insert_error)

      const { error: team_delete_error } = await supabase_admin
        .from('team')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', new_team.id)

      if (team_delete_error) {
        console.error('error deleting team', team_delete_error)
      }

      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    throw redirect(303, `/dashboard/team?team=${new_team.id}`)
  },
}
