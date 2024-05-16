from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, status

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.context import Context, context
from deplio.models.data.head.db.jobs import DBScheduledJob
from deplio.models.data.head.enums import ScheduledJobStatus
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
from deplio.services.db import DBSessionDependency
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
    session: DBSessionDependency,
    context: Annotated[Context, Depends(context)],
    scheduled_job_request: PostScheduledJobRequest,
):
    print(scheduled_job_request, context)

    if scheduled_job_request.schedule_for < datetime.now(UTC):
        context.errors.append(
            DeplioError(message='Scheduled time must be in the future')
        )

        return error_response(
            message='Scheduled time must be in the future',
            status_code=status.HTTP_400_BAD_REQUEST,
            warnings=context.warnings,
            errors=context.errors,
        )

    print(ScheduledJobStatus.pending.value, ScheduledJobStatus.pending)
    scheduled_job_insert = DBScheduledJob(
        team_id=auth.team.id,
        api_key_id=auth.api_key.id,
        status=ScheduledJobStatus.pending,
        executor={
            **scheduled_job_request.executor.model_dump(),
            'destination': str(scheduled_job_request.executor.destination),
        },
        scheduled_for=scheduled_job_request.schedule_for,
        metadata_=scheduled_job_request.metadata,
    )

    try:
        session.add(scheduled_job_insert)
        await session.flush()
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

    await session.commit()
    return PostScheduledJobResponse(
        scheduled_job_id=scheduled_job_insert.id,
        next_invocation=scheduled_job_insert.scheduled_for,
        warnings=context.warnings,
    )
