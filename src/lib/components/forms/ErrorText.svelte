<script lang="ts">
    /** ID of the _parent_ component */
    export let id: string
    export let errors: string[] = []
</script>

{#if errors?.length}
    <p class="variant-filled-error p-2" id="{id}-error">{errors.join(', ')}</p>
{/if}
