import { message, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import { otpVerificationFormSchema } from '$lib/forms/auth'
import type { FormMessage } from '$lib/forms/client'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async (event) => {
    const form = await superValidate(event, otpVerificationFormSchema)
    return { form }
}

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate<typeof otpVerificationFormSchema, FormMessage>(
            event,
            otpVerificationFormSchema,
        )

        if (!form.valid) {
            return fail(400, form)
        }

        const { error } = await event.locals.supabase.auth.verifyOtp({
            email: 'isaac@harris-holt.com',
            token: String(form.data.verificationCode),
            type: 'email',
        })

        if (error) {
            return message(
                form,
                {
                    status: 'error',
                    message: 'An internal error occurred. Please try again later.',
                },
                { status: 500 },
            )
        }

        throw redirect(303, '/dashboard')
    },
}
