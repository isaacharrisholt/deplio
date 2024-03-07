import { edit_user_details_form_schema } from '$lib/forms/user'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'
import { get_supabase_admin_client } from '$lib/utils.server'
import { null_form_schema } from '$lib/forms/null'
import { construct_file_path, hash_file } from '$lib/storage'
import { cache } from '$lib/cache'

export const load: PageServerLoad = async ({ request }) => {
  const form = await superValidate(request, edit_user_details_form_schema)
  const avatar_form = await superValidate(request, null_form_schema)
  return { form, avatar_form }
}

export const actions: Actions = {
  user: async ({ request, locals: { user, supabase } }) => {
    const form = await superValidate(request, edit_user_details_form_schema)
    if (!form.valid) {
      return fail(400, { form })
    }

    if (form.data.username && form.data.username !== user.username) {
      const supabase_admin = get_supabase_admin_client()
      const { data: users, error: users_fetch_error } = await supabase_admin
        .from('user')
        .select('id')
        .ilike('username', form.data.username.toLowerCase())
      if (users_fetch_error) {
        console.error('error fetching users', users_fetch_error)
        return message(
          form,
          {
            status: 'error',
            message: 'An internal error occurred. Please try again later.',
          },
          { status: 500 },
        )
      }
      if (users.length > 0) {
        return setError(form, 'username', 'This username is already taken.')
      }
    }

    await cache.del(`user:${user.user_id}`)
    const { error: user_update_error } = await supabase
      .from('user')
      .update(form.data)
      .eq('id', user.id)

    if (user_update_error) {
      console.error('error updating user', user_update_error)
      return message(
        form,
        {
          status: 'error',
          message: 'An internal error occurred. Please try again later.',
        },
        { status: 500 },
      )
    }

    const personal_team = user.teams.find((team) => team.type === 'personal')
    if (personal_team) {
      const { error: team_update_error } = await supabase
        .from('team')
        .update({ name: form.data.username })
        .eq('id', personal_team.id)

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
    }

    return message(form, {
      status: 'success',
      message: 'Details updated successfully.',
    })
  },
  avatar: async ({ request, locals: { supabase, user } }) => {
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
    const path = construct_file_path('user/', user.id, image.name, file_hash)
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
    const { error: user_update_error } = await supabase
      .from('user')
      .update({ avatar_url: url })
      .eq('id', user.id)

    if (user_update_error) {
      console.error('error updating user', user_update_error)
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
