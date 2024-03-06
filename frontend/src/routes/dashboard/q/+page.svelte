<script lang="ts">
  import type { PageData } from './$types'
  import TabbedCodeBlock from '$lib/components/TabbedCodeBlock.svelte'
  import QRequestPanel from '$lib/components/q/QRequestPanel.svelte'
  import Select from '$lib/components/forms/Select.svelte'
  import { invalidateAll } from '$app/navigation'
  import { localStorageStore } from '@skeletonlabs/skeleton'
  import { onMount } from 'svelte'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

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

  async function setRefreshFrequency() {
    refreshInterval && clearInterval(refreshInterval)

    if ($refreshFrequency === 'never') return

    await refresh()
    refreshInterval = setInterval(async () => {
      await refresh()
    }, parseInt($refreshFrequency) * 1000)
  }

  onMount(async () => {
    await setRefreshFrequency()
  })
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
          code: `curl -X POST https://api.deplio.com/api/q -H 'X-Deplio-API-Key: <KEY>' -H '{"destination": "https://example.com", "method": "GET"}'`,
          language: 'cURL',
          lineNumbers: false,
        },
        {
          code: `
const response = await fetch('https://api.deplio.com/api/q', {
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

    <div class="flex flex-col gap-2">
      {#each data.qRequests as qRequest}
        <QRequestPanel {qRequest} qResponses={qRequest.q_response} />
      {/each}
    </div>
  </div>
</div>
