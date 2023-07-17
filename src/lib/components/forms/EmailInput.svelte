<script lang="ts">
    import type { Variant } from '$lib/types/styling'
    import TextInput from './TextInput.svelte'

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

<TextInput
    type="email"
    bind:value
    class={classes}
    {variant}
    {label}
    {id}
    {name}
    {placeholder}
    {minlength}
    {maxlength}
    {required}
    {disabled}
    {readonly}
    {autocomplete}
    {pattern}
/>
