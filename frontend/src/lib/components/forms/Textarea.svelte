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
  export let minlength: number | null = null
  export let maxlength: number | null = null
  export let required = false
  export let disabled = false
  export let readonly = false
  export let autocomplete: HTMLTextAreaElement['autocomplete'] | null = 'on'
  export let value = ''
  export let rows = 5
  export let cols = 20

  let classes = ''
  export { classes as class }
</script>

<div class="flex w-full flex-col gap-2">
  {#if label}
    <label for={id} class="label text-sm">{label}</label>
  {/if}
  <textarea
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
    {rows}
    {cols}
    aria-disabled={disabled}
    aria-readonly={readonly}
    aria-invalid={!!errors?.length}
    aria-errormessage={errors?.length ? `${id}-error` : null}
    aria-required={required}
    class:input-error={!!errors?.length}
  />
  <ErrorText {id} {errors} />
</div>
