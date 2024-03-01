import { z } from 'zod'

export const metadataSchema = z.object({
  team_id: z.string().optional(),
})
