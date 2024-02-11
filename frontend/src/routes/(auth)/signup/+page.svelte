<script lang="ts">
  import EmailInput from '$lib/components/forms/EmailInput.svelte'
  import PasswordInput from '$lib/components/forms/PasswordInput.svelte'
  import ProviderAuthForm from '$lib/components/forms/ProviderAuthForm.svelte'
  import TextInput from '$lib/components/forms/TextInput.svelte'
  import { createForm } from '$lib/forms/client'
  import type { PageData } from './$types'

  export let data: PageData
  const {
    form: emailSignupForm,
    errors: emailSignupFormErrors,
    enhance: emailSignupFormEnhance,
  } = createForm(data.emailSignupForm)

  $: canSignUp =
    !!$emailSignupForm.email &&
    !!$emailSignupForm.password &&
    !!$emailSignupForm.passwordConfirmation
</script>

<div class="grid w-full place-items-center">
  <div class="flex w-fit max-w-xs flex-col gap-4 sm:w-80">
    <ProviderAuthForm data={data.providerAuthForm} />

    <hr />

    <form
      method="POST"
      action="?/emailSignup"
      class="grid w-full gap-4"
      use:emailSignupFormEnhance
    >
      <TextInput
        id="username"
        name="username"
        label="Username"
        placeholder="isaacharrisholt"
        bind:value={$emailSignupForm.username}
        errors={$emailSignupFormErrors.username}
        autocomplete="username"
      />
      <EmailInput
        id="email"
        name="email"
        label="Email"
        placeholder="isaac@depl.io"
        bind:value={$emailSignupForm.email}
        errors={$emailSignupFormErrors.email}
      />
      <PasswordInput
        id="password"
        name="password"
        label="Password"
        placeholder="••••••••••••••••"
        bind:value={$emailSignupForm.password}
        errors={$emailSignupFormErrors.password}
        autocomplete="new-password"
      />
      <PasswordInput
        id="passwordConfirmation"
        name="passwordConfirmation"
        label="Confirm password"
        placeholder="••••••••••••••••"
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
