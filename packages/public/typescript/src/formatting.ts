export function object_to_search_params(params: Record<string, unknown>) {
  const obj = Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => {
        if (value === undefined || value === null) {
          return null
        }
        if (Array.isArray(value)) {
          return [key, value.join(',')]
        }
        return [key, String(value)]
      })
      .filter(Boolean) as [string, string][],
  ) as Record<string, string>
  return new URLSearchParams(obj)
}
