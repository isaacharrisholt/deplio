<script lang="ts">
    import type { PageData } from './$types'
    import { createForm } from '$lib/forms/client'
    import EmailInput from '$lib/components/forms/EmailInput.svelte'
    import PasswordInput from '$lib/components/forms/PasswordInput.svelte'
    import { loginFormSchema } from '$lib/forms/auth'
    import ProviderAuthForm from '$lib/components/forms/ProviderAuthForm.svelte'

    export let data: PageData
    const { form, errors, enhance, allErrors } = createForm(data.form, {
        validators: loginFormSchema,
    })
</script>

<div class="grid w-full place-items-center">
    <div class="flex w-fit flex-col gap-4">
        <ProviderAuthForm data={data.providerAuthForm} action="Log in" />

        <hr />

        <form method="POST" use:enhance class="grid w-fit gap-4">
            <EmailInput
                id="email"
                name="email"
                placeholder="Email"
                bind:value={$form.email}
                errors={$errors.email}
            />
            <PasswordInput
                id="password"
                name="password"
                placeholder="Password"
                bind:value={$form.password}
                errors={$errors.password}
            />
            <button
                type="submit"
                class="btn variant-filled-secondary"
                disabled={!$form.email || !$form.password || !!$allErrors.length}
                >Log in</button
            >
        </form>
    </div>
</div>
