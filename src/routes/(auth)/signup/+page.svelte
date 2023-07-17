<script lang="ts">
    import type { PageData } from './$types'
    import { createForm } from '$lib/forms/client'
    import { Github } from 'lucide-svelte'
    import { emailSignupFormSchema } from '$lib/forms/auth'
    import EmailInput from '$lib/components/forms/EmailInput.svelte'
    import PasswordInput from '$lib/components/forms/PasswordInput.svelte'

    export let data: PageData
    const supabase = data.supabase
    const {
        form: emailSignupForm,
        errors: emailSignupFormErrors,
        enhance: emailSignupFormEnhance,
    } = createForm(data.emailSignupForm, {
        validators: emailSignupFormSchema,
    })
    const {
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
            <EmailInput
                id="email"
                name="email"
                placeholder="Email"
                bind:value={$emailSignupForm.email}
                errors={$emailSignupFormErrors.email}
            />
            <PasswordInput
                id="password"
                name="password"
                placeholder="Password"
                bind:value={$emailSignupForm.password}
                errors={$emailSignupFormErrors.password}
            />
            <PasswordInput
                id="passwordConfirmation"
                name="passwordConfirmation"
                placeholder="Confirm password"
                bind:value={$emailSignupForm.passwordConfirmation}
                errors={$emailSignupFormErrors.passwordConfirmation}
            />
            <button
                type="submit"
                class="btn variant-filled-primary"
                disabled={!canSignUp}>Sign up</button
            >
        </form>
    </div>
</div>
