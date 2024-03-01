import { t } from './t'
import { get_q_requests } from './routes/q'

export const router = t.router({
  get_q_requests,
})

export type Router = typeof router

export const createCaller = t.createCallerFactory(router)
