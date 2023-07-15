<script lang="ts">
    import type { PageData } from './$types'
    import { createForm } from '$lib/forms/client'
    import { Github } from 'lucide-svelte'
    import { emailSignupFormSchema } from '$lib/forms/auth'

    export let data: PageData
    const supabase = data.supabase
    const {
        form: emailSignupForm,
        errors: emailSignupFormErrors,
        message: emailSignupFormMessage,
        enhance: emailSignupFormEnhance,
    } = createForm(data.emailSignupForm, {
        validators: emailSignupFormSchema,
    })
    const {
        message: providerSignupFormMessage,
        enhance: providerSignupFormEnhance,
        submitting: providerSignupFormSubmitting,
    } = createForm(data.providerSignupForm)

    $: canSignUp =
        !!$emailSignupForm.email &&
        !!$emailSignupForm.password &&
        !!$emailSignupForm.passwordConfirmation
</script>

<div class="grid h-screen w-full place-items-center">
    <div class="flex w-fit flex-col gap-4">
        <form
            action="?/providerSignup"
            method="POST"
            class="w-full"
            use:providerSignupFormEnhance
        >
            <button
                type="submit"
                class="btn flex w-full flex-row items-center gap-2 bg-[#333]"
                disabled={$providerSignupFormSubmitting}
            >
                <Github />
                Sign up with GitHub
            </button>
            <input type="hidden" name="provider" value="github" />
        </form>

        <form
            method="POST"
            action="?/emailSignup"
            class="grid w-fit gap-4"
            use:emailSignupFormEnhance
        >
            <input
                type="email"
                name="email"
                placeholder="Email"
                class="input"
                bind:value={$emailSignupForm.email}
            />
            <input
                type="password"
                name="password"
                placeholder="Password"
                class="input"
                bind:value={$emailSignupForm.password}
            />
            <input
                type="password"
                name="passwordConfirmation"
                placeholder="Confirm password"
                class="input"
                bind:value={$emailSignupForm.passwordConfirmation}
            />
            <button
                type="submit"
                class="btn variant-filled-primary"
                disabled={!canSignUp}>Sign up</button
            >
        </form>
    </div>
</div>
