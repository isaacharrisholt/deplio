import { z } from 'zod'

export const edit_team_details_form_schema = z.object({
  name: z.string().nonempty('Team name is required'),
})
