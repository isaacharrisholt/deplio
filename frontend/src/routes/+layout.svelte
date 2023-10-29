<script lang="ts">
  import '@fontsource-variable/space-grotesk'
  import '@fontsource/ubuntu/300.css'
  import '@fontsource/ubuntu/400.css'
  import '@fontsource/ubuntu/500.css'
  import '@fontsource/ubuntu/700.css'
  import '@fontsource/ubuntu/300-italic.css'
  import '@fontsource/ubuntu/400-italic.css'
  import '@fontsource/ubuntu/500-italic.css'
  import '@fontsource/ubuntu/700-italic.css'
  // The ordering of these imports is critical to your app working properly
  import '../theme.postcss'
  // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
  import '@skeletonlabs/skeleton/styles/skeleton.css'
  // Most of your app wide CSS should be put in this file
  import '../app.postcss'
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { Toast, AppShell, Drawer } from '@skeletonlabs/skeleton'
  import Meta from '$lib/components/Meta.svelte'
  import Navbar from '$lib/components/layout/Navbar.svelte'
  import DrawerNav from '$lib/components/layout/DrawerNav.svelte'

  export let data

  let { supabase, session } = data
  $: ({ supabase, session } = data)

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth')
      }
    })

    return () => subscription.unsubscribe()
  })
</script>

<Meta
  defaultMeta={{ title: 'Deplio', description: 'Preview branches for your backend.' }}
/>
<Toast position="br" />

<Drawer width="w-fit">
  <DrawerNav />
</Drawer>

<AppShell>
  <svelte:fragment slot="header">
    <Navbar />
  </svelte:fragment>

  <div class="mx-auto w-full p-4 sm:w-4/5 sm:p-8 lg:p-16 xl:w-2/3">
    <slot />
  </div>

  <svelte:fragment slot="pageFooter">Footer</svelte:fragment>
</AppShell>

<style lang="postcss">
  :global(h1) {
    @apply h1;
  }

  :global(h2) {
    @apply h2;
  }

  :global(h3) {
    @apply h3;
  }

  :global(h4) {
    @apply h4;
  }

  :global(h5) {
    @apply h5;
  }

  :global(h6) {
    @apply h6;
  }
</style>
