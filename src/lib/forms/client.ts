import {
    superForm,
    type FormOptions,
    type SuperForm,
} from 'sveltekit-superforms/client'
import type { SuperValidated } from 'sveltekit-superforms'
import type { AnyZodObject } from 'zod'
import { toastStore, type ToastSettings } from '@skeletonlabs/skeleton'

export type FormMessage = {
    status: 'error' | 'success'
    message: string
}

export const displayToast = (formMessage: FormMessage, settings?: ToastSettings) => {
    const t: ToastSettings = {
        message: formMessage.message,
        background:
            formMessage.status === 'error'
                ? 'variant-filled-error'
                : 'variant-filled-success',
    }
    toastStore.trigger({ ...t, ...settings })
}

export const createForm = (
    form: SuperValidated<AnyZodObject>,
    options?: FormOptions<AnyZodObject, never>,
): SuperForm<AnyZodObject> => {
    const onUpdated: (event: {
        form: Readonly<SuperValidated<AnyZodObject, never>>
    }) => unknown = async ({ form }) => {
        if (form.message) {
            displayToast(form.message as FormMessage)
        }
        if (options?.onUpdated) {
            await options.onUpdated({ form })
        }
    }

    // Remove onUpdated from options so it doesn't override our custom handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onUpdated: useless, ...opts } = options ?? {}

    return superForm(form, {
        taintedMessage: 'You have unsaved changes. Are you sure you want to leave?',
        multipleSubmits: 'prevent',
        delayMs: 500,
        onUpdated,
        ...opts,
    })
}
