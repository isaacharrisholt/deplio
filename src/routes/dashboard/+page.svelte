<script lang="ts">
    import type { PageData } from './$types'

    export let data: PageData
</script>

<h1>Dashboard</h1>
<h4>{JSON.stringify(data.user)}</h4>
