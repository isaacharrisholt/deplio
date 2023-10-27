<script lang="ts">
  import NavbarLink, { type Navlink } from './NavbarLink.svelte'

  let linkClass = ''
  export { linkClass as class }

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
  <NavbarLink {link} class={linkClass} />
{/each}
