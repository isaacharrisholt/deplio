<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronsUpDown, PlusCircle } from 'lucide-svelte'
  import type { PopupSettings } from '@skeletonlabs/skeleton'
  import { popup } from '@skeletonlabs/skeleton'
  import { goto } from '$app/navigation'
  import TextInput from './forms/TextInput.svelte'
  import { browser } from '$app/environment'

  const team_popup: PopupSettings = {
    event: 'click',
    target: 'teamPopup',
    placement: 'bottom',
  }

  async function set_team(teamId: string) {
    const currentUrl = $page.url
    currentUrl.searchParams.set('team', teamId)
    await goto(currentUrl.toString(), { invalidateAll: true })
  }

  let search_value = ''

  let is_windows = false
  $: {
    if (browser) {
      const ua_data = (navigator as unknown as { userAgentData?: { platform: string } })
        .userAgentData
      is_windows = ua_data?.platform === 'Windows'
    }
  }

  function format_for_search(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
  }

  $: filtered_teams = $page.data.user.teams.filter(
    (team) =>
      !search_value ||
      format_for_search(team.name).includes(format_for_search(search_value)),
  )
  $: personal_team = filtered_teams.find((team) => team.type === 'personal')
  $: organization_teams = filtered_teams.filter((team) => team.type === 'organization')
</script>

<div class="flex flex-row items-center gap-2">
  <a href="/">
    <p class="h3">Deplio</p>
  </a>

  <p class="h3 -mt-1 select-none pl-4 text-primary-900">
    {is_windows ? '\\' : '/'}
  </p>

  <button
    class="btn flex flex-row items-center gap-2 bg-none hover:variant-soft-surface"
    use:popup={team_popup}
  >
    <p>{$page.data.team.name}</p>
    <ChevronsUpDown size={16} />
  </button>
</div>

<div data-popup="teamPopup" class="card w-72 shadow-xl">
  <TextInput
    type="search"
    id="team-search"
    placeholder="Search accounts..."
    class="w-full"
    bind:value={search_value}
  />
  <div class="flex flex-col gap-4 p-4">
    <!-- Personal team -->
    {#if personal_team}
      <div class="flex flex-col gap-2">
        <p class="text-sm text-surface-600-300-token">Personal account</p>
        <button
          on:click={() => set_team(personal_team?.id ?? '')}
          class="btn justify-start"
          class:variant-outline-tertiary={$page.data.team.id === personal_team.id}
        >
          <p>{personal_team.name}</p>
        </button>
      </div>

      <hr />
    {/if}

    <!-- Other teams -->
    <div class="flex flex-col gap-2">
      <p class="text-sm text-surface-600-300-token">Teams (coming soon)</p>
      {#each organization_teams as team}
        <button
          on:click={() => set_team(team.id)}
          class="btn justify-start"
          class:variant-outline-tertiary={$page.data.team.id === team.id}
        >
          <p>{team.name}</p>
        </button>
      {/each}
    </div>

    <a href="/dashboard/team/new" class="btn variant-ghost-surface justify-start">
      <PlusCircle size={20} class="text-secondary-500" />
      <p>Create team</p>
    </a>
  </div>
</div>
