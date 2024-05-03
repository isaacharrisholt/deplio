from typing import Annotated

from cron_converter import Cron
from fastapi import Depends
from supabase._async.client import AsyncClient as SupabaseClient

from deplio.context import Context, context
from deplio.models.data.head.endpoints.cron import PostCronJobRequest
from deplio.models.data.head.responses import generate_responses
from deplio.routers import create_router
from deplio.services.supabase import supabase_admin
from deplio.tags import Tags

router = create_router(prefix="/cron")


@router.post(
    "",
    summary="Create a new cron job",
    description="Set up a new cron job to execute some work on a schedule",
    responses=generate_responses(PostCronJobRequest),
    tags=[Tags.CRON],
    response_description="List of request IDs and number of messages delivered",
)
async def create(
    # auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    # request: Request,
    cron_job: PostCronJobRequest,
):
    print(cron_job, context)
    cron_schedule = Cron(cron_job.schedule)
    print(cron_schedule.parts)

    return cron_job
