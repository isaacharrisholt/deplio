from typing import Annotated

from fastapi import Depends, status

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.command.command_controller import CommandController
from deplio.command.supabase.insert import SupabaseInsertSingle
from deplio.context import Context, context
from deplio.models.data.head.db.jobs import ScheduledJob, ScheduledJobStatus
from deplio.models.data.head.endpoints.jobs import (
    PostScheduledJobRequest,
    PostScheduledJobResponse,
)
from deplio.models.data.head.responses import (
    DeplioError,
    error_response,
    generate_responses,
)
from deplio.routers import create_router
from deplio.services.supabase import SupabaseClient, supabase_admin
from deplio.tags import Tags

router = create_router(prefix='/jobs')


@router.post(
    '',
    summary='Create a new scheduled job',
    description='Set up a new one-off job to execute some work at a given time',
    responses=generate_responses(PostScheduledJobResponse),
    tags=[Tags.JOBS],
    response_description='The scheduled job ID and the time it will be executed at',
)
async def create(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    scheduled_job_request: PostScheduledJobRequest,
):
    print(scheduled_job_request, context)

    controller = CommandController()

    scheduled_job_insert = SupabaseInsertSingle(
        supabase_admin,
        'scheduled_job',
        {
            'team_id': str(auth.team.id),
            'api_key_id': str(auth.api_key.id),
            'status': ScheduledJobStatus.PENDING,
            'executor': {
                **scheduled_job_request.executor.model_dump(),
                'destination': str(scheduled_job_request.executor.destination),
            },
            'metadata': scheduled_job_request.metadata,
        },
    )

    try:
        scheduled_job_record = await controller.execute(scheduled_job_insert)
    except Exception as e:
        print(f'Error inserting into scheduled_job: {e}')
        context.errors.append(
            DeplioError(message='Failed to insert into scheduled_job')
        )

        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    scheduled_job = ScheduledJob(**scheduled_job_record)

    return PostScheduledJobResponse(
        scheduled_job_id=scheduled_job.id,
        next_invocation=scheduled_job.scheduled_for,
    )
