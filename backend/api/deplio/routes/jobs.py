from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, status
from sqlalchemy import insert

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.context import Context, context
from deplio.models.data.head.db.jobs import ScheduledJob, ScheduledJobStatus
from deplio.models.data.head.tables.jobs import scheduled_job_table
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
from deplio.services.db import DbSessionDependency
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
    session: DbSessionDependency,
    context: Annotated[Context, Depends(context)],
    scheduled_job_request: PostScheduledJobRequest,
):
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

    scheduled_job_insert = {
        'team_id': str(auth.team.id),
        'api_key_id': str(auth.api_key.id),
        'status': ScheduledJobStatus.pending,
        'scheduled_for': scheduled_job_request.schedule_for,
        'executor': {
            **scheduled_job_request.executor.model_dump(),
            'destination': str(scheduled_job_request.executor.destination),
        },
        'metadata': scheduled_job_request.metadata,
    }

    try:
        response = await session.execute(
            insert(scheduled_job_table)
            .values(scheduled_job_insert)
            .returning(scheduled_job_table)
        )
        scheduled_job = ScheduledJob(**response.one()._mapping)
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
        scheduled_job_id=scheduled_job.id,
        next_invocation=scheduled_job.scheduled_for,
        warnings=context.warnings,
    )
