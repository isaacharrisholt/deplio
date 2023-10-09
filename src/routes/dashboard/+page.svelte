<script lang="ts">
    import type { PageData } from './$types'

    export let data: PageData
</script>

<h1 class="h1">Dashboard</h1>
<h4 class="h4">{JSON.stringify(data.user)}</h4>
<h4 class="h4">{JSON.stringify(data.team)}</h4>

<a href="/dashboard/projects" class="btn variant-filled-secondary">Projects</a>
