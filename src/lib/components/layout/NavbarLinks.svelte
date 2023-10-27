<script lang="ts">
  import NavbarLink, { type Navlink } from './NavbarLink.svelte'

  const navlinks: Navlink[] = [
    {
      name: 'Features',
      href: '/features',
    },
    {
      name: 'Pricing',
      href: '/pricing',
    },
  ]
</script>

{#each navlinks as link}
  <NavbarLink {link} />
{/each}
