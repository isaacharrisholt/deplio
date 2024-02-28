from fastapi import Request
from cadwyn import Cadwyn
from deplio.models.versions import version_bundle
from deplio.config import settings
from datetime import date
from deplio.routers import create_router
from deplio.routes.q import router as q_router

app = Cadwyn(
    title='Deplio',
    summary='Simple utils for serverless applications',
    version=settings.current_version.isoformat(),
    versions=version_bundle,
    api_version_header_name=settings.version_header,
)
router = create_router()


@router.get('/')
async def home():
    return {'message': 'Hello, World!'}


@router.get('/version')
async def version():
    return '1.0.0'


@app.middleware('http')
async def set_default_version(request: Request, call_next):
    # TODO: fetch default version from the database
    if request.url.path.startswith('/docs') or request.url.path.startswith(
        '/openapi.json'
    ):
        return await call_next(request)

    version = request.headers.get(settings.version_header, settings.default_version)
    if isinstance(version, str):
        version = date.fromisoformat(version)
    request.scope['headers'].append(
        (settings.version_header.lower().encode(), version.isoformat().encode())
    )
    return await call_next(request)


app.generate_and_include_versioned_routers(router, q_router)
