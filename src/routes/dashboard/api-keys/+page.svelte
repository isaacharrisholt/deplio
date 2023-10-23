<script lang="ts">
    import TextInput from '$lib/components/forms/TextInput.svelte'
    import Select from '$lib/components/forms/Select.svelte'
    import type { PageData } from './$types'
    import { createForm } from '$lib/forms/client'
    import CopyClick from '$lib/components/CopyClick.svelte'

    export let data: PageData

    const {
        form: newApiKeyForm,
        errors: newApiKeyErrors,
        enhance: newApiKeyEnhance,
        submitting: newApiKeySubmitting,
    } = createForm(data.form, {
        async onUpdated({ form }) {
            if (form.message?.apiKey) {
                newApiKey = form.message.apiKey
                $newApiKeyForm.name = ''
            }
        },
    })

    let newApiKey = ''
</script>

<div class="flex flex-col gap-12">
    {#if newApiKey}
        <div class="card variant-soft-tertiary flex flex-col gap-4 p-8">
            <h3>Your new API key</h3>
            <p>You'll only see this once, so keep it safe!</p>
            <CopyClick text={newApiKey} />
            <button
                class="btn variant-filled-primary w-fit"
                on:click={() => (newApiKey = '')}>I'm done!</button
            >
        </div>
    {/if}

    <div class="card variant-soft-surface flex flex-col gap-4 p-8">
        <h3>New API key</h3>
        <form
            method="POST"
            action="?/new"
            class="flex flex-col gap-4"
            use:newApiKeyEnhance
        >
            <div class="flex flex-row gap-4">
                <TextInput
                    id="name"
                    name="name"
                    label="API key name"
                    placeholder="{data.user.first_name}'s API key"
                    bind:value={$newApiKeyForm.name}
                    errors={$newApiKeyErrors.name}
                />
                <Select
                    id="expiry"
                    name="expiry"
                    label="Expiry"
                    containerClass="w-fit min-w-[12rem]"
                    bind:value={$newApiKeyForm.expiry}
                    errors={$newApiKeyErrors.expiry}
                >
                    <option value="never">Never</option>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                    <option value="1w">1 week</option>
                    <option value="1m">1 month</option>
                    <option value="1y">1 year</option>
                </Select>
            </div>
            <button
                type="submit"
                class="btn variant-filled-primary w-fit"
                disabled={$newApiKeySubmitting}>Create</button
            >
        </form>
    </div>
</div>
