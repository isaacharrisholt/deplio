import { t } from './t'

export const router = t.router({})

export type Router = typeof router

export const createCaller = t.createCallerFactory(router)
