<script lang="ts">
  import { Copy, Check } from 'lucide-svelte'
  export let text: string
  export let copyText = text

  let copying = false

  function copy() {
    navigator.clipboard.writeText(copyText)
    copying = true
    setTimeout(() => {
      copying = false
    }, 1000)
  }
</script>

<button
  class="input flex flex-row items-center gap-2 p-2 text-left text-on-surface-token"
  on:click={copy}
>
  <div class="flex-grow">
    {text}
  </div>
  <div class="grid grid-cols-1 grid-rows-1">
    <div
      class="col-start-1 row-start-1 transform transition-transform duration-300 ease-in-out"
      class:scale-0={copying}
    >
      <Copy />
    </div>
    <div
      class="col-start-1 row-start-1 transform text-success-500 transition-transform duration-300 ease-in-out"
      class:scale-0={!copying}
    >
      <Check />
    </div>
  </div>
</button>
