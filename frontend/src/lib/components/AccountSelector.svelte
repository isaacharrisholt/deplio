<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronsUpDown, PlusCircle } from 'lucide-svelte'
  import type { PopupSettings } from '@skeletonlabs/skeleton'
  import { popup } from '@skeletonlabs/skeleton'
  import { goto } from '$app/navigation'
  import TextInput from './forms/TextInput.svelte'
  import { browser } from '$app/environment'

  const teamPopup: PopupSettings = {
    event: 'click',
    target: 'teamPopup',
    placement: 'bottom',
  }

  async function setTeam(teamId: string) {
    const currentUrl = $page.url
    currentUrl.searchParams.set('team', teamId)
    await goto(currentUrl.toString())
  }

  let searchValue = ''

  let isWindows = false
  $: {
    if (browser) {
      const uaData = (navigator as unknown as { userAgentData?: { platform: string } })
        .userAgentData
      isWindows = uaData?.platform === 'Windows'
    }
  }

  function formatForSearch(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
  }

  $: filteredTeams = $page.data.user.teams.filter(
    (team) =>
      !searchValue || formatForSearch(team.name).includes(formatForSearch(searchValue)),
  )
  $: personalTeam = filteredTeams.find((team) => team.type === 'personal')
  $: organizationTeams = filteredTeams.filter((team) => team.type === 'organization')
</script>

<div class="flex flex-row items-center gap-2">
  <a href="/">
    <p class="h3">Deplio</p>
  </a>

  <p class="h3 -mt-1 select-none pl-4 text-primary-900">
    {isWindows ? '\\' : '/'}
  </p>

  <button
    class="btn flex flex-row items-center gap-2 bg-none hover:variant-soft-surface"
    use:popup={teamPopup}
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
    bind:value={searchValue}
  />
  <div class="flex flex-col gap-4 p-4">
    <!-- Personal team -->
    {#if personalTeam}
      <div class="flex flex-col gap-2">
        <p class="text-sm text-surface-600-300-token">Personal account</p>
        <button
          on:click={() => setTeam(personalTeam?.id ?? '')}
          class="btn justify-start"
          class:variant-outline-tertiary={$page.data.team.id === personalTeam.id}
        >
          <p>{personalTeam.name}</p>
        </button>
      </div>

      <hr />
    {/if}

    <!-- Other teams -->
    <div class="flex flex-col gap-2">
      <p class="text-sm text-surface-600-300-token">Teams (coming soon)</p>
      {#each organizationTeams as team}
        <button
          on:click={() => setTeam(team.id)}
          class="btn justify-start"
          class:variant-outline-tertiary={$page.data.team.id === team.id}
        >
          <p>{team.name}</p>
        </button>
      {/each}
    </div>

    <button class="btn variant-ghost-surface justify-start" disabled>
      <PlusCircle size={20} class="text-secondary-500" />
      <p>Create team</p>
    </button>
  </div>
</div>
