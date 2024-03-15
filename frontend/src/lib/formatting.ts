export function format_initials({
  first_name,
  last_name,
  username,
}: {
  first_name?: string | null
  last_name?: string | null
  username: string | null
}) {
  if (first_name && last_name) {
    return `${first_name[0]}${last_name[0]}`.toUpperCase()
  }

  const split = username?.split(' ') ?? ['']
  return split
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}
