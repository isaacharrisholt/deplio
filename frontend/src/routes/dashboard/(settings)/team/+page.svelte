<script lang="ts">
  import type { PageData } from './$types'
  import { Avatar } from '@skeletonlabs/skeleton'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { format_initials } from '$lib/formatting'
  import { getToastStore, filter, NoirLight } from '@skeletonlabs/skeleton'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'
  import { createForm } from '$lib/forms/client'

  export let data: PageData

  const { form, enhance, errors, submitting } = createForm(data.form, getToastStore(), {
    taintedMessage: '',
    invalidateAll: true,
  })
  const { enhance: avatar_enhance, submitting: avatar_submitting } = createForm(
    data.avatar_form,
    getToastStore(),
  )
  $: $form.name = data.team.name ?? ''

  let avatar_form_el: HTMLFormElement
  let avatar_input_el: HTMLInputElement
</script>

<NoirLight />

<div class="flex flex-grow flex-col gap-4">
  <div class="flex flex-row items-center justify-between gap-4">
    <h2>Your team</h2>
    <a href="/dashboard/team/new" class="btn variant-filled-secondary">Create team</a>
  </div>

  <div class="grid gap-12 md:grid-cols-[1fr_2fr]">
    <div class="flex flex-col gap-4">
      {#if data.team.role === 'admin'}
        <form
          action="?/avatar"
          method="POST"
          class="flex flex-col gap-2"
          use:avatar_enhance
          bind:this={avatar_form_el}
        >
          <button
            class="max-w-[180px] rounded-full"
            type="button"
            on:click={() => avatar_input_el?.click()}
            disabled={$avatar_submitting}
          >
            <Avatar
              src={data.team.avatar_url ?? ''}
              initials={format_initials({ username: data.team.name })}
              width="w-full"
              rounded="rounded-full"
              border="border-4 border-surface-300-600-token hover:!border-primary-500"
              action={filter}
              actionParams={$avatar_submitting ? '#NoirLight' : undefined}
            />
          </button>
          <input
            type="file"
            name="avatar"
            class="hidden"
            accept="image/*"
            size="2048"
            bind:this={avatar_input_el}
            on:change={() => {
              if (avatar_input_el.files?.length) {
                avatar_form_el.requestSubmit()
              }
            }}
          />
          <p class="text-sm">
            Avatar
            {#if $avatar_submitting}
              <LoadingSpinner width="w-2" />
            {/if}
          </p>
        </form>
        <p>Max 2MB</p>
      {:else}
        <div class="max-w-[180px] rounded-full">
          <Avatar
            src={data.team.avatar_url ?? ''}
            initials={format_initials({ username: data.team.name })}
            width="w-full"
            rounded="rounded-full"
            border="border-4 border-surface-300-600-token hover:!border-primary-500"
          />
        </div>
      {/if}
    </div>
    <form action="?/team" method="POST" class="flex flex-col gap-4" use:enhance>
      <TextInput
        id="name"
        name="name"
        label="Name"
        bind:value={$form.name}
        errors={$errors.name}
        disabled={data.team.role !== 'admin' || data.team.type === 'personal'}
      />
      {#if data.team.role === 'admin' && !data.team.type === 'personal'}
        <button
          type="submit"
          class="btn variant-filled-primary w-fit"
          disabled={$submitting}>Save</button
        >
      {/if}
    </form>
  </div>
</div>
