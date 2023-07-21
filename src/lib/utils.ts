export function extractRedirectUrl(url: URL, fallback: string): string {
    let redirectUrl = url.searchParams.get('redirectUrl')

    if (redirectUrl && !redirectUrl.startsWith('/')) {
        redirectUrl = `/${redirectUrl}`
    }

    return redirectUrl || fallback
}
