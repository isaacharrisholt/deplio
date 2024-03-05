<script lang="ts">
  import type { QRequest, QResponse } from '$lib/types/supabase'
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton'
  import QResponseStatus from './QResponseStatus.svelte'
  import CodeBlock from '../CodeBlock.svelte'
  // import { ArrowRight, Eye } from 'lucide-svelte'

  const MAX_RESPONSE_BODY_LENGTH = 1000

  export let qRequest: QRequest
  // Even though we're only using the latest response, require all
  // as we'll use them in the future once each request can have multiple responses
  // (e.g. for retries)
  export let qResponses: QResponse[]

  $: latestResponse = qResponses[qResponses.length - 1]
  $: language = latestResponse?.body?.startsWith('<')
    ? ('HTML' as const)
    : ('JSON' as const)
  $: formattedBody =
    language === 'JSON' && latestResponse?.body
      ? JSON.stringify(JSON.parse(latestResponse.body), null, 2)
      : latestResponse?.body
  let displayBody: string
  let truncated = false

  $: if ((formattedBody?.length ?? 0) > MAX_RESPONSE_BODY_LENGTH) {
    displayBody = formattedBody?.slice(0, MAX_RESPONSE_BODY_LENGTH) + '...'
    truncated = true
  } else {
    displayBody = formattedBody ?? ''
    truncated = false
  }
</script>

<div class="card">
  <Accordion>
    <AccordionItem>
      <div slot="summary" class="flex w-full flex-row items-center gap-4">
        <!-- <a -->
        <!--   href="/dashboard/q/requests/{qRequest.id}" -->
        <!--   class="w-fit" -->
        <!--   on:click={(e) => e.stopPropagation()} -->
        <!--   on:keypress={(e) => e.stopPropagation()} -->
        <!-- > -->
        <!--   <button class="btn btn-sm variant-glass-primary"> -->
        <!--     <Eye size={14} /> -->
        <!--   </button> -->
        <!-- </a> -->
        <QResponseStatus statusCode={latestResponse?.status_code} />
        <p class="font-mono text-sm">{qRequest.destination}</p>
      </div>
      <div slot="content" class="flex flex-col gap-2 pb-2">
        {#if !latestResponse?.body}
          <p>Loading...</p>
        {:else}
          <p>Latest response:</p>
          {#if truncated}
            <p class="text-sm text-gray-500">
              The response body is too long ({latestResponse?.body?.length ?? 0} characters)
              to display in full.&nbsp;
              <a
                href="/dashboard/q/requests/{qRequest.id}"
                class="underline"
                on:click={(e) => e.stopPropagation()}
                on:keypress={(e) => e.stopPropagation()}
              >
                View full response.
              </a>
            </p>
          {/if}
          <!-- TODO: Add support for other content types -->
          <CodeBlock code={displayBody} {language} />
        {/if}
      </div>
    </AccordionItem>
  </Accordion>
</div>
