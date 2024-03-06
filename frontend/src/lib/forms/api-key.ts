import { z } from 'zod'

export const newApiKeyFormSchema = z.object({
  name: z.string().nonempty('Please enter an API key name'),
  expiry: z.enum(['never', '1h', '1d', '1w', '30d', '1y']).default('never'),
})

export const revokeApiKeyFormSchema = z.object({
  id: z.string().nonempty(),
})
