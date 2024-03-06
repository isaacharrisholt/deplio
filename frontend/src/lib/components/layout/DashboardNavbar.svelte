<script lang="ts">
  import NavbarLink, { type Navlink } from './NavbarLink.svelte'

  const nav_links: Navlink[] = [
    {
      name: 'Q',
      href: '/dashboard/q',
    },
    {
      name: 'API Keys',
      href: '/dashboard/api-keys',
    },
  ]

  const nav_end_links: Navlink[] = [
    {
      name: 'Settings',
      href: '/dashboard/team',
    },
  ]
</script>

<nav
  class="flex w-full flex-row flex-wrap items-center gap-4 px-8 py-2 bg-surface-100-800-token"
>
  {#each nav_links as link}
    <NavbarLink {link} />
  {/each}

  <div class="ml-auto" />

  {#each nav_end_links as link}
    <NavbarLink {link} />
  {/each}
</nav>
