import { z } from 'zod'

export function createNewProjectSchema(
    existingProjects: string[],
    availableRepos: string[],
) {
    return z.object({
        name: z
            .string()
            .nonempty('Please enter a project name')
            .refine((name) => !existingProjects.includes(name), {
                message: 'Project names must be unique',
            }),
        repos: z
            .array(
                z.string().refine((repo) => availableRepos.includes(repo), {
                    message: 'Invalid repo',
                }),
            )
            .nonempty('Please select at least one repo'),
        description: z.string().optional(),
    })
}
