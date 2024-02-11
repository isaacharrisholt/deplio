<script lang="ts">
  import { createForm } from '$lib/forms/client'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { getToastStore } from '@skeletonlabs/skeleton'

  const toastStore = getToastStore()

  export let data
  const { form, errors, enhance } = createForm(data.form, toastStore)
</script>

<!-- Session is null when signing up -->
<div class="grid w-full place-items-center">
  <div class="flex w-fit max-w-xs flex-col justify-center gap-4 sm:w-80">
    <p>
      Thanks for signing up. We've sent you an email with a link to prove you are who
      you say you are 👀
    </p>
    <p>
      Either click the link in the email, or enter the included verification code below:
    </p>
    <form method="post" class="flex w-full flex-col gap-4" use:enhance>
      <TextInput
        id="verificationCode"
        name="verificationCode"
        bind:value={$form.verificationCode}
        errors={$errors.verificationCode}
        pattern={/^[0-9]{6}$/}
      />
      <button type="submit" class="btn variant-filled-secondary"
        >I am a real human. Beep boop.</button
      >
    </form>
  </div>
</div>
