from typing import Annotated
from fastapi import Depends, Request, HTTPException
from supabase._async.client import create_client
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from deplio.config import settings


auth_header_scheme = HTTPBearer(description='Bearer token for authentication')


def unauthorized():
    return HTTPException(
        status_code=401,
        detail='Unauthorized',
        headers={'WWW-Authenticate': 'Bearer'},
    )


async def auth(
    request: Request,
    auth_header: Annotated[
        HTTPAuthorizationCredentials,
        Depends(auth_header_scheme),
    ],
):
    supabase = await create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    try:
        user = await supabase.auth.get_user(jwt=auth_header.credentials)
    except Exception:
        raise unauthorized()
    if user is None:
        raise unauthorized()

    db_user = (
        await supabase.table('user')
        .select('*')
        .eq('user_id', user.user.id)
        .single()
        .execute()
    )
    if not db_user.data:
        raise unauthorized()

    request.state.user = db_user.data


class Auth:
    ...
