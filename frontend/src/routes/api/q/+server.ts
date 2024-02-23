import { AWS_SQS_QUEUE_URL } from '$env/static/private'
import { hashApiKey } from '$lib/apiKeys'
import { sendMessages } from '$lib/aws/sqs'
import { getSupabaseAdminClient } from '$lib/utils.server'
import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { post_q_request_schema, type DeplioQMessage } from '$lib/types/api/q'

type DeplioQSQSMessage = {
  destination: string
  body?: string
  method: string
  headers: Record<string, string> | null
  request_id: string
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

async function sendQMessages(messages: DeplioQSQSMessage[]) {
  const entries = messages.map((m) => ({
    Id: m.request_id,
    MessageBody: JSON.stringify(m),
  }))
  return await sendMessages(entries, AWS_SQS_QUEUE_URL)
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
  const parsedRequest = post_q_request_schema.safeParse(body)
  if (!parsedRequest.success) {
    return new Response(parsedRequest.error.message, { status: 400 })
  }

  const qRequestData = parsedRequest.data

  let requests: DeplioQMessage[]
  if (Array.isArray(qRequestData)) {
    requests = qRequestData
  } else {
    requests = [qRequestData]
  }

  const requestHeadersObject = getForwardHeaders(headers)
  const requestHeaders = Object.entries(requestHeadersObject).length
    ? requestHeadersObject
    : null

  console.log(`Inserting ${requests.length} requests into DB`)
  const { data: qRequests, error: qRequestInsertError } = await supabase
    .from('q_request')
    .insert(
      requests.map((r) => ({
        api_key_id: storedApiKey.id,
        destination: r.destination,
        method: r.method,
        body: r.body,
        headers: { ...requestHeaders, ...r.headers },
        query_params: searchParamsToObject(new URL(r.destination).searchParams),
        team_id: storedApiKey.team_id,
      })),
    )
    .select()

  if (qRequestInsertError) {
    console.error('error inserting q requests', qRequestInsertError)
    return new Response('Internal server error', { status: 500 })
  }

  const messages: DeplioQSQSMessage[] = qRequests.map((r) => ({
    destination: r.destination,
    method: r.method,
    body: r.body ?? undefined,
    headers: r.headers as Record<string, string> | null,
    request_id: r.id,
  }))

  const result = await sendQMessages(messages)
  if (result.Failed) {
    console.error('error sending messages to SQS', result.Failed)
    return new Response('Internal server error', { status: 500 })
  }

  return json({
    request_ids: qRequests.map((r) => r.id),
    messages_delivered: messages.length,
  })
}
