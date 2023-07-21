<script lang="ts">
    import { page } from '$app/stores'
</script>

{#if !$page.data.session}
    <a href="/login" class="btn variant-outline-secondary">Log in</a>
    <a href="/signup" class="btn variant-filled-primary">Sign up</a>
{:else}
    <a href="/dashboard" class="btn variant-filled-primary">Dashboard</a>
    <a href="/logout" class="btn variant-outline-secondary">Log out</a>
{/if}
