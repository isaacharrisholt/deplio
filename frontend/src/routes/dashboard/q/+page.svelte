<script lang="ts">
  import type { PageData } from './$types'
  import TabbedCodeBlock from '$lib/components/TabbedCodeBlock.svelte'
  import QRequestPanel from '$lib/components/q/QRequestPanel.svelte'

  export let data: PageData
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

    <div class="flex flex-col gap-2">
      {#each data.qRequests as qRequest}
        <QRequestPanel {qRequest} qResponses={qRequest.q_response} />
      {/each}
    </div>
  </div>
</div>
