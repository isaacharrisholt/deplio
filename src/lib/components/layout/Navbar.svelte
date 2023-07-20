<script lang="ts">
    import { page } from '$app/stores'
    import { AppBar } from '@skeletonlabs/skeleton'
    import { Menu } from 'lucide-svelte'
</script>

<AppBar
    regionRowMain="w-full lg:w-3/4 mx-auto"
    regionRowHeadline="p-0 !-mb-4 -mx-4"
    shadow="shadow-lg"
    gridColumns="grid-cols-3"
    slotTrail="place-content-end"
>
    <div slot="lead" class="flex flex-row items-center gap-8">
        <button class="lg:hidden">
            <Menu />
        </button>
        <h1>Deplio</h1>
    </div>

    <div class="hidden w-full flex-row items-center justify-center gap-4 lg:flex">
        <a href="/docs">Docs</a>
        <a href="/pricing">Pricing</a>
        <a href="/blog">Blog</a>
    </div>

    <div slot="trail" class="flex flex-row items-center gap-4">
        {#if !$page.data.session}
            <a href="/login" class="btn variant-outline-secondary">Log in</a>
            <a href="/signup" class="btn variant-filled-primary">Sign up</a>
        {:else}
            <a href="/dashboard" class="btn variant-filled-primary">Dashboard</a>
            <a href="/logout" class="btn variant-outline-secondary">Log out</a>
        {/if}
    </div>

    <!-- Using the headline slot to add a nice gradient separator -->
    <div
        slot="headline"
        class="grid h-[1px] w-full bg-gradient-to-r from-transparent via-surface-50 to-transparent"
    />
</AppBar>
