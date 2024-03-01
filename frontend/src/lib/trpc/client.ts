import type { Router } from '$lib/trpc/router'
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit'
import { browser } from '$app/environment'

let browser_client: ReturnType<typeof createTRPCClient<Router>>

export function trpc(init?: TRPCClientInit) {
  if (browser && browser_client) {
    return browser_client
  }
  const client = createTRPCClient<Router>({ init })
  if (browser) {
    browser_client = client
  }
  return client
}
