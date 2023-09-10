<script lang="ts">
    import type { providerAuthFormSchema } from '$lib/forms/auth'
    import { createForm } from '$lib/forms/client'
    import { Github} from 'lucide-svelte'
    import type { Icon } from '../types'
    import type { SuperValidated } from 'sveltekit-superforms'

    export let data: SuperValidated<typeof providerAuthFormSchema>
    export let action = 'Sign up'

    const { enhance, submitting } = createForm(data)

    type ProviderDefinition = {
        name: string
        displayName: string
        icon: Icon
        background: `bg-${string}`
    }

    const providers: ProviderDefinition[] = [
        {
            name: 'github',
            displayName: 'GitHub',
            icon: Github,
            background: 'bg-[#333]',
        },
    ]
</script>

<form action="/auth/provider?/providerAuth" method="POST" class="w-full" use:enhance>
    {#each providers as provider}
        <button
            type="submit"
            class="btn flex w-full flex-row items-center gap-2 {provider.background}"
            disabled={$submitting}
        >
            <svelte:component this={provider.icon} />
            {action} with {provider.displayName}
        </button>
        <input type="hidden" name="provider" value={provider.name} />
    {/each}
</form>
