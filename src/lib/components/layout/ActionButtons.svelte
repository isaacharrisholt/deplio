<script lang="ts">
    import { page } from '$app/stores'
    import { drawerStore } from '@skeletonlabs/skeleton'
</script>

{#if !$page.data.session}
    <a on:click={drawerStore.close} href="/login" class="btn variant-outline-secondary"
        >Log in</a
    >
    <a on:click={drawerStore.close} href="/signup" class="btn variant-filled-primary"
        >Sign up</a
    >
{:else}
    <a on:click={drawerStore.close} href="/dashboard" class="btn variant-filled-primary"
        >Dashboard</a
    >
    <a on:click={drawerStore.close} href="/logout" class="btn variant-outline-secondary"
        >Log out</a
    >
{/if}
