<script lang="ts" context="module">
    export type PageMeta = {
        title?: string
        description?: string
    }
</script>

<script lang="ts">
    import { page } from '$app/stores'
    import { PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'

    export let defaultMeta: NonNullable<PageMeta>

    let meta: PageMeta = defaultMeta
    $: {
        meta = {
            ...defaultMeta,
            ...$page.data.meta,
        }
        if (PUBLIC_DEPLOYMENT_ENV !== 'prod') {
            meta.title = `${(PUBLIC_DEPLOYMENT_ENV ?? 'local').toUpperCase()}: ${
                meta.title
            }`
        }
    }
</script>

<svelte:head>
    <title>{meta.title}</title>
    <meta name="description" content={meta.description} />
</svelte:head>
