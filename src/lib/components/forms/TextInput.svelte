<script lang="ts">
    import { twMerge } from 'tailwind-merge'
    import type { Variant } from '$lib/types/styling'
    import ErrorText from './ErrorText.svelte'

    export let type: 'text' | 'email' | 'password' = 'text'
    export let id: string
    export let name: string | null = null
    export let variant: Variant | null = null
    export let label: string | null = null
    export let placeholder: string | null = null
    /**
     * String array of errors to display
     */
    export let errors: any = [] as string[]
    export let minlength: number | null = null
    export let maxlength: number | null = null
    export let required: boolean = false
    export let disabled: boolean = false
    export let readonly: boolean = false
    export let autocomplete: 'on' | 'off' = 'on'
    export let pattern: RegExp | null = null
    export let value: string

    let classes = ''
    export { classes as class }

    $: errors = errors as string[]
</script>

<div class="flex w-full flex-col gap-2">
    {#if label}
        <label for={id} class="label">{label}</label>
    {/if}
    <input
        {...{ type }}
        bind:value
        class={twMerge('input', variant, classes)}
        {id}
        {name}
        {placeholder}
        {minlength}
        {maxlength}
        {required}
        {disabled}
        {readonly}
        {autocomplete}
        pattern={pattern?.toString().substring(1, pattern?.toString().length - 1)}
        aria-disabled={disabled}
        aria-readonly={readonly}
        aria-invalid={!!errors?.length}
        aria-errormessage={!!errors?.length ? `${id}-error` : null}
        aria-required={required}
        class:input-error={!!errors?.length}
    />
    <ErrorText {id} {errors} />
</div>
