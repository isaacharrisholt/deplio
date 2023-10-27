<script lang="ts">
    import { twMerge } from 'tailwind-merge'
    import type { Variant } from '$lib/types/styling'
    import ErrorText from './ErrorText.svelte'

    export let id: string
    export let name: string | null = null
    export let variant: Variant | null = null
    export let label: string | null = null
    export let placeholder: string | null = null
    /**
     * String array of errors to display
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export let errors: any = [] as string[]
    export let required = false
    export let disabled = false
    export let readonly = false
    export let autocomplete: 'on' | 'off' = 'on'
    export let value = ''

    let classes = ''
    export { classes as class }
    export let containerClass = ''
</script>

<div class={twMerge('flex w-full flex-col gap-2', containerClass)}>
    {#if label}
        <label for={id} class="label text-sm">{label}</label>
    {/if}
    <select
        bind:value
        class={twMerge('select', variant, classes)}
        {id}
        {name}
        {placeholder}
        {required}
        {disabled}
        {autocomplete}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={!!errors?.length}
        aria-errormessage={errors?.length ? `${id}-error` : null}
        aria-required={required}
        class:input-error={!!errors?.length}
    >
        <slot />
    </select>
    <ErrorText {id} {errors} />
</div>
