export function extractRedirectUrl(url: URL, fallback: string): string {
    const redirectUrl = url.searchParams.get('redirectUrl')
    return redirectUrl ? redirectUrl : fallback
}