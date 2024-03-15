<script lang="ts">
  import type { PageData } from './$types'
  import { getToastStore } from '@skeletonlabs/skeleton'
  import { createForm } from '$lib/forms/client'
  import { InputChip } from '@skeletonlabs/skeleton'
  import { z } from 'zod'
  import ErrorText from '$lib/components/forms/ErrorText.svelte'

  export let data: PageData

  const { form, enhance, errors, submitting } = createForm(data.form, getToastStore(), {
    taintedMessage: '',
    invalidateAll: true,
    async onUpdated({ form: submitted_form }) {
      if (submitted_form.valid) {
        emails = []
        $form.role = 'member'
      }
    },
  })

  let emails: string[] = []
</script>

<div class="card variant-soft-surface flex flex-grow flex-col gap-4 p-8">
  <h2>Invite team members</h2>

  <form method="POST" class="flex flex-col gap-4" use:enhance>
    <div class="flex flex-col gap-2">
      <label for="emails" class="label text-sm">Email addresses</label>
      <InputChip
        id="emails"
        name="email"
        type="email"
        disabled={$submitting}
        bind:value={emails}
        validation={(val) => {
          const success = z.string().email().safeParse(val).success
          if (!success) {
            $errors.emails = ['Invalid email address']
          }
          return success
        }}
        on:input={() => ($errors.emails = [])}
      />
      {#if $errors.emails}
        <ErrorText id="emails" errors={$errors.emails} />
      {/if}
    </div>

    {#each emails as email}
      <input type="hidden" name="emails" value={email} />
    {/each}

    <div class="flex flex-col gap-2">
      <label for="role" class="label text-sm">Role</label>
      <select
        id="role"
        class="select"
        name="role"
        disabled={$submitting}
        bind:value={$form.role}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      {#if $errors.role}
        <ErrorText id="role" errors={$errors.role} />
      {/if}
    </div>

    <button
      type="submit"
      class="btn variant-filled-secondary w-fit"
      disabled={$submitting || !emails.length}>Invite!</button
    >
  </form>
</div>
