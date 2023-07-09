import {
    superForm,
    type FormOptions,
    type SuperForm,
} from 'sveltekit-superforms/client'
import type { SuperValidated } from 'sveltekit-superforms'
import type { AnyZodObject } from 'zod'

export type FormMessage = {
    status: 'error' | 'success'
    message: string
}

export const createForm = (
    form: SuperValidated<AnyZodObject>,
    options?: FormOptions<AnyZodObject, never>,
): SuperForm<AnyZodObject> => {
    return superForm(form, {
        taintedMessage: 'You have unsaved changes. Are you sure you want to leave?',
        multipleSubmits: 'prevent',
        delayMs: 500,
        ...options,
    })
}
