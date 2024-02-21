<script lang="ts">
  import { page } from '$app/stores'
  import { getDrawerStore } from '@skeletonlabs/skeleton'

  const drawerStore = getDrawerStore()
</script>

{#if !$page.data.session}
  <a on:click={drawerStore.close} href="/login" class="btn variant-outline-primary"
    >Log in</a
  >
  <a on:click={drawerStore.close} href="/signup" class="btn variant-filled-secondary"
    >Sign up</a
  >
{:else}
  <a on:click={drawerStore.close} href="/dashboard" class="btn variant-filled-secondary"
    >Dashboard</a
  >
  <a on:click={drawerStore.close} href="/logout" class="btn variant-outline-primary"
    >Log out</a
  >
{/if}
