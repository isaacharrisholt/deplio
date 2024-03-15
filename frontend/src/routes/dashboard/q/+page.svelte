<script lang="ts">
  import type { PageData } from './$types'
  import TabbedCodeBlock from '$lib/components/TabbedCodeBlock.svelte'
  import QRequestPanel from '$lib/components/q/QRequestPanel.svelte'
  import Select from '$lib/components/forms/Select.svelte'
  import { invalidateAll } from '$app/navigation'
  import { localStorageStore } from '@skeletonlabs/skeleton'
  import { onMount } from 'svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte'

  export let data: PageData

  const refreshFrequency = localStorageStore('q-refresh-frequency', 'never', {
    storage: 'local',
  })
  // eslint-disable-next-line no-undef
  let refreshInterval: NodeJS.Timeout
  let refreshing = false

  async function refresh(): Promise<void> {
    refreshing = true
    await invalidateAll()
    refreshing = false
  }

  function setRefreshFrequency(): () => void {
    refreshInterval && clearInterval(refreshInterval)

    if ($refreshFrequency === 'never') {
      return () => {}
    }

    refresh()
    refreshInterval = setInterval(async () => {
      await refresh()
    }, parseInt($refreshFrequency) * 1000)

    return () => {
      refreshInterval && clearInterval(refreshInterval)
    }
  }

  onMount(() => {
    return setRefreshFrequency()
  })

  $: max_page = Math.ceil((data.count ?? 0) / data.page_size)
</script>

<div class="flex flex-col gap-12">
  <div class="card variant-soft-surface flex flex-col gap-4 p-8">
    <h2>Q</h2>
    <p>
      Deplio Q is an effortless message queue for serverless applications. Get started
      by creating an <a href="/dashboard/api-keys" class="underline">API key</a>, then
      queue a message via the API.
    </p>
    <TabbedCodeBlock
      languages={[
        {
          code: `curl -X POST https://api.depl.io/q -H 'X-Deplio-API-Key: <KEY>' -H '{"destination": "https://example.com", "method": "GET"}'`,
          language: 'cURL',
          lineNumbers: false,
        },
        {
          code: `
const response = await fetch('https://api.depl.io/q', {
  method: 'POST',
  headers: {
    'X-Deplio-API-Key': '<KEY>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    destination: 'https://example.com',
    method: 'GET',
  })
})`,
          language: 'TypeScript',
          lineNumbers: false,
        },
      ]}
    />
  </div>

  <div class="card variant-soft-surface flex flex-col gap-4 p-8">
    <h2>Requests</h2>

    <div class="flex flex-row items-center justify-between gap-2">
      <div class="flex flex-row items-center gap-2">
        <div class="flex flex-row items-center gap-1">
          {#if data.page > 1}
            <button
              class="flex flex-row items-center"
              on:click={() => {
                $refreshFrequency = 'never'
                setRefreshFrequency()
              }}
            >
              <a href="?page=1">
                <ChevronsLeft size="16" />
              </a>
              <a href="?page={data.page - 1}">
                <ChevronLeft size="16" />
              </a>
            </button>
          {:else}
            <div class="flex flex-row items-center text-gray-500">
              <ChevronsLeft size="16" />
              <ChevronLeft size="16" />
            </div>
          {/if}
          <p class="text-sm">Page {data.page}</p>
          {#if data.page < Math.ceil((data.count ?? 0) / data.page_size)}
            <button
              class="flex flex-row items-center"
              on:click={() => {
                $refreshFrequency = 'never'
                setRefreshFrequency()
              }}
            >
              <a href="?page={data.page + 1}">
                <ChevronRight size="16" />
              </a>
              <a href="?page={max_page}">
                <ChevronsRight size="16" />
              </a>
            </button>
          {:else}
            <div class="flex flex-row items-center text-gray-500">
              <ChevronRight size="16" />
              <ChevronsRight size="16" />
            </div>
          {/if}
        </div>
      </div>

      <div class="flex flex-row items-center justify-end gap-2">
        {#if refreshing}
          <LoadingSpinner width="w-8" />
        {/if}
        <Select
          id="refreshFrequency"
          name="refreshFrequency"
          placeholder="Refresh"
          containerClass="min-w-[12rem] w-fit"
          bind:value={$refreshFrequency}
          on:change={setRefreshFrequency}
        >
          <option value="never">Never</option>
          <option value="5">Every 5s</option>
          <option value="15">Every 15s</option>
          <option value="30">Every 30s</option>
          <option value="60">Every 60s</option>
        </Select>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      {#each data.q_requests as request}
        <QRequestPanel {request} />
      {/each}
    </div>
  </div>
</div>
