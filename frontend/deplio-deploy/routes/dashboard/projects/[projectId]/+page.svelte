<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
  $: project = data.project
</script>

<h1 class="h1">{project.name}</h1>
