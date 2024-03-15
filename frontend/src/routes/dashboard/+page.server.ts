import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { get_supabase_admin_client } from '$lib/utils.server'
import { message, superValidate } from 'sveltekit-superforms/server'
import { respond_to_team_invite_form_schema } from '$lib/forms/team'

export const load: PageServerLoad = async ({ locals: { user }, request }) => {
  const supabase_admin = get_supabase_admin_client()

  const { data: team_invites, error: team_invite_fetch_error } = await supabase_admin
    .from('team_invite')
    .select('*, team (name)')
    .eq('email', user.email)
    .gte('expires_at', new Date().toISOString())
    .eq('status', 'pending')

  if (team_invite_fetch_error) {
    console.error('error fetching team invites', team_invite_fetch_error)
    throw error(500, 'Internal Server Error')
  }

  const form = await superValidate(request, respond_to_team_invite_form_schema)

  return { team_invites, form }
}

export const actions: Actions = {
  default: async ({ request, locals: { user } }) => {
    const form = await superValidate(request, respond_to_team_invite_form_schema)
    if (!form.valid) {
      console.error('invalid form for responding to invite', form.errors)
      return message(
        form,
        { status: 'error', message: 'Hmmm, looks like something went wrong.' },
        { status: 500 },
      )
    }

    const supabase_admin = get_supabase_admin_client()
    // Get invite
    const { data: invite, error: invite_fetch_error } = await supabase_admin
      .from('team_invite')
      .select()
      .eq('id', form.data.invite_id)
      .eq('email', user.email)
      .single()

    if (invite_fetch_error) {
      console.error('error fetching team invite', invite_fetch_error)
      return message(
        form,
        { status: 'error', message: "We couldn't get that invite for some reason." },
        { status: 500 },
      )
    }

    // Insert new team_user
    const { error: team_user_insert_error } = await supabase_admin
      .from('team_user')
      .insert({
        team_id: invite?.team_id,
        user_id: user.id,
        role: 'member',
      })

    if (team_user_insert_error) {
      console.error('error inserting team user', team_user_insert_error)
      return message(
        form,
        { status: 'error', message: 'Internal Server Error' },
        { status: 500 },
      )
    }

    // Update the invite
    const { error: invite_update_error } = await supabase_admin
      .from('team_invite')
      .update({
        used_at: new Date().toISOString(),
        status: form.data.action === 'accept' ? 'accepted' : 'rejected',
      })
      .eq('id', invite.id)

    if (invite_update_error) {
      console.error('error updating team invite', invite_update_error)
      return message(
        form,
        { status: 'error', message: "Couldn't respond to invite, sorry about that!" },
        { status: 500 },
      )
    }

    return message(form, {
      status: 'success',
      message: `Successfully ${form.data.action}ed invite!`,
    })
  },
}
