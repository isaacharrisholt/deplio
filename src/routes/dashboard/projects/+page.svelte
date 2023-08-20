<script lang="ts">
    import type { PageData } from './$types'
    import { FolderOpen, SearchX } from 'lucide-svelte'
    import TextInput from '$lib/components/forms/TextInput.svelte'

    export let data: PageData
    $: projects = data.projects

    let filter = ''
    $: displayProjects = filter
        ? projects.filter((p) =>
              p.name
                  .replaceAll(/[^\d\w]+/g, '')
                  .toLowerCase()
                  .includes(filter.toLowerCase()),
          )
        : projects

    async function doDownload() {
        const response = await fetch('/api/github', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const data = await response.json()
        console.log(data)
    }
</script>

<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
    {#if projects.length > 0}
        <div class="col-span-full flex flex-row gap-4">
            <TextInput id="search" placeholder="Search" bind:value={filter} />
            <a href="/dashboard/projects/new" class="btn variant-filled-primary"
                >+ Add new</a
            >
        </div>
    {/if}

    <button on:click={doDownload} class="variant-form-material btn"> Test </button>

    {#each displayProjects as project}
        <a
            href="/dashboard/projects/{project.id}"
            class="card variant-glass-surface p-8 transition-all duration-100 ease-in-out hover:variant-filled-surface"
        >
            <h3 class="h3">{project.name}</h3>
            <p class="text-sm">{project.repos.length} repos</p>
            <p class="mt-4">{project.description}</p>
        </a>
    {:else}
        <div
            class="card variant-glass-surface p-4 sm:p-8 lg:p-16 col-span-full grid place-items-center gap-4 text-center"
        >
            {#if projects.length}
                <SearchX size="120" strokeWidth="0.6" />
                <h2 class="h2">No projects found!</h2>
                <p>
                    If you create a new one, you might not look so stupid searching for
                    '{filter}'...
                </p>
                <a href="/dashboard/projects/new" class="btn variant-filled-primary"
                    >+ Add new</a
                >
            {:else}
                <FolderOpen size="120" strokeWidth="0.6" />
                <h2 class="h2">No projects yet</h2>
                {#if data.githubInstallations.length}
                    <p>Why not get started by adding a new project?</p>
                    <a href="/dashboard/projects/new" class="btn variant-filled-primary"
                        >+ Add new</a
                    >
                {:else}
                    <p>Get started by connecting your GitHub account</p>
                    <a
                        href="https://github.com/apps/depl-io-local/installations/new"
                        class="btn variant-filled-primary">Connect now</a
                    >
                {/if}
            {/if}
        </div>
    {/each}
</div>
