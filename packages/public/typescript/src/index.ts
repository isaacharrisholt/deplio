import type { DeplioConfig } from './config'
import type { DeplioResponse } from './apis/types'
import { API_VERSION } from './version'
import { QApi } from './apis/q'

export class Deplio {
  public readonly q: QApi

  constructor(private config: DeplioConfig) {
    this.q = new QApi({ version: API_VERSION, ...config })
  }
}

export type { DeplioResponse }
export type { DeplioConfig }
export type * from './generated/models'
