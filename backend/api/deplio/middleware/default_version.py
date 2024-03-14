from contextvars import ContextVar
from fastapi import Request
from starlette.types import ASGIApp
from datetime import date
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from deplio.auth.dependencies import get_team_from_api_key
from deplio.config import settings
from deplio.services.supabase import supabase_admin as get_supabase_admin


class DefaultVersioningMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        api_version_var: ContextVar[date] | ContextVar[date | None],
        latest_version: date,
    ):
        super().__init__(app)
        self.api_version_var = api_version_var
        self.latest_version = latest_version

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if request.url.path.startswith('/docs') or request.url.path.startswith(
            '/openapi.json'
        ):
            return await call_next(request)

        # Set default version to latest
        self.api_version_var.set(self.latest_version)

        header_version = request.headers.get(settings.version_header, None)

        if header_version is not None:
            return await call_next(request)

        auth_header = request.headers.get('Authorization', None)
        if auth_header is None:
            return await call_next(request)

        if not auth_header.startswith('Bearer '):
            return await call_next(request)

        api_key = auth_header.split(' ')[1]
        supabase_admin = await get_supabase_admin()
        api_key_and_team = await get_team_from_api_key(supabase_admin, api_key)
        if api_key_and_team is None:
            return await call_next(request)

        _, team = api_key_and_team

        version = team.api_version

        self.api_version_var.set(version)

        response = await call_next(request)
        response.headers.append(settings.version_header, version.isoformat())
        return response
