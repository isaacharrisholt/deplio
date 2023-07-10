import { PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'
import { VERCEL_URL } from '$env/static/private'

export const getSiteUrl = () => {
    const protocol = PUBLIC_DEPLOYMENT_ENV === 'local' ? 'http' : 'https'
    return `${protocol}://${VERCEL_URL}`
}
