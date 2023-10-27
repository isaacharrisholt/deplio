<script lang="ts">
  import { drawerStore } from '@skeletonlabs/skeleton'
  import ActionButtons from './ActionButtons.svelte'
  import NavbarLinks from './NavbarLinks.svelte'
</script>

<div class="flex flex-col items-start gap-4 p-16">
  <a href="/" class="select-none" on:click={drawerStore.close}><h2>Deplio</h2></a>
  <NavbarLinks linkClass="w-full min-w-fit" />
  <div class="flex flex-row flex-wrap gap-4">
    <ActionButtons />
  </div>
</div>
