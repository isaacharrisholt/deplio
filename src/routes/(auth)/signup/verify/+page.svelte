<script lang="ts">
    import { createForm } from '$lib/forms/client.js'

    export let data
    const { form, errors, message, enhance } = createForm(data.form)
</script>

<!-- Session is null when signing up -->
<div class="grid h-screen w-full place-items-center">
    <div class="flex w-fit flex-col gap-4">
        <p>
            Thanks for signing up. We've sent you an email with a link to prove you are
            who you say you are 👀
        </p>
        <p>
            Either click the link in the email, or enter the included verification code
            below:
        </p>
        <form method="post" class="w-full" use:enhance>
            <input
                type="number"
                class="input"
                name="verificationCode"
                bind:value={$form.verificationCode}
            />
            <button type="submit" class="variant-form-material btn"
                >I am a real human. Beep boop.</button
            >
        </form>
    </div>
</div>
