<script lang="ts">
  import { AppBar, drawerStore } from '@skeletonlabs/skeleton'
  import { Menu } from 'lucide-svelte'
  import NavbarLinks from './NavbarLinks.svelte'
  import ActionButtons from './ActionButtons.svelte'
  import { page } from '$app/stores'
  import DashboardNavbarLinks from './DashboardNavbarLinks.svelte'
  import Logo from './Logo.svelte'
  import AccountSelector from '../AccountSelector.svelte'

  $: isDashboard = $page.url.pathname.startsWith('/dashboard')
</script>

<AppBar
  regionRowMain="w-full lg:w-3/4 mx-auto"
  regionRowHeadline="p-0 !-mb-4 -mx-4"
  shadow="shadow-lg"
  gridColumns="grid-cols-3"
  slotTrail="place-content-end"
>
  <div slot="lead" class="flex flex-row items-center gap-8">
    <button class="lg:hidden" on:click={() => drawerStore.open()}>
      <Menu />
    </button>
    {#if isDashboard}
      <AccountSelector />
    {:else}
      <Logo />
    {/if}
  </div>

  <nav class="hidden w-full flex-row items-center justify-center gap-4 lg:flex">
    <NavbarLinks />
  </nav>

  <div slot="trail" class="hidden flex-row items-center gap-4 sm:flex">
    <ActionButtons />
  </div>

  <!-- Using the headline slot to add a nice gradient separator -->
  <div
    slot="headline"
    class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-primary-50 to-transparent"
    class:hidden={isDashboard}
  />
</AppBar>
{#if isDashboard}
  <nav
    class="flex w-full flex-row flex-wrap items-center gap-4 px-8 py-2 bg-surface-100-800-token"
  >
    <DashboardNavbarLinks />
  </nav>
  <div
    class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-primary-50 to-transparent"
  />
{/if}
