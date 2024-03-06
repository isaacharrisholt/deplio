from deplio.models.versions import version_bundle
from deplio.config import settings
from deplio.routers import create_router
from deplio.routes.q import router as q_router
from fastapi.middleware import Middleware
from cadwyn import Cadwyn
from deplio.middleware.default_version import DefaultVersioningMiddleware
from deplio.middleware.default_content_type import DefaultContentTypeMiddleware


app = Cadwyn(
    title='Deplio',
    summary='Simple utils for serverless applications',
    docs_url=None,
    redoc_url='/docs',
    version=settings.current_version.isoformat(),
    versions=version_bundle,
    api_version_header_name=settings.version_header,
    middleware=[
        Middleware(
            DefaultVersioningMiddleware,
            api_version_var=version_bundle.api_version_var,
        ),
        Middleware(DefaultContentTypeMiddleware),
    ],
)
router = create_router()


@router.get('/')
async def home():
    return {'message': 'Hello, World!'}


@router.get('/version')
async def version():
    print(version_bundle.api_version_var.get(None))
    return '1.0.0'


app.generate_and_include_versioned_routers(router, q_router)
