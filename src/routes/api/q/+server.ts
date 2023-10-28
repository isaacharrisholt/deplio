import { AWS_SQS_QUEUE_URL } from '$env/static/private'
import { hashApiKey } from '$lib/apiKeys'
import { sendMessage } from '$lib/aws/sqs'
import { getSupabaseAdminClient } from '$lib/utils.server'
import { z } from 'zod'
import type { RequestHandler } from './$types'

const deplioQRequestSchema = z.object({
  destination: z.string().url(),
  body: z.any(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
})

type DeplioQMessage = {
  destination: string
  body: unknown
  method: string
  headers: Record<string, string> | null
  requestId: string
}

function searchParamsToObject(params: URLSearchParams) {
  const obj: Record<string, string | string[]> = {}
  for (const key of params.keys()) {
    const val = params.getAll(key)
    if (val.length > 1) {
      obj[key] = val
    } else {
      obj[key] = val[0]
    }
  }
  return obj
}

function getForwardHeaders(headers: Headers) {
  const forwardHeaders: Record<string, string> = {}
  headers.forEach((v, k) => {
    if (k.startsWith('x-deplio-forward-')) {
      forwardHeaders[k.replace('x-deplio-forward-', '')] = v
    }
  })
  return forwardHeaders
}

export const POST: RequestHandler = async ({ request }) => {
  const headers = request.headers
  const apiKey = headers.get('x-deplio-api-key')

  if (!apiKey) {
    return new Response('No API key found', { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  const keyHash = await hashApiKey(apiKey)
  const keyPrefix = apiKey.slice(0, 6)

  const { data: storedApiKey, error: apiKeyFetchError } = await supabase
    .from('api_key')
    .select()
    .eq('key_hash', keyHash)
    .eq('key_prefix', keyPrefix)
    .or(`expires_at.lte.${new Date().toISOString()}, expires_at.is.null`)
    .is('revoked_at', null)
    .is('deleted_at', null)
    .maybeSingle()

  if (apiKeyFetchError) {
    console.error('error fetching api key', apiKeyFetchError)
    return new Response('Internal server error', { status: 500 })
  }

  if (!storedApiKey) {
    return new Response('Invalid API key', { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 })
  }
  const parsedRequest = deplioQRequestSchema.safeParse(body)
  if (!parsedRequest.success) {
    return new Response(parsedRequest.error.message, { status: 400 })
  }

  const qRequestData = parsedRequest.data
  const qDestination = new URL(qRequestData.destination)

  const requestHeadersObject = getForwardHeaders(headers)
  const requestHeaders = Object.entries(requestHeadersObject).length
    ? requestHeadersObject
    : null
  const requestParams = searchParamsToObject(qDestination.searchParams)

  const { data: qRequest, error: qRequestInsertError } = await supabase
    .from('q_request')
    .insert({
      api_key_id: storedApiKey.id,
      destination: qDestination.toString(),
      method: qRequestData.method,
      body: qRequestData.body,
      headers: requestHeaders,
      query_params: requestParams,
      team_id: storedApiKey.team_id,
    })
    .select()
    .single()

  if (qRequestInsertError) {
    console.error('error inserting q request', qRequestInsertError)
    return new Response('Internal server error', { status: 500 })
  }

  const message: DeplioQMessage = {
    destination: qRequest.destination,
    body: qRequest.body,
    method: qRequest.method,
    headers: requestHeaders,
    requestId: qRequest.id,
  }

  try {
    await sendMessage(JSON.stringify(message), AWS_SQS_QUEUE_URL)
  } catch (e) {
    console.error('error sending message', e)
    return new Response('Internal server error', { status: 500 })
  }

  return new Response('ok')
}
