from datetime import UTC, datetime
from typing import Any

from cron_converter import Cron
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from deplio.services.db import engine
from deplio.models.data.head.db.cron import CronJob, CronJobStatus
from deplio.models.data.head.db.jobs import ScheduledJob, ScheduledJobStatus
from deplio.models.data.head.tables.jobs import scheduled_job_table
from deplio.models.data.head.tables.cron import cron_invocation_table


async def schedule_cron_invocations(cron_jobs: list[CronJob]):
    async with AsyncSession(engine) as session:
        active_cron_jobs = [
            job for job in cron_jobs if job.status == CronJobStatus.active
        ]

        inserts: list[dict[str, Any]] = []
        for cron_job in active_cron_jobs:
            # Get next cron invocation time and schedule it
            cron = Cron(cron_job.schedule)
            schedule = cron.schedule(datetime.now(UTC))
            next = schedule.next()

            scheduled_job_insert = {
                'api_key_id': str(cron_job.api_key_id),
                'team_id': str(cron_job.team_id),
                'status': ScheduledJobStatus.pending,
                'executor': {
                    **cron_job.executor.model_dump(),
                    'destination': str(cron_job.executor.destination),
                },
                'scheduled_for': next.isoformat(),
                'metadata': cron_job.metadata,
            }

            inserts.append(scheduled_job_insert)

        try:
            response = await session.execute(
                insert(scheduled_job_table)
                .values(inserts)
                .returning(scheduled_job_table)
            )
            scheduled_jobs = [
                ScheduledJob(**scheduled_job) for scheduled_job in response.mappings()
            ]
        except Exception as e:
            print(f'Error inserting scheduled jobs: {e}')
            raise

        cron_invocation_inserts = [
            {
                'cron_job_id': str(active_cron_jobs[i].id),
                'scheduled_job_id': str(scheduled_job.id),
                'metadata': active_cron_jobs[i].metadata,
            }
            for i, scheduled_job in enumerate(scheduled_jobs)
        ]

        try:
            await session.execute(
                insert(cron_invocation_table).values(cron_invocation_inserts)
            )
        except Exception as e:
            print(f'Error inserting cron invocations: {e}')
            raise

        await session.commit()
