from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from cron_converter import Cron
from fastapi import Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.context import Context, context
from deplio.models.data.head.db.cron import DBCronInvocation, DBCronJob
from deplio.models.data.head.db.jobs import DBScheduledJob
from deplio.models.data.head.endpoints.cron import CronJob
from deplio.models.data.head.enums import CronJobStatus, ScheduledJobStatus
from deplio.models.data.head.endpoints.cron import (
    DeleteCronJobResponse,
    GetCronJobsResponse,
    PostCronJobRequest,
    PostCronJobResponse,
)
from deplio.models.data.head.responses import (
    DeplioError,
    error_response,
    generate_responses,
)
from deplio.routers import create_router
from deplio.services.db import DBSessionDependency
from deplio.tags import Tags

router = create_router(prefix='/cron')


@router.get(
    '',
    summary='List Deplio Cron jobs',
    description='Get a list of cron jobs that have been set up in Deplio.',
    responses=generate_responses(GetCronJobsResponse),
    tags=[Tags.CRON],
    response_description='List of cron jobs',
    operation_id='cron:list',
)
async def get(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    session: DBSessionDependency,
    context: Annotated[Context, Depends(context)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
):
    try:
        result = await session.execute(
            select(DBCronJob, func.count(DBCronJob.id).over().label('total'))
            .where(
                DBCronJob.team_id == auth.team.id,
                DBCronJob.deleted_at.is_(None),
            )
            .order_by(DBCronJob.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        )
        cron_jobs_with_total = result.tuples().all()
    except Exception as e:
        print(f'Error getting cron jobs: {e}')
        context.errors.append(DeplioError(message='Failed to get cron jobs'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    data = [CronJob.model_validate(cron_job) for cron_job, _ in cron_jobs_with_total]

    if data:
        count = cron_jobs_with_total[0][1]
    else:
        try:
            result = await session.execute(
                select(func.count(DBCronJob.id)).where(
                    DBCronJob.team_id == auth.team.id,
                    DBCronJob.deleted_at.is_(None),
                )
            )
            count = result.scalar() or 0
        except Exception as e:
            print(f'Error getting cron jobs: {e}')
            context.errors.append(DeplioError(message='Failed to get cron jobs'))
            return error_response(
                message='Internal server error',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                warnings=context.warnings,
                errors=context.errors,
            )

    return GetCronJobsResponse(
        cron_jobs=data,
        count=len(data),
        total=count,
        page=page,
        page_size=page_size,
        warnings=context.warnings,
    )


@router.post(
    '',
    summary='Create a new cron job',
    description='Set up a new cron job to execute some work on a schedule',
    responses=generate_responses(PostCronJobResponse),
    tags=[Tags.CRON],
    response_description='The cron job ID and the next invocation time',
)
async def create(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    session: DBSessionDependency,
    context: Annotated[Context, Depends(context)],
    cron_job_request: PostCronJobRequest,
):
    cron_job = DBCronJob(
        team_id=auth.team.id,
        api_key_id=auth.api_key.id,
        status=cron_job_request.status,
        executor={
            **cron_job_request.executor.model_dump(),
            'destination': str(cron_job_request.executor.destination),
        },
        schedule=cron_job_request.schedule,
        metadata_=cron_job_request.metadata,
    )

    try:
        session.add(cron_job)
        await session.flush()
    except Exception as e:
        print(f'Error inserting into cron_job: {e}')
        context.errors.append(DeplioError(message='Failed to insert into cron_job'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    response = PostCronJobResponse(
        cron_job_id=cron_job.id,
        warnings=context.warnings,
    )

    if cron_job.status == CronJobStatus.active:
        # Get next cron invocation time and schedule it
        cron = Cron(cron_job.schedule)
        schedule = cron.schedule(cron_job.created_at)
        next = schedule.next()

        scheduled_job = DBScheduledJob(
            team_id=auth.team.id,
            api_key_id=auth.api_key.id,
            status=ScheduledJobStatus.pending,
            executor={
                **cron_job_request.executor.model_dump(),
                'destination': str(cron_job_request.executor.destination),
            },
            scheduled_for=next,
            metadata_=cron_job_request.metadata,
        )

        try:
            session.add(scheduled_job)
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

        response.next_invocation = scheduled_job.scheduled_for

        # Insert cron invocation join record
        cron_invocation = DBCronInvocation(
            cron_job_id=cron_job.id,
            scheduled_job_id=scheduled_job.id,
            metadata_=cron_job.metadata_,
        )

        try:
            session.add(cron_invocation)
            await session.flush()
        except Exception as e:
            print(f'Error inserting into cron_invocation: {e}')
            context.errors.append(
                DeplioError(message='Failed to insert into cron_invocation')
            )

            return error_response(
                message='Internal server error',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                warnings=context.warnings,
                errors=context.errors,
            )

    await session.commit()
    return response


@router.delete(
    '/{cron_job_id}',
    summary='Delete a cron job',
    description='Delete a cron job from Deplio. Will also delete any associated scheduled jobs.',
    responses=generate_responses(DeleteCronJobResponse),
    tags=[Tags.CRON],
)
async def delete(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    session: DBSessionDependency,
    context: Annotated[Context, Depends(context)],
    cron_job_id: UUID,
):
    try:
        result = await session.execute(
            select(DBCronJob)
            .outerjoin(DBCronInvocation)
            .outerjoin(DBScheduledJob)
            .options(
                selectinload(DBCronJob.invocations).selectinload(
                    DBCronInvocation.scheduled_job.and_(
                        DBScheduledJob.started_at.is_(None)
                    )
                )
            )
            .where(
                DBCronJob.id == cron_job_id,
                DBCronJob.team_id == auth.team.id,
                DBCronJob.deleted_at.is_(None),
                DBScheduledJob.started_at.is_(None),
            )
        )
        cron_job = result.unique().scalar_one_or_none()
    except Exception as e:
        print(f'Error getting cron job: {e}')
        context.errors.append(DeplioError(message='Failed to get cron job'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    if not cron_job:
        return error_response(
            message='Cron job not found',
            status_code=status.HTTP_404_NOT_FOUND,
            warnings=context.warnings,
            errors=context.errors,
        )

    print(cron_job.invocations)
    print([i.scheduled_job for i in cron_job.invocations])

    invocations_to_delete = [
        invocation
        for invocation in cron_job.invocations
        if invocation.scheduled_job and invocation.scheduled_job.started_at is None
    ]

    deleted_at = datetime.now(UTC)

    cron_job.deleted_at = deleted_at
    scheduled_job_ids = []
    for invocation in invocations_to_delete:
        invocation.deleted_at = deleted_at
        invocation.scheduled_job.deleted_at = deleted_at
        scheduled_job_ids.append(invocation.scheduled_job.id)

    try:
        await session.flush()
    except Exception as e:
        print(f'Error deleting records: {e}')
        context.errors.append(DeplioError(message='Failed to delete records'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    await session.commit()
    return DeleteCronJobResponse(
        cron_job_id=cron_job_id,
        scheduled_job_ids=scheduled_job_ids,
        warnings=context.warnings,
    )
