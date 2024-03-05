import { Configuration, MiscApi, QApi } from './api'

export class Deplio {
  public readonly misc: MiscApi
  public readonly q: QApi

  constructor(config?: Configuration) {
    this.misc = new MiscApi(config)
    this.q = new QApi(config)
  }
}

export { Configuration }
