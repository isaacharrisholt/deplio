import { z } from 'zod'

export const edit_team_details_form_schema = z.object({
  name: z
    .string()
    .nonempty('Team name is required')
    .regex(/^[a-z0-9-]+$/, {
      message: 'Team name can only contain lowercase letters, numbers and dashes.',
    }),
})

export const create_team_form_schema = z.object({
  name: z
    .string()
    .nonempty('Team name is required')
    .regex(/^[a-z0-9-]+$/, {
      message: 'Team name can only contain lowercase letters, numbers and dashes.',
    }),
})

export const invite_team_member_form_schema = z.object({
  emails: z.array(z.string().email('Invalid email address')),
  role: z.enum(['member', 'admin']),
})
