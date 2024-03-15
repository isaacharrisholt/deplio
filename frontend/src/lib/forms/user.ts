import { z } from 'zod'

export const edit_user_details_form_schema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z
    .string()
    .min(1, { message: 'Username is required.' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Username can only contain lowercase letters, numbers and dashes.',
    }),
})
