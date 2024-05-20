import json
from typing import Self, Type, TypeVar
from upstash_redis.asyncio import Redis as UpstashRedis

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
        self.client = UpstashRedis(url, token)

    async def hgetall(self, request: RedisRequest[T]) -> T:
        result = await self.client.hgetall(request.key)
        return request.__return_type__(**json.loads(result['value']))


def redis() -> Redis:
    return Redis(settings.kv_rest_api_url, settings.kv_rest_api_token)
