import type { Actions } from './$types'

export const actions: Actions = {
    default: async (event) => {
        const form = await event.request.formData()
        const verificationCode = form.get('verificationCode') as string

        const { data, error } = await event.locals.supabase.auth.verifyOtp({
            email: 'isaac@harris-holt.com',
            token: verificationCode,
            type: 'email',
        })

        console.log(data, error)
    },
}
