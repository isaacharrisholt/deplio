<script lang="ts">
  import { SquareStack, Mails, Ship, Check, X } from 'lucide-svelte'
  import type { PageData } from './$types'
  import { format } from 'date-fns'
  import { capitalise } from '$lib/formatting'
  import { getToastStore } from '@skeletonlabs/skeleton'
  import { createForm } from '$lib/forms/client'

  export let data: PageData

  const { enhance, submitting } = createForm(data.form, getToastStore())
</script>

<section class="grid gap-8 md:grid-cols-2">
  {#if data.team_invites.length > 0}
    <div class="card variant-outline-tertiary col-span-full flex flex-col gap-8 p-8">
      <div class="flex flex-col gap-2">
        <h2 class="h2">Team invites</h2>
        <p>You have {data.team_invites.length} pending team invites.</p>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Expiry</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.team_invites as invite}
              <tr>
                <td>{invite.team?.name ?? ''}</td>
                <td>{format(new Date(invite.expires_at), 'MMMM dd, yyyy, HH:mm')}</td>
                <td>{capitalise(invite.role)}</td>
                <td class="flex flex-row items-center justify-end gap-4">
                  <form method="POST" use:enhance>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <input type="hidden" name="action" value="accept" />
                    <button
                      type="submit"
                      class="chip variant-filled-success ml-auto flex w-fit items-center gap-2"
                      disabled={$submitting}
                    >
                      Accept
                      <Check size={16} />
                    </button>
                  </form>

                  <form method="POST" use:enhance>
                    <input type="hidden" name="invite_id" value={invite.id} />
                    <input type="hidden" name="action" value="reject" />
                    <button
                      type="submit"
                      class="chip variant-filled-error ml-auto flex w-fit items-center gap-2"
                      disabled={$submitting}
                    >
                      Reject
                      <X size={16} />
                    </button>
                  </form>
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
  {/if}

  <a
    href="/dashboard/q"
    class="card flex h-60 flex-row items-center justify-between gap-4 p-8 !transition-none"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Q</h2>
      <p>Effortless serverless message queueing.</p>
    </div>

    <SquareStack size={64} strokeWidth={0.9} />
  </a>

  <div
    class="card flex h-60 flex-row items-center justify-between gap-4 p-8 text-surface-500-400-token"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Email</h2>
      <p>SQL-based email scheduling for developers. Coming soon.</p>
    </div>

    <Mails size={64} strokeWidth={0.9} />
  </div>

  <div
    class="card col-span-full flex h-80 flex-row items-center justify-between gap-4 p-16 text-surface-500-400-token"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Deploy</h2>
      <h3 class="h3">
        Preview branches. For your <span class="font-medium">backend</span>.
      </h3>
      <p>Coming soon.</p>
    </div>

    <Ship size={128} strokeWidth={0.6} />
  </div>
</section>
