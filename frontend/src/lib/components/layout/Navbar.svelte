<script lang="ts">
  import { AppBar, getDrawerStore } from '@skeletonlabs/skeleton'
  import { Menu } from 'lucide-svelte'
  import NavbarLinks from './NavbarLinks.svelte'
  import ActionButtons from './ActionButtons.svelte'
  import { page } from '$app/stores'
  import Logo from './Logo.svelte'
  import AccountSelector from '../AccountSelector.svelte'
  import DashboardNavbar from './DashboardNavbar.svelte'

  const drawerStore = getDrawerStore()

  $: isDashboard = $page.url.pathname.startsWith('/dashboard')
</script>

<AppBar
  regionRowMain="w-full mx-auto"
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
    class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-primary-50 to-transparent dark:via-primary-900"
    class:hidden={isDashboard}
  />
</AppBar>
{#if isDashboard}
  <DashboardNavbar />
  <div
    class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-primary-50 to-transparent"
  />
{/if}
