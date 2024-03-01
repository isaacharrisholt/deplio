import { z } from 'zod'

export const auth_schema = z.object({
  api_key: z.string().optional(),
})
