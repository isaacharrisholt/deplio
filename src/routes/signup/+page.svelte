<script lang="ts">
    import type { PageData } from './$types'
    import { enhance } from '$app/forms'

    export let data: PageData
</script>

<form method="POST" use:enhance>
    <input type="email" name="email" placeholder="Email" class="input" />
    <input type="password" name="password" placeholder="Password" class="input" />
    <button type="submit">Sign up</button>
</form>
