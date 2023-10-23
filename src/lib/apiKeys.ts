export function generateApiKey() {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replaceAll(/\W/g, '')
}
export async function hashApiKey(apiKey: string): Promise<string> {
    return Buffer.from(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey)),
    ).toString('hex')
}
