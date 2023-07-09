<script lang="ts">
    import type { PageData } from './$types'
    import { createForm } from '$lib/forms/client'

    export let data: PageData
    const { form, message, errors, enhance } = createForm(data.form)
</script>

<div class="w-full h-screen grid place-items-center">
    <form method="POST" use:enhance class="grid gap-4 w-fit">
        <input
            type="email"
            name="email"
            placeholder="Email"
            class="input"
            bind:value={$form.email}
        />
        <input
            type="password"
            name="password"
            placeholder="Password"
            class="input"
            bind:value={$form.password}
        />
        <button
            type="submit"
            class="btn variant-filled-primary"
            disabled={!$form.email || !$form.password}>Login</button
        >
    </form>
</div>
