<script lang="ts">
  import type { PageData } from './$types'
  import { Avatar } from '@skeletonlabs/skeleton'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { format_initials } from '$lib/formatting'

  export let data: PageData
</script>

<div class="flex flex-grow flex-col gap-4">
  <h2>Your details</h2>

  <div class="grid gap-12 md:grid-cols-[1fr_2fr]">
    <div class="flex flex-col gap-4">
      <form action="?/user_avatar" method="POST" class="flex flex-col gap-2">
        <button class="max-w-[180px] rounded-full">
          <Avatar
            src={data.user.avatar_url ?? ''}
            initials={format_initials(data.user)}
            width="w-full"
            rounded="rounded-full"
            border="border-4 border-surface-300-600-token hover:!border-primary-500"
          />
        </button>
        <p class="text-sm">Avatar</p>
      </form>
      <p>Max 2MB</p>
    </div>
    <form action="?/user" method="POST" class="flex flex-col gap-4">
      <TextInput id="first_name" label="First name" />
      <TextInput id="last_name" label="Last name" />
      <TextInput id="username" label="Username" />
      <TextInput id="email" label="Email" disabled />
      <button type="submit" class="btn variant-filled-primary w-fit">Save</button>
    </form>
  </div>
</div>
