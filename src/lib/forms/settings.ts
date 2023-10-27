import { z } from 'zod'

export const newApiKeyFormSchema = z.object({
    name: z.string().nonempty(),
    expiry: z.enum(['never', '1h', '1d', '1w', '1m', '1y']).default('never'),
})
