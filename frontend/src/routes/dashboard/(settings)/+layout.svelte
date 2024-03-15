<script lang="ts">
  import { twMerge } from 'tailwind-merge'
  import type { LayoutData } from './$types'
  import { TabAnchor, TabGroup } from '@skeletonlabs/skeleton'
  import { page } from '$app/stores'

  export let data: LayoutData

  const pages = [
    { href: 'team', label: data.team.name },
    { href: 'user', label: 'Your details' },
  ] as const

  $: current_page = $page.url.pathname.split('/').pop()
</script>

<div class="flex flex-col gap-12">
  <TabGroup regionList="gap-4">
    {#each pages as p}
      <TabAnchor
        href={p.href}
        class={twMerge(
          'btn justify-start text-left',
          'transition-all duration-150 ease-in-out',
          'border-b-primary-100-800-token border-b-2',
          'hover:!variant-filled-primary',
          p.href === current_page ? 'variant-soft-primary' : 'variant-outline-surface',
        )}>{p.label}</TabAnchor
      >
    {/each}
  </TabGroup>

  <div class="card variant-soft-surface flex flex-col gap-4 p-8">
    <slot />
  </div>
</div>
