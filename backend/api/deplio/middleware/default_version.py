from contextvars import ContextVar
from fastapi import Request
from starlette.types import ASGIApp
from datetime import date
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from deplio.config import settings


class DefaultVersioningMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        api_version_var: ContextVar[date] | ContextVar[date | None],
    ):
        super().__init__(app)
        self.api_version_var = api_version_var

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if request.url.path.startswith('/docs') or request.url.path.startswith(
            '/openapi.json'
        ):
            return await call_next(request)

        version = request.headers.get(settings.version_header, None)

        if version is None:
            version = settings.default_version

        if isinstance(version, str):
            version = date.fromisoformat(version)

        self.api_version_var.set(version)
        request.scope['headers'].append(
            (
                settings.version_header.lower().encode(),
                version.isoformat().encode(),
            )
        )
        return await call_next(request)
