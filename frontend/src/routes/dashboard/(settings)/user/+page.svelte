<script lang="ts">
  import type { PageData } from './$types'
  import { Avatar } from '@skeletonlabs/skeleton'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { format_initials } from '$lib/formatting'
  import { createForm } from '$lib/forms/client'
  import { getToastStore, filter, NoirLight } from '@skeletonlabs/skeleton'
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte'

  export let data: PageData

  const { form, enhance, errors, submitting } = createForm(data.form, getToastStore(), {
    taintedMessage: '',
    invalidateAll: true,
  })
  const { enhance: avatar_enhance, submitting: avatar_submitting } = createForm(
    data.avatar_form,
    getToastStore(),
  )
  $form.first_name = data.user.first_name ?? undefined
  $form.last_name = data.user.last_name ?? undefined
  $form.username = data.user.username ?? ''

  let avatar_form_el: HTMLFormElement
  let avatar_input_el: HTMLInputElement
</script>

<NoirLight />

<div class="flex flex-grow flex-col gap-4">
  <h2>Your details</h2>

  <div class="grid gap-12 md:grid-cols-[1fr_2fr]">
    <div class="flex flex-col gap-4">
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
            src={data.user.avatar_url ?? ''}
            initials={format_initials(data.user)}
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
          Avatar (max 2MB)
          {#if $avatar_submitting}
            <LoadingSpinner width="w-2" />
          {/if}
        </p>
      </form>
    </div>
    <form action="?/user" method="POST" class="flex flex-col gap-4" use:enhance>
      <TextInput
        id="first_name"
        name="first_name"
        label="First name"
        bind:value={$form.first_name}
        errors={$errors.first_name}
      />
      <TextInput
        id="last_name"
        name="last_name"
        label="Last name"
        bind:value={$form.last_name}
        errors={$errors.last_name}
      />
      <TextInput
        id="username"
        name="username"
        label="Username"
        bind:value={$form.username}
        errors={$errors.username}
      />
      <TextInput id="email" label="Email" value={data.user.email} disabled />
      <button
        type="submit"
        class="btn variant-filled-primary w-fit"
        disabled={$submitting}>Save</button
      >
    </form>
  </div>
</div>
