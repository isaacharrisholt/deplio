<script lang="ts">
  import { AlertCircle } from 'lucide-svelte'

  /** ID of the _parent_ component */
  export let id: string
  export let errors: string[] = []
</script>

{#if errors?.length}
  <div
    class="variant-filled-error flex w-full max-w-full flex-row items-center gap-2 p-2 text-sm"
  >
    <AlertCircle size={16} />
    <p id="{id}-error">{errors.join(', ')}</p>
  </div>
{/if}
