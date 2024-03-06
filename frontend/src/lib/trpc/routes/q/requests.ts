import { t } from '$lib/trpc/t'
import { authenticated_procedure } from '$lib/trpc/auth'
import {
  get_q_requests_schema,
  post_q_request_schema,
  type DeplioQMessage,
} from '$lib/types/api/q'
import { error } from '@sveltejs/kit'
import { sendMessages } from '$lib/aws/sqs'
import { AWS_SQS_QUEUE_URL } from '$env/static/private'
import { getSupabaseAdminClient } from '$lib/utils.server'

type DeplioQSQSMessage = {
  destination: string
  body?: string
  method: string
  headers: Record<string, string> | null
  request_id: string
}

function search_params_to_object(params: URLSearchParams) {
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

function get_forward_headers(headers: Headers) {
  const forward_headers: Record<string, string> = {}
  headers.forEach((v, k) => {
    if (k.startsWith('x-deplio-forward-')) {
      forward_headers[k.replace('x-deplio-forward-', '')] = v
    }
  })
  return forward_headers
}

async function send_q_messages(messages: DeplioQSQSMessage[]) {
  const entries = messages.map((m) => ({
    Id: m.request_id,
    MessageBody: JSON.stringify(m),
  }))
  return await sendMessages(entries, AWS_SQS_QUEUE_URL)
}

const get_q_requests = authenticated_procedure
  .input(get_q_requests_schema)
  .query(async ({ input, ctx }) => {
    const { data: q_requests, error: q_request_fetch_error } = await ctx.supabase
      .from('q_request')
      .select('*, q_response (*)')
      .eq('team_id', ctx.team.id)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, foreignTable: 'q_response' })
      .range((input.page - 1) * input.page_size, input.page * input.page_size - 1)

    if (q_request_fetch_error) {
      throw error(500, q_request_fetch_error?.message || 'No requests')
    }

    return { qRequests: q_requests }
  })

const post_q_requests = authenticated_procedure
  .input(post_q_request_schema)
  .mutation(async ({ input, ctx }) => {
    const request_data = input.requests
    let requests: DeplioQMessage[]

    if (Array.isArray(request_data)) {
      requests = request_data
    } else {
      requests = [request_data]
    }

    const request_headers_object = get_forward_headers(input.headers)
    const request_headers = Object.entries(request_headers_object).length
      ? request_headers_object
      : null

    const supabase_admin = getSupabaseAdminClient()

    const api_key = ctx.api_key
    if (!api_key) {
      console.error('no api key in context')
      return new Response('Internal server error', { status: 500 })
    }

    console.log(`Inserting ${requests.length} requests into DB`)
    const { data: q_requests, error: q_request_insert_error } = await supabase_admin
      .from('q_request')
      .insert(
        requests.map((r) => ({
          api_key_id: api_key.id,
          destination: r.destination,
          method: r.method,
          body: r.body,
          headers: { ...request_headers, ...r.headers },
          query_params: search_params_to_object(new URL(r.destination).searchParams),
          team_id: api_key.team_id,
        })),
      )
      .select()

    if (q_request_insert_error) {
      console.error('error inserting q requests', q_request_insert_error)
      return new Response('Internal server error', { status: 500 })
    }

    const messages: DeplioQSQSMessage[] = q_requests.map((r) => ({
      destination: r.destination,
      method: r.method,
      body: r.body ?? undefined,
      headers: r.headers as Record<string, string> | null,
      request_id: r.id,
    }))

    const result = await send_q_messages(messages)
    if (result.Failed) {
      console.error('error sending messages to SQS', result.Failed)
      return new Response('Internal server error', { status: 500 })
    }

    return {
      request_ids: q_requests.map((r) => r.id),
      messages_delivered: messages.length,
    }
  })

export const requests = t.router({
  get: get_q_requests,
  post: post_q_requests,
})
