from fastapi import Request
from starlette.types import ASGIApp
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class DefaultContentTypeMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        *,
        default_content_type: str = 'application/json',
    ):
        super().__init__(app)
        self.default_content_type = default_content_type

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return await call_next(request)

        if request.headers.get('Content-Type', None) is not None:
            return await call_next(request)

        request.scope['headers'].append(
            (
                'content-type'.encode(),
                self.default_content_type.encode(),
            )
        )

        return await call_next(request)
