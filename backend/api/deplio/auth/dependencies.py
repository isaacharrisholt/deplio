import hashlib
from datetime import datetime
from typing import Annotated, NamedTuple, Optional

from fastapi import Depends, HTTPException
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer

from deplio.models.data.head.endpoints.api_key import APIKey
from deplio.models.data.head.endpoints.team import Team
from deplio.models.data.head.endpoints.user import User
from deplio.services.redis import Redis, RedisUserRequest, redis
from deplio.services.supabase import SupabaseClient, supabase_admin

auth_header_scheme = HTTPBearer(description='Bearer token for authentication')


def unauthorized():
    return HTTPException(
        status_code=401,
        detail='Unauthorized',
        headers={'WWW-Authenticate': 'Bearer'},
    )


def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


async def _get_user_and_team_from_jwt(
    supabase_admin: SupabaseClient,
    redis: Redis,
    jwt: str,
) -> tuple[User, Team] | None:
    try:
        user = await supabase_admin.auth.get_user(jwt=jwt)
    except Exception:
        return None
    if user is None:
        return None

    db_user = (
        await supabase_admin.table('user')
        .select('*')
        .eq('user_id', user.user.id)
        .single()
        .execute()
    )
    if not db_user.data:
        return None

    fetched_user = User(**db_user.data)

    try:
        user_with_teams = await redis.hgetall(
            RedisUserRequest(str(fetched_user.user_id))
        )
    except KeyError:
        return None
    team = None
    for team in user_with_teams.teams:
        if team.id == user_with_teams.current_team_id:
            break

    if team is None:
        return None

    return fetched_user, team


async def get_team_from_api_key(
    supabase_admin: SupabaseClient,
    api_key: str,
) -> tuple[APIKey, Team] | None:
    key_hash = hash_api_key(api_key)
    key_prefix = api_key[:6]
    now = datetime.now().isoformat()

    api_key_result = await (
        supabase_admin.table('api_key')
        .select('*, team (*)')
        .eq('key_hash', key_hash)
        .eq('key_prefix', key_prefix)
        .or_(f'expires_at.lte.{now}, expires_at.is.null')
        .is_('revoked_at', 'null')
        .is_('deleted_at', 'null')
        .limit(1)
        .maybe_single()
        .execute()
    )
    if api_key_result is None:
        return None

    if not api_key_result.data:
        return None

    team = Team(**api_key_result.data['team'])
    api_key_result.data.pop('team')
    api_key_result.data['team_id'] = team.id
    db_api_key = APIKey(**api_key_result.data)
    return db_api_key, team


AuthCredentials = NamedTuple(
    'AuthCredentials',
    [('user', Optional[User]), ('team', Team), ('api_key', Optional[APIKey])],
)
JWTAuthCredentials = NamedTuple(
    'RequiredAuthCredentials',
    [('user', User), ('team', Team)],
)
APIKeyAuthCredentials = NamedTuple(
    'RequiredAPIKeyAuthCredentials',
    [('api_key', APIKey), ('team', Team)],
)


async def any_auth(
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    auth_header: Annotated[
        HTTPAuthorizationCredentials,
        Depends(auth_header_scheme),
    ],
    redis: Annotated[Redis, Depends(redis)],
) -> AuthCredentials:
    user_and_team = await _get_user_and_team_from_jwt(
        supabase_admin,
        redis,
        auth_header.credentials,
    )
    if user_and_team is not None:
        return AuthCredentials(*user_and_team, None)

    api_key_and_team = await get_team_from_api_key(
        supabase_admin, auth_header.credentials
    )
    if api_key_and_team is not None:
        api_key, team = api_key_and_team
        return AuthCredentials(None, team, api_key)

    raise unauthorized()


async def user_auth(
    auth: Annotated[AuthCredentials, Depends(any_auth)],
) -> JWTAuthCredentials:
    if auth.user is None:
        raise unauthorized()
    return JWTAuthCredentials(auth.user, auth.team)


async def api_key_auth(
    auth: Annotated[AuthCredentials, Depends(any_auth)],
) -> APIKeyAuthCredentials:
    if auth.api_key is None:
        raise unauthorized()
    return APIKeyAuthCredentials(auth.api_key, auth.team)
