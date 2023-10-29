import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { AuthApiError } from '@supabase/supabase-js'
import { setError, superValidate, message } from 'sveltekit-superforms/server'
import { loginFormSchema, providerAuthFormSchema } from '$lib/forms/auth'
import type { FormMessage } from '$lib/forms/client'

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, loginFormSchema)
  const providerAuthForm = await superValidate(event, providerAuthFormSchema)
  return { form, providerAuthForm }
}

export const actions: Actions = {
  default: async (event) => {
    const {
      locals: { supabase },
    } = event
    const form = await superValidate<typeof loginFormSchema, FormMessage>(
      event,
      loginFormSchema,
    )

    if (!form.valid) {
      return fail(400, { form })
    }

    const { email, password } = form.data

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      if (loginError instanceof AuthApiError && loginError.status === 400) {
        return setError(form, 'password', 'Invalid email or password')
      }
      return message(
        form,
        {
          status: 'error',
          message: 'There was an error logging you in. Please try again later.',
        },
        { status: 500 },
      )
    }

    throw redirect(303, '/dashboard')
  },
}
