import { Configuration, VersionsApi, QApi } from './api'

export class Deplio {
  public readonly versions: VersionsApi
  public readonly q: QApi

  constructor(config?: Configuration) {
    this.versions = new VersionsApi(config)
    this.q = new QApi(config)
  }
}

export { Configuration }
