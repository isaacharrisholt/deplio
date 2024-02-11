import { providerAuthFormSchema } from '$lib/forms/auth'
import { fail, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types'
import { PUBLIC_DEPLIO_URL } from '$env/static/public'

export const actions: Actions = {
  providerAuth: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, providerAuthFormSchema)

    if (!form.valid) {
      return fail(400, { form })
    }

    const provider = form.data.provider

    const { data: providerData, error: authError } =
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${PUBLIC_DEPLIO_URL}/auth/provider/${provider}`,
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

    throw redirect(303, providerData.url)
  },
}
