import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { invite_team_member_form_schema } from '$lib/forms/team'
import type { TeamInviteInsert } from '$lib/types/supabase'
import { addDays } from 'date-fns'
import { get_supabase_admin_client } from '$lib/utils.server'

export const load: PageServerLoad = async ({ request, locals: { team } }) => {
  if (team.type === 'personal') {
    throw redirect(303, '/dashboard/team')
  }
  const form = await superValidate(request, invite_team_member_form_schema)
  return { form }
}

export const actions: Actions = {
  default: async ({ request, locals: { user, team, supabase } }) => {
    const form = await superValidate(request, invite_team_member_form_schema)
    if (!form.valid) {
      return fail(400, { form })
    }

    const supabase_admin = get_supabase_admin_client()
    const { data: team_users, error: team_users_error } = await supabase_admin
      .from('team_user')
      .select('id, user (email)')
      .in('user.email', form.data.emails)
      .eq('team_id', team.id)

    if (team_users_error) {
      console.error('error fetching team users', team_users_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    const { data: existing_invites, error: existing_invites_error } = await supabase
      .from('team_invite')
      .select('email')
      .in('email', form.data.emails)
      .eq('team_id', team.id)
      .gte('expires_at', new Date().toISOString())

    if (existing_invites_error) {
      console.error('error fetching existing invites', existing_invites_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    const new_users = form.data.emails.filter(
      (email) =>
        !team_users.some((tu) => tu.user?.email === email) &&
        !existing_invites.some((i) => i.email === email),
    )

    console.log(team_users)

    if (new_users.length === 0) {
      return message(
        form,
        {
          status: 'error',
          message: 'All users are already in the team or already have active invites.',
        },
        { status: 400 },
      )
    }

    const { error: invite_insert_error } = await supabase.from('team_invite').insert(
      new_users.map(
        (email) =>
          ({
            created_by: user.id,
            team_id: team.id,
            email,
            role: form.data.role,
            expires_at: addDays(new Date(), 7).toISOString(),
          } satisfies TeamInviteInsert),
      ),
    )

    if (invite_insert_error) {
      console.error('error inserting invites', { error: invite_insert_error.message })
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    return message(form, {
      status: 'success',
      message:
        'Invite(s) sent successfully. The new users will be able to accept the invite from their dashboard.',
    })
  },
}
