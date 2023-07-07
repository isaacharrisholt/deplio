import type { Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { VERCEL_URL } from '$env/static/private'

export const actions: Actions = {
    default: async ({ request, locals: { supabase } }) => {
        const form = await request.formData()

        const email = form.get('email')
        const password = form.get('password')

        if (!email || !password) {
            return fail(400, { message: 'Email and password are required' })
        }

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${VERCEL_URL}/auth/callback` },
        })

        if (authError) {
            return fail(500, { message: authError.message })
        }

        throw redirect(303, '/dashboard')
    },
}
