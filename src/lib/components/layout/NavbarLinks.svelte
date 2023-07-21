<script lang="ts">
    import { page } from '$app/stores'
    import { twMerge } from 'tailwind-merge'
    import { drawerStore } from '@skeletonlabs/skeleton'

    type Navlink = {
        name: string
        href: string
        preload?: 'hover' | 'tap' | 'off'
    }

    export let linkClass = ''

    const navlinks: Navlink[] = [
        {
            name: 'Features',
            href: '/features',
        },
        {
            name: 'Pricing',
            href: '/pricing',
        },
    ]
</script>

{#each navlinks as link}
    <a
        href={link.href}
        class={twMerge(
            'p-2 transition-colors duration-200 rounded-token hover:bg-surface-300-600-token',
            linkClass,
        )}
        class:bg-surface-300-600-token={$page.url.pathname.startsWith(link.href)}
        on:click={drawerStore.close}
        data-sveltekit-preload-data={link.preload ?? 'hover'}>{link.name}</a
    >
{/each}
