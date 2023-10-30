<script lang="ts">
  import NavbarLink, { type Navlink } from './NavbarLink.svelte'

  const navlinks: Navlink[] = [
    {
      name: 'Q',
      href: '/dashboard/q',
    },
    {
      name: 'API Keys',
      href: '/dashboard/api-keys',
    },
  ]
</script>

{#each navlinks as link}
  <NavbarLink {link} />
{/each}
