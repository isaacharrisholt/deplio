import { emailSignupFormSchema, providerAuthFormSchema } from '$lib/forms/auth'
import { getSiteUrl } from '$lib/utils.server'
import { fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  const emailSignupForm = await superValidate(event, emailSignupFormSchema)
  const providerAuthForm = await superValidate(event, providerAuthFormSchema)
  return { emailSignupForm, providerAuthForm }
}

export const actions: Actions = {
  emailSignup: async (event) => {
    const {
      locals: { supabase },
    } = event
    const form = await superValidate(event, emailSignupFormSchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const { error: authError } = await supabase.auth.signUp({
      email: form.data.email,
      password: form.data.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?redirectUrl=/dashboard`,
      },
    })

    if (authError) {
      if (authError.message === 'User already registered') {
        return setError(form, 'email', 'This email is already in use.')
      }
      console.log(authError)
      return message(
        form,
        {
          status: 'error',
          message: 'There was an error signing you up. Please try again later.',
        },
        { status: 500 },
      )
    }

    throw redirect(303, '/signup/verify')
  },
}
