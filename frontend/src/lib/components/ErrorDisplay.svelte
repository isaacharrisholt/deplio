<script lang="ts">
  import { AlertTriangle } from 'lucide-svelte'

  export let message: string
</script>

<div class="card variant-filled-error flex flex-row items-center gap-4 p-4">
  <AlertTriangle size="24" />
  <p>{message}</p>
</div>
