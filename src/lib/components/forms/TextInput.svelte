<script lang="ts">
    import { twMerge } from 'tailwind-merge'
    import type { Variant } from '$lib/types/styling'
    import ErrorText from './ErrorText.svelte'

    export let type: 'text' | 'email' | 'password' | 'search' = 'text'
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
    export let minlength: number | null = null
    export let maxlength: number | null = null
    export let required = false
    export let disabled = false
    export let readonly = false
    export let autocomplete: 'on' | 'off' = 'on'
    export let pattern: RegExp | null = null
    export let value = ''

    let classes = ''
    export { classes as class }
</script>

<div class="flex w-full flex-col gap-2">
    {#if label}
        <label for={id} class="label text-sm">{label}</label>
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
        aria-errormessage={errors?.length ? `${id}-error` : null}
        aria-required={required}
        class:input-error={!!errors?.length}
    />
    <ErrorText {id} {errors} />
</div>

<style>
    input[type='search']::-webkit-search-cancel-button {
        -webkit-appearance: none;
        background-color: white;
        -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23777'><path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/></svg>");
        background-size: 20px 20px;
        height: 20px;
        width: 20px;
    }
</style>
