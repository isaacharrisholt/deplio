<script lang="ts">
  import type { PageData } from './$types'
  import { Avatar } from '@skeletonlabs/skeleton'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { format_initials } from '$lib/formatting'

  export let data: PageData
</script>

<div class="flex flex-grow flex-col gap-4">
  <div class="flex flex-row items-center justify-between gap-4">
    <h2>Your team</h2>
    <a href="/dashboard/team/new" class="btn variant-filled-secondary">Create team</a>
  </div>

  <div class="grid gap-12 md:grid-cols-[1fr_2fr]">
    <div class="flex flex-col gap-4">
      <form action="?/team_avatar" method="POST" class="flex flex-col gap-2">
        <button class="max-w-[180px] rounded-full">
          <Avatar
            src={data.team.avatar_url ?? ''}
            initials={format_initials({ username: data.team.name })}
            width="w-full"
            rounded="rounded-full"
            border="border-4 border-surface-300-600-token hover:!border-primary-500"
          />
        </button>
        <p class="text-sm">Avatar</p>
      </form>
      <p>Max 2MB</p>
    </div>
    <form action="?/team" method="POST" class="flex flex-col gap-4">
      <TextInput id="name" label="Name" />
      <button type="submit" class="btn variant-filled-primary w-fit">Save</button>
    </form>
  </div>
</div>
