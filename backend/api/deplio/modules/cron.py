from typing import Any
from cron_converter import Cron
from deplio.command.command_controller import CommandController
from deplio.command.supabase.insert import SupabaseInsertMany
from deplio.models.data.head.db.cron import (
    CronJob,
    CronJobStatus,
    ScheduledJob,
    ScheduledJobStatus,
)
from deplio.services.supabase import SupabaseClient


async def schedule_cron_invocations(supabase: SupabaseClient, cron_jobs: list[CronJob]):
    controller = CommandController()
    active_cron_jobs = [job for job in cron_jobs if job.status == CronJobStatus.ACTIVE]

    inserts: list[dict[str, Any]] = []
    for cron_job in active_cron_jobs:
        # Get next cron invocation time and schedule it
        cron = Cron(cron_job.schedule)
        schedule = cron.schedule(cron_job.created_at)
        next = schedule.next()

        scheduled_job_insert = {
            'api_key_id': str(cron_job.api_key_id),
            'team_id': str(cron_job.team_id),
            'status': ScheduledJobStatus.PENDING,
            'executor': {
                **cron_job.executor.model_dump(),
                'destination': str(cron_job.executor.destination),
            },
            'scheduled_for': next.isoformat(),
            'metadata': cron_job.metadata,
        }

        inserts.append(scheduled_job_insert)

    scheduled_job_insert = SupabaseInsertMany(supabase, 'scheduled_job', inserts)

    try:
        scheduled_job_records = await controller.execute(scheduled_job_insert)
    except Exception as e:
        print(f'Error inserting scheduled jobs: {e}')
        raise

    scheduled_jobs = [
        ScheduledJob(**scheduled_job) for scheduled_job in scheduled_job_records
    ]

    cron_invocation_inserts = [
        {
            'cron_job_id': str(active_cron_jobs[i].id),
            'scheduled_job_id': str(scheduled_job.id),
            'metadata': active_cron_jobs[i].metadata,
        }
        for i, scheduled_job in enumerate(scheduled_jobs)
    ]

    cron_invocation_insert = SupabaseInsertMany(
        supabase, 'cron_invocation', cron_invocation_inserts
    )

    try:
        await controller.execute(cron_invocation_insert)
    except Exception as e:
        print(f'Error inserting cron invocations: {e}')
        await controller.undo_all()
        raise
