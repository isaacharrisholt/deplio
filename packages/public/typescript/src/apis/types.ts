import type { DeplioConfig } from '../config'
import type { ErrorResponse } from '../generated/models/ErrorResponse'

export type ConfigWithVersion = DeplioConfig & {
  version: `${number}-${number}-${number}`
}

export type DeplioResponse<T, E = ErrorResponse> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: E
    }
