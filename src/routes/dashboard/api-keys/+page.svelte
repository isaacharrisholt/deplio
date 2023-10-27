<script lang="ts">
  import CopyClick from '$lib/components/CopyClick.svelte'
  import Select from '$lib/components/forms/Select.svelte'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { createForm } from '$lib/forms/client'
  import { Undo2 } from 'lucide-svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const {
    form: newApiKeyForm,
    errors: newApiKeyErrors,
    enhance: newApiKeyEnhance,
    submitting: newApiKeySubmitting,
  } = createForm(data.newApiKeyForm, {
    async onUpdated({ form }) {
      if (form.message?.apiKey) {
        newApiKey = form.message.apiKey
        $newApiKeyForm.name = ''
      }
    },
  })
  $: {
    if (
      data.apiKeys.find(
        (apiKey) => apiKey.name.toLowerCase() === $newApiKeyForm.name.toLowerCase(),
      )
    ) {
      if (!$newApiKeyErrors.name) $newApiKeyErrors.name = []
      $newApiKeyErrors.name.push('You already have an API key with this name.')
      $newApiKeyErrors = $newApiKeyErrors
    } else {
      $newApiKeyErrors.name = []
    }
  }

  const { enhance: revokeApiKeyEnhance, submitting: revokeApiKeySubmitting } =
    createForm(data.revokeApiKeyForm)

  let newApiKey = ''

  function getStatusChip(apiKey: (typeof data.apiKeys)[number]) {
    if (apiKey.revoked_at) {
      return {
        text: `Revoked by ${
          apiKey.revoked_by.first_name
        } ${apiKey.revoked_by.last_name.slice(0, 1)}.`,
        variant: 'variant-filled-error',
      }
    }

    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return {
        text: 'Expired',
        variant: 'variant-filled-error',
      }
    }

    return {
      text: 'Active',
      variant: 'variant-filled-success',
    }
  }
</script>

<div class="flex flex-col gap-12">
  {#if newApiKey}
    <div class="card variant-soft-tertiary flex flex-col gap-4 p-8">
      <h3>Your new API key</h3>
      <p>You'll only see this once, so keep it safe!</p>
      <CopyClick text={newApiKey} />
      <button class="btn variant-filled-primary w-fit" on:click={() => (newApiKey = '')}
        >I'm done!</button
      >
    </div>
  {/if}

  <div class="card variant-soft-surface flex flex-col gap-4 p-8">
    <h3>New API key</h3>
    <form method="POST" action="?/new" class="flex flex-col gap-4" use:newApiKeyEnhance>
      <div class="flex flex-row gap-4">
        <TextInput
          id="name"
          name="name"
          label="API key name"
          placeholder="{data.user.first_name}'s API key"
          bind:value={$newApiKeyForm.name}
          errors={$newApiKeyErrors.name}
        />
        <Select
          id="expiry"
          name="expiry"
          label="Expiry"
          containerClass="w-fit min-w-[12rem]"
          bind:value={$newApiKeyForm.expiry}
          errors={$newApiKeyErrors.expiry}
        >
          <option value="never">Never</option>
          <option value="1h">1 hour</option>
          <option value="1d">1 day</option>
          <option value="1w">1 week</option>
          <option value="30d">30 days</option>
          <option value="1y">1 year</option>
        </Select>
      </div>
      <button
        type="submit"
        class="btn variant-filled-primary w-fit"
        disabled={!!($newApiKeySubmitting || $newApiKeyErrors.name?.length)}
        >Create</button
      >
    </form>
  </div>

  <div class="card variant-soft-surface flex flex-col gap-4 p-8">
    <h3>API keys</h3>
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Expiry</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.apiKeys as apiKey}
            <tr>
              <td>{apiKey.name}</td>
              <td class="font-mono">{apiKey.key_prefix}{'•'.repeat(16)}</td>
              <td
                >{apiKey.expires_at
                  ? new Date(apiKey.expires_at).toLocaleString()
                  : 'Never'}</td
              >
              <td
                ><div
                  class="chip {getStatusChip(apiKey)
                    .variant} pointer-events-none transition-all duration-300 ease-in-out"
                >
                  {getStatusChip(apiKey).text}
                </div></td
              >
              <td>
                {#if getStatusChip(apiKey).text === 'Active'}
                  <form
                    method="POST"
                    action="?/revoke"
                    class="w-full"
                    use:revokeApiKeyEnhance
                  >
                    <input type="hidden" name="id" value={apiKey.id} />
                    <button
                      type="submit"
                      class="chip variant-filled-error ml-auto flex w-fit items-center gap-2"
                      disabled={$revokeApiKeySubmitting}
                    >
                      Revoke
                      <Undo2 size={16} />
                    </button>
                  </form>
                {:else}
                  <div class="w-full" />
                {/if}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="text-center">
                No API keys found. Create one above!
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
