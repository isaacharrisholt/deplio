import { z } from 'zod'

export const deplioQMessageSchema = z.object({
  destination: z.string().url(),
  body: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
})
export type DeplioQMessage = z.infer<typeof deplioQMessageSchema>

export const deplioQRequestSchema = z.union([
  deplioQMessageSchema,
  z.array(deplioQMessageSchema).max(10),
])

export const getQRequestSchema = z.object({
  page_size: z.number().int().optional().default(25),
  page: z.number().int().optional().default(1),
})
