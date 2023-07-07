<script lang="ts">
    // The ordering of these imports is critical to your app working properly
    import '@skeletonlabs/skeleton/themes/theme-rocket.css'
    // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
    import '@skeletonlabs/skeleton/styles/skeleton.css'
    // Most of your app wide CSS should be put in this file
    import '../app.postcss'
    import { invalidate } from '$app/navigation'
    import { onMount } from 'svelte'
    import Meta from '$lib/components/Meta.svelte'

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
<slot />
