import YAML from 'yaml'
import { deplioYamlSchema, type DeplioYaml } from './types'
import type { Result } from '$lib/types/result'
import { Ok, Err } from '$lib/types/result'

export function parseDeplioYaml(yaml: string): Result<DeplioYaml, string> {
    const parseResult = deplioYamlSchema.safeParse(YAML.parse(yaml))
    if (!parseResult.success) {
        return Err(parseResult.error.message)
    }
    return Ok(parseResult.data)
}
