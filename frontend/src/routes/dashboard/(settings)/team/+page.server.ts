import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'
import { null_form_schema } from '$lib/forms/null'
import { construct_file_path, hash_file } from '$lib/storage'
import { cache } from '$lib/cache'
import { edit_team_details_form_schema } from '$lib/forms/team'

export const load: PageServerLoad = async ({ request }) => {
  const form = await superValidate(request, edit_team_details_form_schema)
  const avatar_form = await superValidate(request, null_form_schema)
  return { form, avatar_form }
}

export const actions: Actions = {
  team: async ({ request, locals: { user, team, supabase } }) => {
    const form = await superValidate(request, edit_team_details_form_schema)
    if (!form.valid) {
      return fail(400, { form })
    }

    await cache.del(`user:${user.user_id}`)
    const { error: team_update_error } = await supabase
      .from('team')
      .update(form.data)
      .eq('id', team.id)

    if (team_update_error) {
      console.error('error updating team', team_update_error)
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
      message: 'Details updated successfully.',
    })
  },
  avatar: async ({ request, locals: { supabase, team, user } }) => {
    const form_data = await request.formData()
    const form = await superValidate(form_data, null_form_schema)
    const image = form_data.get('avatar')
    if (!image || !(image instanceof File) || !image.size) {
      return message(
        form,
        { status: 'error', message: 'No image provided.' },
        { status: 400 },
      )
    }

    const file_hash = await hash_file(image)
    const path = construct_file_path('team/', team.id, image.name, file_hash)
    console.log('path', path)
    const { data: uploaded, error: upload_error } = await supabase.storage
      .from('avatars')
      .upload(path, image, { upsert: true })

    if (upload_error) {
      console.error('error uploading avatar', upload_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    const {
      data: { publicUrl: url },
    } = supabase.storage.from('avatars').getPublicUrl(uploaded.path)

    await cache.del(`user:${user.user_id}`)
    const { error: team_update_error } = await supabase
      .from('team')
      .update({ avatar_url: url })
      .eq('id', team.id)

    if (team_update_error) {
      console.error('error updating team', team_update_error)
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
      message: 'Avatar updated successfully.',
    })
  },
}
