import { t } from '$lib/trpc/t'
import { requests } from './requests'

export const q = t.router({
  requests,
})
