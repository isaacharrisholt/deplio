<script lang="ts">
    import type { PageData } from './$types'
    import {
        InputChip,
        Autocomplete,
        type AutocompleteOption,
    } from '@skeletonlabs/skeleton'
    import TextInput from '$lib/components/forms/TextInput.svelte'
    import { createForm } from '$lib/forms/client'
    import { createNewProjectSchema } from '$lib/forms/projects'
    import ErrorText from '$lib/components/forms/ErrorText.svelte'
    import Textarea from '$lib/components/forms/Textarea.svelte'

    export let data: PageData
    const projects = data.projects
    const repos = data.repos

    const descriptions = [
        'An AI model that writes descriptions for Deplio projects',
        'Tinder for horses',
        'Payments, but in toenail clippings',
        'A social network for people who hate social networks',
        'X',
    ]

    const { form, enhance, errors, allErrors, submitting } = createForm(data.form, {
        validators: createNewProjectSchema(
            projects.map((p) => p.name),
            repos.map((r) => r.full_name),
        ),
    })

    $: repoNames = repos.map((repo) => repo.full_name)
    $: repoOptions = repos.map(
        (repo) =>
            ({
                label: repo.full_name,
                value: repo.full_name,
            } as AutocompleteOption),
    )

    $: canSubmit =
        !!$form.name && !!$form.repos.length && !$allErrors.length && !$submitting

    function onSelection(e: CustomEvent<AutocompleteOption>) {
        $form.repos.push(e.detail.value as string)
        $form.repos = $form.repos
    }

    function clearAll() {
        $form.repos = []
    }

    let repoInput = ''
</script>

<form
    method="POST"
    use:enhance
    class="card variant-filled-surface flex flex-col gap-2 p-4 sm:p-8"
>
    <h2 class="h2">Project details</h2>
    <p>Tell us about your project</p>

    <TextInput
        id="name"
        name="name"
        label="Project name"
        placeholder="My project"
        errors={$errors.name}
        bind:value={$form.name}
    />

    <Textarea
        id="description"
        name="description"
        label="Project description (optional)"
        errors={$errors.description}
        bind:value={$form.description}
        placeholder={descriptions[Math.floor(Math.random() * descriptions.length)]}
    />

    <h2 class="h2 mt-4">Repos</h2>
    <p>
        Select the GitHub repositories you'd like to include in this project. Repos
        without a <code class="code">deplio.yaml</code> file in their root will be ignored
        during deployments.
    </p>

    <div class="flex flex-row items-start gap-4">
        <InputChip
            bind:input={repoInput}
            bind:value={$form.repos}
            whitelist={repoNames}
            name="repos"
        />
        <button
            class="btn variant-ringed-primary h-full"
            on:click={clearAll}
            disabled={!$form.repos.length}
        >
            Clear all
        </button>
    </div>

    <ErrorText
        errors={$errors.repos &&
        '_errors' in $errors.repos &&
        Array.isArray($errors.repos._errors)
            ? $errors.repos._errors
            : []}
        id="repos"
    />

    <div class="card max-h-52 w-full overflow-y-auto p-4" tabindex="-1">
        <Autocomplete
            bind:input={repoInput}
            options={repoOptions}
            allowlist={repoNames}
            denylist={$form.repos}
            on:selection={onSelection}
        />
    </div>

    <button
        type="submit"
        class="btn variant-filled-secondary mt-4"
        disabled={!canSubmit}>Create project</button
    >
</form>
