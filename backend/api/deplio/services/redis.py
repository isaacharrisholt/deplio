import json
from typing import Any, Self, Type, TypeVar

import httpx

from deplio.config import settings
from deplio.models.data.head._base import DeplioModel
from deplio.models.data.head.db.user_with_teams import UserWithTeams

T = TypeVar('T', bound=DeplioModel)


class RedisRequest[T: DeplioModel]:
    __key_prefix__ = ''
    __return_type__: Type[T]

    def __init__(self, key: str):
        self._key = key

    @property
    def key(self: Self) -> str:
        return f'{self.__key_prefix__}:{self._key}'


class RedisUserRequest(RedisRequest[UserWithTeams]):
    __key_prefix__ = 'user'
    __return_type__ = UserWithTeams

    def __init__(self, key: str):
        super().__init__(key)


class Redis:
    def __init__(self, url: str, token: str):
        self.url = url
        self.token = token

    async def _get_request(self: Self, path: str, key: str) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            url = f'{self.url}{path}/{key}'
            headers = {
                'Authorization': f'Bearer {self.token}',
            }
            response = await client.get(url, headers=headers)

        response.raise_for_status()
        result_list = response.json()['result']
        if not len(result_list):
            raise KeyError(key)
        result_dict = {}
        for i in range(0, len(result_list), 2):
            result_dict[result_list[i]] = result_list[i + 1]
        return result_dict

    async def hgetall(self, request: RedisRequest[T]) -> T:
        result = await self._get_request('/hgetall', request.key)
        return request.__return_type__(**json.loads(result['value']))


def redis() -> Redis:
    return Redis(settings.kv_rest_api_url, settings.kv_rest_api_token)
