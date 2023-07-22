<script lang="ts">
    import type { PageData } from './$types'

    export let data: PageData
</script>

<h1>Dashboard</h1>
<h4>{JSON.stringify(data.user)}</h4>
<h4>{JSON.stringify(data.team)}</h4>

<a
    href="https://github.com/apps/depl-io-local/installations/new"
    class="variant-form-material btn">Test</a
>
