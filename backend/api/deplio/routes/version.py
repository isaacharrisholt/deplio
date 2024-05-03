from typing import Annotated

from fastapi import Depends

from deplio.auth.dependencies import AuthCredentials, any_auth
from deplio.config import settings
from deplio.models.data.head.endpoints.version import Versions
from deplio.models.data.head.responses import generate_responses
from deplio.models.versions import version_bundle
from deplio.routers import create_router
from deplio.tags import Tags

router = create_router(prefix='/version')


@router.get(
    '',
    summary='Get API versions',
    description=(
        'Retrieve the latest version of the API, along with your '
        "current version and (if using a team API key) your team's API version."
    ),
    responses=generate_responses(Versions),
    tags=[Tags.VERSIONS],
    response_description='API versions',
)
async def get(auth: Annotated[AuthCredentials, Depends(any_auth)]):
    latest_version = settings.current_version
    current_version = version_bundle.api_version_var.get(None)
    team_version = None
    if auth.team:
        team_version = auth.team.api_version
    return Versions(
        latest=latest_version,
        current=current_version,
        team=team_version,
    )
