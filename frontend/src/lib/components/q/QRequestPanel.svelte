<script lang="ts">
  import type { QRequestWithResponses } from '@deplio/sdk'
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton'
  import QResponseStatus from './QResponseStatus.svelte'
  import CodeBlock from '../CodeBlock.svelte'
  // import { ArrowRight, Eye } from 'lucide-svelte'

  const MAX_RESPONSE_BODY_LENGTH = 1000

  export let request: QRequestWithResponses
  $: q_responses = request.responses

  $: latest_response = q_responses[q_responses.length - 1]
  $: language = latest_response?.body?.startsWith('<')
    ? ('HTML' as const)
    : ('JSON' as const)
  $: formatted_body =
    language === 'JSON' && latest_response?.body
      ? JSON.stringify(JSON.parse(latest_response.body), null, 2)
      : latest_response?.body
  let display_body: string
  let truncated = false

  $: if ((formatted_body?.length ?? 0) > MAX_RESPONSE_BODY_LENGTH) {
    display_body = formatted_body?.slice(0, MAX_RESPONSE_BODY_LENGTH) + '...'
    truncated = true
  } else {
    display_body = formatted_body ?? ''
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
        <QResponseStatus statusCode={latest_response?.status_code} />
        <p class="font-mono text-sm">{request.destination}</p>
      </div>
      <div slot="content" class="flex flex-col gap-2 pb-2">
        {#if !latest_response?.body}
          <p>Loading...</p>
        {:else}
          <p>Latest response:</p>
          {#if truncated}
            <p class="text-sm text-gray-500">
              The response body is too long ({latest_response?.body?.length ?? 0} characters)
              to display in full.&nbsp;
              <a
                href="/dashboard/q/requests/{request.id}"
                class="underline"
                on:click={(e) => e.stopPropagation()}
                on:keypress={(e) => e.stopPropagation()}
              >
                View full response.
              </a>
            </p>
          {/if}
          <!-- TODO: Add support for other content types -->
          <CodeBlock code={display_body} {language} />
        {/if}
      </div>
    </AccordionItem>
  </Accordion>
</div>
