<script lang="ts">
    import type { PageData } from './$types'

    export let data: PageData
</script>

<h4>{JSON.stringify(data.githubInstallations)}</h4>
<h4>{JSON.stringify(data.repos)}</h4>

<a
    href="https://github.com/apps/depl-io-local/installations/new"
    class="variant-form-material btn">Connect GitHub</a
>
