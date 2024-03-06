import { createHash } from 'crypto'

export async function hash_file(file: File) {
  const hash = createHash('sha256')
  hash.update(await file.text())
  return hash.digest('hex')
}

export function construct_file_path(
  prefix: `${string}/` | null,
  user_id: string,
  file_name: string,
  hash: string,
): string {
  const file_extension = file_name.split('.').pop()
  return `${prefix ?? ''}${user_id}/${file_name}/${hash}${
    file_extension ? `.${file_extension}` : ''
  }`
}
