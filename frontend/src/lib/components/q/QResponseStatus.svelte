<script lang="ts">
  import { twMerge } from 'tailwind-merge'
  import LoadingSpinner from '../LoadingSpinner.svelte'

  export let statusCode: number | null | undefined
  function getStatusClass(statusCode?: number | null) {
    if (!statusCode) {
      return 'hidden'
    }

    if (statusCode > 400) {
      return 'variant-soft-success'
    }

    if (statusCode > 300) {
      return 'variant-soft-warning'
    }

    return 'variant-soft-success'
  }
</script>

<div
  class={twMerge(
    'card p-1 transition-all duration-300 ease-in-out',
    getStatusClass(statusCode),
  )}
>
  {#if !statusCode}
    <LoadingSpinner />
  {:else}
    <p class="text-xs">{statusCode}</p>
  {/if}
</div>
