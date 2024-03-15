import { Api } from '../api'
import type { ListRequest } from './types'
import type { GetQMessagesResponse } from '../../generated/models/GetQMessagesResponse'
import type { Messages } from '../../generated/models/Messages'
import { ConfigWithVersion } from '../types'
import { object_to_search_params } from '../../formatting'
import { PostQMessagesResponse } from '../../generated/models/PostQMessagesResponse'

export class QApi extends Api {
  constructor(config: ConfigWithVersion) {
    super(config)
  }

  public async list(request: ListRequest) {
    const params = object_to_search_params(request)
    return await this.fetch<GetQMessagesResponse>(`/q?${params}`)
  }

  public async send(messages: Messages) {
    return await this.fetch<PostQMessagesResponse>(`/q`, {
      method: 'POST',
      body: JSON.stringify(messages),
    })
  }
}
