import { DEFAULT_BASE_PATH } from '../constants'
import { ConfigWithVersion, DeplioResponse } from './types'

/**
 * @abstract
 * @class Api
 */
export class Api {
  private base_path: string
  constructor(protected config: ConfigWithVersion) {
    this.base_path = config.base_path ?? DEFAULT_BASE_PATH
  }

  protected async fetch<T>(
    path: `/${string}`,
    init?: RequestInit,
  ): Promise<DeplioResponse<T>> {
    const response = await fetch(`${this.base_path}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        authorization: `Bearer ${this.config.api_key}`,
        version: this.config.version,
      },
    })

    const json = await response.json()

    if (!response.ok) {
      return { data: null, error: json }
    }

    return { data: json, error: null }
  }
}
