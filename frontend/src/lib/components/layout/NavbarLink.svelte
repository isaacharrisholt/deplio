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

<div class="w-fit">
  <a
    href={link.href}
    class={twMerge(
      'border-b-2 border-b-primary-500 border-opacity-0 p-2 text-center transition-all duration-200 rounded-tl-token rounded-tr-token',
      'hover:border-opacity-100 hover:bg-surface-200-700-token',
      $page.url.pathname.startsWith(link.href) && 'border-opacity-100',
      linkClass,
    )}
    on:click={drawerStore.close}
    data-sveltekit-preload-data={link.preload ?? 'hover'}
    >{link.name}
  </a>
</div>
