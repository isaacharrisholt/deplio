from typing import Annotated, NamedTuple, Optional
from fastapi import Depends, Request, HTTPException
from supabase._async.client import create_client, AsyncClient as SupabaseClient
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from deplio.config import settings
from deplio.models.data.latest.team import Team
from deplio.models.data.latest.user import User
from deplio.services.redis import Redis, RedisUserRequest, redis
from datetime import datetime
import hashlib


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
    supabase: SupabaseClient, redis: Redis, jwt: str
) -> tuple[User, Team] | None:
    try:
        user = await supabase.auth.get_user(jwt=jwt)
    except Exception:
        return None
    if user is None:
        return None

    db_user = (
        await supabase.table('user')
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


async def _get_team_from_api_key(supabase: SupabaseClient, api_key: str) -> Team | None:
    key_hash = hash_api_key(api_key)
    key_prefix = api_key[:6]
    now = datetime.now().isoformat()

    api_key_result = await (
        supabase.table('api_key')
        .select('*, team (*)')
        .eq('key_hash', key_hash)
        .eq('key_prefix', key_prefix)
        .or_(f'expires_at.lte.{now}, expires_at.is.null')
        .is_('revoked_at', 'null')
        .is_('deleted_at', 'null')
        .maybe_single()
        .execute()
    )
    if api_key_result is None:
        return None

    if not api_key_result.data:
        return None

    return Team(**api_key_result.data['team'])


AuthCredentials = NamedTuple(
    'AuthCredentials', [('user', Optional[User]), ('team', Team)]
)
RequiredAuthCredentials = NamedTuple(
    'RequiredAuthCredentials', [('user', User), ('team', Team)]
)


async def auth(
    request: Request,
    auth_header: Annotated[
        HTTPAuthorizationCredentials,
        Depends(auth_header_scheme),
    ],
    redis: Annotated[Redis, Depends(redis)],
) -> AuthCredentials:
    supabase = await create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )

    user_and_team = await _get_user_and_team_from_jwt(
        supabase,
        redis,
        auth_header.credentials,
    )
    if user_and_team is not None:
        return AuthCredentials(*user_and_team)

    team = await _get_team_from_api_key(supabase, auth_header.credentials)
    if team is not None:
        request.state.team = team
        return AuthCredentials(None, team)

    raise unauthorized()


async def requires_user(
    auth: Annotated[AuthCredentials, Depends(auth)],
) -> RequiredAuthCredentials:
    if auth.user is None:
        raise unauthorized()
    return RequiredAuthCredentials(auth.user, auth.team)
