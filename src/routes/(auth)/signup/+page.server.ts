import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { emailSignupFormSchema, providerSignupFormSchema } from '$lib/forms/auth'
import type { FormMessage } from '$lib/forms/client'
import { getSiteUrl } from '$lib/utils.server'

export const load: PageServerLoad = async (event) => {
    const emailSignupForm = await superValidate(event, emailSignupFormSchema)
    const providerSignupForm = await superValidate(event, providerSignupFormSchema)
    return { emailSignupForm, providerSignupForm }
}

export const actions: Actions = {
    emailSignup: async (event) => {
        const {
            locals: { supabase },
        } = event
        const form = await superValidate<typeof emailSignupFormSchema, FormMessage>(
            event,
            emailSignupFormSchema,
        )

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
                    message:
                        'There was an error signing you up. Please try again later.',
                },
                { status: 500 },
            )
        }

        throw redirect(303, '/signup/verify')
    },
    providerSignup: async (event) => {
        const {
            locals: { supabase },
        } = event
        const form = await superValidate<typeof providerSignupFormSchema, FormMessage>(
            event,
            providerSignupFormSchema,
        )

        if (!form.valid) {
            return fail(400, { form })
        }

        const { data: providerData, error: authError } =
            await supabase.auth.signInWithOAuth({
                provider: form.data.provider,
                options: {
                    redirectTo: `${getSiteUrl()}/signup`,
                    skipBrowserRedirect: true,
                },
            })

        if (authError) {
            return message(
                form,
                {
                    status: 'error',
                    message:
                        'There was an error signing you up. Please try again later.',
                },
                { status: 500 },
            )
        }

        throw redirect(303, providerData.url)
    },
}
