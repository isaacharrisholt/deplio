import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { q_messages_schema } from '$lib/types/api/q'
import { trpc_server } from '$lib/trpc/server'

export const POST: RequestHandler = async (event) => {
  const { request } = event
  const headers = request.headers
  const api_key = headers.get('x-deplio-api-key')

  if (!api_key) {
    return new Response('No API key found', { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 })
  }

  const parsed_request = q_messages_schema.safeParse(body)
  if (!parsed_request.success) {
    return new Response(parsed_request.error.message, { status: 400 })
  }

  const trpc = await trpc_server(event)
  const results = await trpc.q.requests.post({
    api_key,
    requests: parsed_request.data,
    headers,
  })

  return json(results)
}
