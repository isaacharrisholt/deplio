import type { RequestEvent } from '@sveltejs/kit'
import { createContext } from './context'
import { createCaller } from './router'

export async function trpcServer<TEvent extends RequestEvent>(event: TEvent) {
  return createCaller(await createContext(event))
}
