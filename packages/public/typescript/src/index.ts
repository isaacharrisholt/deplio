import { Configuration, VersionsApi, QApi, ResponseError } from './api'
import type { ConfigurationParameters as DeplioConfig } from './api'

export class Deplio {
  public readonly versions: VersionsApi
  public readonly q: QApi
  private config: Configuration

  constructor(config?: DeplioConfig) {
    this.config = new Configuration(config)
    this.versions = new VersionsApi(this.config)
    this.q = new QApi(this.config)
  }
}

export { ResponseError }
export type { DeplioConfig }
export type * from './api'
