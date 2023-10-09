import { z } from 'zod'

export function createNewProjectSchema(
    existingProjects: string[],
    availableRepos: [string, ...string[]],
) {
    ;[]
    return z.object({
        name: z
            .string()
            .nonempty('Please enter a project name')
            .refine((name) => !existingProjects.includes(name), {
                message: 'Project names must be unique',
            }),
        repo: z.enum(availableRepos, {
            errorMap: () => ({ message: 'Please select a valid repo' }),
        }),
        description: z.string().optional(),
    })
}
