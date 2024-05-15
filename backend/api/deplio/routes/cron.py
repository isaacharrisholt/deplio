from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from cron_converter import Cron
from fastapi import Depends, Query, status

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.command.command_controller import CommandController
from deplio.command.supabase.insert import SupabaseInsertSingle
from deplio.context import Context, context
from deplio.models.data.head.endpoints.cron import CronJob
from deplio.models.data.head.enums import CronJobStatus, ScheduledJobStatus
from deplio.models.data.head.endpoints.jobs import ScheduledJob
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
from deplio.services.supabase import SupabaseClient, supabase_admin
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
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
):
    try:
        response = (
            await supabase_admin.table('cron_job')
            .select('*', count='exact')  # type: ignore
            .eq('team_id', auth.team.id)
            .order('created_at', desc=True)
            .is_('deleted_at', 'null')
            .range((page - 1) * page_size, page * page_size)
            .execute()
        )
    except Exception as e:
        print(f'Error getting cron jobs: {e}')
        context.errors.append(DeplioError(message='Failed to get cron jobs'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    if response.count is None:
        context.errors.append(DeplioError(message='Failed to get cron jobs'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    return GetCronJobsResponse(
        cron_jobs=[CronJob(**record) for record in response.data],
        count=len(response.data),
        total=response.count,
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
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    cron_job_request: PostCronJobRequest,
):
    print(cron_job_request, context)
    cron_schedule = Cron(cron_job_request.schedule)
    print(cron_schedule.parts)

    controller = CommandController()

    cron_job_insert = SupabaseInsertSingle(
        supabase_admin,
        'cron_job',
        {
            'team_id': str(auth.team.id),
            'api_key_id': str(auth.api_key.id),
            'status': cron_job_request.status,
            'executor': {
                **cron_job_request.executor.model_dump(),
                'destination': str(cron_job_request.executor.destination),
            },
            'schedule': cron_job_request.schedule,
            'metadata': cron_job_request.metadata,
        },
    )

    try:
        cron_job_record = await controller.execute(cron_job_insert)
    except Exception as e:
        print(f'Error inserting into cron_job: {e}')
        context.errors.append(DeplioError(message='Failed to insert into cron_job'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    cron_job = CronJob(**cron_job_record)

    response = PostCronJobResponse(cron_job_id=cron_job.id, warnings=context.warnings)

    if cron_job.status == CronJobStatus.ACTIVE:
        # Get next cron invocation time and schedule it
        cron = Cron(cron_job.schedule)
        schedule = cron.schedule(cron_job.created_at)
        next = schedule.next()

        scheduled_job_insert = SupabaseInsertSingle(
            supabase_admin,
            'scheduled_job',
            {
                'api_key_id': str(auth.api_key.id),
                'team_id': str(auth.team.id),
                'status': ScheduledJobStatus.PENDING,
                'executor': {
                    **cron_job.executor.model_dump(),
                    'destination': str(cron_job.executor.destination),
                },
                'scheduled_for': next.isoformat(),
                'metadata': cron_job.metadata,
            },
        )

        try:
            scheduled_job_record = await controller.execute(scheduled_job_insert)
        except Exception as e:
            print(f'Error inserting into scheduled_job: {e}')
            context.errors.append(
                DeplioError(message='Failed to insert into scheduled_job')
            )

            try:
                await controller.undo_all()
            except Exception as e:
                print(f'Error undoing all inserts: {e}')
                context.errors.append(DeplioError(message='Failed to undo all inserts'))

            return error_response(
                message='Internal server error',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                warnings=context.warnings,
                errors=context.errors,
            )

        scheduled_job = ScheduledJob(**scheduled_job_record)
        response.next_invocation = scheduled_job.scheduled_for

        # Insert cron invocation join record
        cron_invocation_insert = SupabaseInsertSingle(
            supabase_admin,
            'cron_invocation',
            {
                'cron_job_id': str(cron_job.id),
                'scheduled_job_id': str(scheduled_job.id),
                'metadata': cron_job.metadata,
            },
        )

        try:
            await controller.execute(cron_invocation_insert)
        except Exception as e:
            print(f'Error inserting into cron_invocation: {e}')
            context.errors.append(
                DeplioError(message='Failed to insert into cron_invocation')
            )

            try:
                await controller.undo_all()
            except Exception as e:
                print(f'Error undoing all inserts: {e}')
                context.errors.append(DeplioError(message='Failed to undo all inserts'))

            return error_response(
                message='Internal server error',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                warnings=context.warnings,
                errors=context.errors,
            )

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
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    cron_job_id: UUID,
):
    # TODO: Add a comand controller to handle this
    try:
        cron_delete_response = (
            await supabase_admin.table('cron_job')
            .update({'deleted_at': datetime.now(UTC).isoformat()})
            .eq('id', str(cron_job_id))
            .eq('team_id', auth.team.id)
            .is_('deleted_at', 'null')
            .execute()
        )
    except Exception as e:
        print(f'Error deleting cron job: {e}')
        context.errors.append(DeplioError(message='Failed to delete cron job'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    if len(cron_delete_response.data) == 0:
        return error_response(
            message='Cron job not found',
            status_code=status.HTTP_404_NOT_FOUND,
            warnings=context.warnings,
            errors=context.errors,
        )

    try:
        cron_invocation_response = (
            await supabase_admin.table('cron_invocation')
            .select('*')
            .eq('cron_job_id', str(cron_job_id))
            .execute()
        )
    except Exception as e:
        print(f'Error fetching cron invocations: {e}')
        context.errors.append(DeplioError(message='Failed to fetch cron invocations'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    try:
        scheduled_job_delete_response = (
            await supabase_admin.table('scheduled_job')
            .update({'deleted_at': datetime.now(UTC).isoformat()})
            .in_(
                'id',
                [
                    record['scheduled_job_id']
                    for record in cron_invocation_response.data
                ],
            )
            .is_('started_at', 'null')
            .execute()
        )
    except Exception as e:
        print(f'Error deleting scheduled jobs: {e}')
        context.errors.append(DeplioError(message='Failed to delete scheduled jobs'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    scheduled_job_ids = [record['id'] for record in scheduled_job_delete_response.data]

    try:
        (
            await supabase_admin.table('cron_invocation')
            .update({'deleted_at': datetime.now(UTC).isoformat()})
            .in_('scheduled_job_id', scheduled_job_ids)
            .execute()
        )
    except Exception as e:
        print(f'Error deleting cron invocations: {e}')
        context.errors.append(DeplioError(message='Failed to delete cron invocations'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    return DeleteCronJobResponse(
        cron_job_id=cron_job_id,
        scheduled_job_ids=scheduled_job_ids,
        warnings=context.warnings,
    )
