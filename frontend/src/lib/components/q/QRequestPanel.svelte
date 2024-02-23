<script lang="ts">
  import type { QRequest, QResponse } from '$lib/types/supabase'
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton'
  import QResponseStatus from './QResponseStatus.svelte'
  import CodeBlock from '../CodeBlock.svelte'

  export let qRequest: QRequest
  // Even though we're only using the latest response, require all
  // as we'll use them in the future once each request can have multiple responses
  // (e.g. for retries)
  export let qResponses: QResponse[]

  $: latestResponse = qResponses[qResponses.length - 1]
</script>

<div class="card">
  <Accordion>
    <AccordionItem>
      <div slot="summary" class="flex flex-row items-center gap-4">
        <QResponseStatus statusCode={latestResponse?.status_code} />
        <p class="font-mono text-sm">{qRequest.destination}</p>
      </div>
      <div slot="content">
        {#if !latestResponse?.body}
          <p>Loading...</p>
        {:else}
          <p>Latest response:</p>
          <!-- TODO: Add support for other content types -->
          <CodeBlock
            code={latestResponse.body}
            language={latestResponse.body.startsWith('<') ? 'HTML' : 'JSON'}
          />
        {/if}
      </div>
    </AccordionItem>
  </Accordion>
</div>
