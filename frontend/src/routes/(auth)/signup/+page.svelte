<script lang="ts">
  import EmailInput from '$lib/components/forms/EmailInput.svelte'
  import PasswordInput from '$lib/components/forms/PasswordInput.svelte'
  import ProviderAuthForm from '$lib/components/forms/ProviderAuthForm.svelte'
  import { emailSignupFormSchema } from '$lib/forms/auth'
  import { createForm } from '$lib/forms/client'
  import type { PageData } from './$types'

  export let data: PageData
  const {
    form: emailSignupForm,
    errors: emailSignupFormErrors,
    enhance: emailSignupFormEnhance,
  } = createForm(data.emailSignupForm, {
    validators: emailSignupFormSchema,
  })

  $: canSignUp =
    !!$emailSignupForm.email &&
    !!$emailSignupForm.password &&
    !!$emailSignupForm.passwordConfirmation
</script>

<div class="grid w-full place-items-center">
  <div class="flex w-fit flex-col gap-4">
    <ProviderAuthForm data={data.providerAuthForm} />

    <hr />

    <form
      method="POST"
      action="?/emailSignup"
      class="grid w-full gap-4"
      use:emailSignupFormEnhance
    >
      <EmailInput
        id="email"
        name="email"
        placeholder="Email"
        bind:value={$emailSignupForm.email}
        errors={$emailSignupFormErrors.email}
      />
      <PasswordInput
        id="password"
        name="password"
        placeholder="Password"
        bind:value={$emailSignupForm.password}
        errors={$emailSignupFormErrors.password}
        autocomplete="new-password"
      />
      <PasswordInput
        id="passwordConfirmation"
        name="passwordConfirmation"
        placeholder="Confirm password"
        bind:value={$emailSignupForm.passwordConfirmation}
        errors={$emailSignupFormErrors.passwordConfirmation}
        autocomplete="new-password"
      />
      <button type="submit" class="btn variant-filled-secondary" disabled={!canSignUp}
        >Sign up</button
      >
    </form>
  </div>
</div>
