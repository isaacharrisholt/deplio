import { z } from 'zod'

const baseServiceSchema = z.object({
    working_dir: z.string().optional(),
})

const supabaseTempateSchema = z.object({
    template: z.literal('supabase'),
    version: z
        .union([z.literal('latest'), z.string().regex(/^\d+\.\d+\.\d+\.\d+$/)])
        .optional(),
})

const templateSchema = z.discriminatedUnion('template', [supabaseTempateSchema])

export const deplioYamlSchema = z.object({
    version: z.literal('1'),
    services: z.record(
        z.string().min(1),
        z.intersection(baseServiceSchema, z.union([templateSchema, z.never()])),
    ),
})

export type DeplioYaml = z.infer<typeof deplioYamlSchema>
