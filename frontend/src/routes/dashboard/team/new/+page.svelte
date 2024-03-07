<script lang="ts">
  import type { PageData } from './$types'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { getToastStore } from '@skeletonlabs/skeleton'
  import { createForm } from '$lib/forms/client'

  export let data: PageData

  const { form, enhance, errors, submitting } = createForm(data.form, getToastStore(), {
    taintedMessage: '',
    invalidateAll: true,
  })
</script>

<div class="card variant-soft-surface flex flex-grow flex-col gap-4 p-8">
  <h2>Create new team</h2>

  <form method="POST" class="flex flex-col gap-4" use:enhance>
    <TextInput
      id="name"
      name="name"
      label="Name"
      bind:value={$form.name}
      errors={$errors.name}
    />
    <button
      type="submit"
      class="btn variant-filled-secondary w-fit"
      disabled={$submitting}>Create!</button
    >
  </form>
</div>
