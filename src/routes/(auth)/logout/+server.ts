import type { RequestHandler } from './$types'
import { redirect } from '@sveltejs/kit'
import { cache } from '$lib/cache'
import { extractRedirectUrl } from '$lib/utils'

export const GET: RequestHandler = async ({
  url,
  locals: { supabase, getSession },
}) => {
  const session = await getSession()

  if (!session) {
    throw redirect(303, extractRedirectUrl(url, '/'))
  }

  await Promise.all([supabase.auth.signOut(), cache.del(`user:${session.user.id}`)])
  throw redirect(303, extractRedirectUrl(url, '/'))
}
