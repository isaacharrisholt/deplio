from fastapi import Request
from deplio.models.versions import version_bundle
from cadwyn import VersionedAPIRouter, Cadwyn
from deplio.config import settings
from datetime import date

router = VersionedAPIRouter()


@router.get('/')
async def home():
    return {'message': 'Hello, World!'}


@router.get('/version')
async def version():
    print(version_bundle.api_version_var.get())
    return '1.0.0'


app = Cadwyn(versions=version_bundle, api_version_header_name=settings.version_header)


@app.middleware('http')
async def set_default_version(request: Request, call_next):
    # TODO: fetch default version from the database
    version = request.headers.get(settings.version_header, settings.default_version)
    if isinstance(version, str):
        version = date.fromisoformat(version)
    request.scope['headers'].append(
        (settings.version_header.lower().encode(), version.isoformat().encode())
    )
    return await call_next(request)


app.generate_and_include_versioned_routers(router)
