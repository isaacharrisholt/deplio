from typing import Annotated

from cron_converter import Cron
from fastapi import Depends, status

from deplio.auth.dependencies import APIKeyAuthCredentials, api_key_auth
from deplio.command.command_controller import CommandController
from deplio.command.supabase.insert import SupabaseInsertSingle
from deplio.context import Context, context
from deplio.models.data.head.db.cron import CronJob, CronJobStatus
from deplio.models.data.head.db.jobs import ScheduledJob, ScheduledJobStatus
from deplio.models.data.head.endpoints.cron import (
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

    response = PostCronJobResponse(cron_job_id=cron_job.id)

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
