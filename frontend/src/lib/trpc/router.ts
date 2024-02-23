import { t } from './t'
import { q } from './routes/q'

export const router = t.router({
  q,
})

export type Router = typeof router

export const create_caller = t.createCallerFactory(router)
