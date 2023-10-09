<script lang="ts">
    import TextInput from '$lib/components/forms/TextInput.svelte'
    import Textarea from '$lib/components/forms/Textarea.svelte'
    import { createForm } from '$lib/forms/client'
    import { Autocomplete, type AutocompleteOption } from '@skeletonlabs/skeleton'
    import type { PageData } from './$types'

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

    const { form, enhance, errors, allErrors, submitting } = createForm(data.form)

    $: repoNames = repos.map((repo) => repo.full_name)
    $: repoOptions = repos.map(
        (repo) =>
            ({
                label: repo.full_name,
                value: repo.full_name,
            } as AutocompleteOption),
    )

    $: canSubmit = !!$form.name && !!$form.repo && !$allErrors.length && !$submitting

    function onSelection(e: CustomEvent<AutocompleteOption>) {
        $form.repo = e.detail.value
    }
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

    <h2 class="h2 mt-4">Repo</h2>
    <p>
        Select the GitHub repository you'd like to include in this project. Repos
        without a <code class="code">deplio.yaml</code> file in their root will be ignored
        during deployments.
    </p>

    <TextInput
        id="repo"
        name="repo"
        type="search"
        placeholder={repoNames[Math.floor(Math.random() * repoNames.length)]}
        bind:value={$form.repo}
        errors={$errors.repo}
    />

    <div
        class="card max-h-52 w-full overflow-y-auto p-4"
        tabindex="-1"
        class:hidden={repoNames?.includes($form.repo)}
    >
        <Autocomplete
            bind:input={$form.repo}
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
