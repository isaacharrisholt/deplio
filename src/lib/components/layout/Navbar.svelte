<script lang="ts">
    import { AppBar, drawerStore } from '@skeletonlabs/skeleton'
    import { Menu } from 'lucide-svelte'
    import NavbarLinks from './NavbarLinks.svelte'
    import ActionButtons from './ActionButtons.svelte'
</script>

<AppBar
    regionRowMain="w-full lg:w-3/4 mx-auto"
    regionRowHeadline="p-0 !-mb-4 -mx-4"
    shadow="shadow-lg"
    gridColumns="grid-cols-3"
    slotTrail="place-content-end"
    background="variant-glass-surface"
>
    <div slot="lead" class="flex flex-row items-center gap-8">
        <button class="lg:hidden" on:click={() => drawerStore.open()}>
            <Menu />
        </button>
        <a href="/" class="select-none">
            <h1>Deplio</h1>
        </a>
    </div>

    <div class="hidden w-full flex-row items-center justify-center gap-4 lg:flex">
        <NavbarLinks />
    </div>

    <div slot="trail" class="hidden flex-row items-center gap-4 sm:flex">
        <ActionButtons />
    </div>

    <!-- Using the headline slot to add a nice gradient separator -->
    <div
        slot="headline"
        class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-surface-50 to-transparent"
    />
</AppBar>
