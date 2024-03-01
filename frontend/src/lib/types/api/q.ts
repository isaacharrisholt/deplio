import { z } from 'zod'

export const deplio_q_message_schema = z.object({
  destination: z.string().url(),
  body: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
})
export type DeplioQMessage = z.infer<typeof deplio_q_message_schema>

export const post_q_request_schema = z.union([
  deplio_q_message_schema,
  z.array(deplio_q_message_schema).max(10),
])

export const get_q_requests_schema = z.object({
  page_size: z.number().int().optional().default(25),
  page: z.number().int().optional().default(1),
})
