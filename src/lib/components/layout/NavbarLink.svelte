<script lang="ts" context="module">
  export type Navlink = {
    name: string
    href: string
    preload?: 'hover' | 'tap' | 'off'
  }
</script>

<script lang="ts">
  import { page } from '$app/stores'
  import { twMerge } from 'tailwind-merge'
  import { drawerStore } from '@skeletonlabs/skeleton'

  export let link: Navlink
  let linkClass = ''
  export { linkClass as class }
</script>

<div class="relative w-fit">
  <a
    href={link.href}
    class={twMerge(
      'p-2 text-center transition-colors duration-200 rounded-token',
      'after:absolute after:-bottom-2 after:block after:h-0.5 after:w-full after:bg-primary-50',
      "after:rounded-full after:opacity-0 after:transition-all after:content-['']",
      'hover:bg-surface-300-600-token hover:after:opacity-100',
      $page.url.pathname.startsWith(link.href) && 'after:opacity-100',
      linkClass,
    )}
    on:click={drawerStore.close}
    data-sveltekit-preload-data={link.preload ?? 'hover'}
    >{link.name}
  </a>
</div>
