import type { RequestEvent } from '@sveltejs/kit'
import { create_trpc_context } from './context'
import { create_caller } from './router'

export async function trpc_server<TEvent extends RequestEvent>(event: TEvent) {
  return create_caller(await create_trpc_context(event))
}
