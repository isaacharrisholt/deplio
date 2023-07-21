import crypto from 'crypto'
import * as jose from 'jose'
import { z } from 'zod'
import { GITHUB_PRIVATE_KEY, GITHUB_APP_ID } from '$env/static/private'
import { cache } from '$lib/cache'
import { Result } from '$lib/types/result'

const tokenResponseSchema = z.object({
    token: z.string(),
})

type TokenResponse = z.infer<typeof tokenResponseSchema>

export async function generateGitHubJWT(): Promise<Result<string>> {
    const alg = 'RS256'
    let jwt: string
    try {
        jwt = await new jose.SignJWT({})
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setExpirationTime('5m')
            .setIssuer(GITHUB_APP_ID)
            .sign(crypto.createPrivateKey(GITHUB_PRIVATE_KEY))
    } catch (error) {
        return Result.err<string, Error>(
            new Error(`Error generating GitHub JWT: ${error}`),
        )
    }

    return Result.ok(jwt)
}

export async function getGitHubAppInstallationAccessToken(
    installationId: string,
): Promise<Result<string>> {
    let token = await cache.hgetall(`githubInstallationAccessToken:${installationId}`)

    if (token) {
        return Result.ok(token)
    }

    const jwtResult = await generateGitHubJWT()

    if (jwtResult.isErr()) {
        return jwtResult.errInto()
    }

    const jwt = jwtResult.unwrap()

    const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: 'application/vnd.github.v3+json',
            },
        },
    )

    if (!response.ok) {
        return Result.err(Error(await response.text()))
    }

    let json: TokenResponse
    try {
        const jsonResponse = await response.json()
        json = tokenResponseSchema.parse(jsonResponse)
    } catch (error) {
        return Result.err(new Error(`Invalid response from GitHub: ${error}`))
    }

    token = json.token as string
    cache.hset(`githubInstallationAccessToken:${installationId}`, token, {
        ttlSeconds: 60 * 50, // Token expires after 1 hour, so we'll refresh it after 50 minutes to be safe
    })
    return Result.ok(token)
}
