from datetime import UTC, datetime

from cron_converter import Cron
from sqlalchemy.orm import Session

from deplio.models.data.head.db.cron import DBCronInvocation, DBCronJob
from deplio.models.data.head.enums import CronJobStatus, ScheduledJobStatus
from deplio.models.data.head.db.jobs import DBScheduledJob


def schedule_cron_invocations(session: Session, cron_jobs: list[DBCronJob]):
    with session.begin_nested():
        active_cron_jobs = [
            job for job in cron_jobs if job.status == CronJobStatus.active
        ]

        scheduled_jobs: list[DBScheduledJob] = []
        for cron_job in active_cron_jobs:
            # Get next cron invocation time and schedule it
            cron = Cron(cron_job.schedule)
            schedule = cron.schedule(datetime.now(UTC))
            next = schedule.next()

            scheduled_job_insert = DBScheduledJob(
                api_key_id=str(cron_job.api_key_id),
                team_id=str(cron_job.team_id),
                status=ScheduledJobStatus.pending,
                executor=cron_job.executor,
                scheduled_for=next,
                metadata_=cron_job.metadata_,
            )

            scheduled_jobs.append(scheduled_job_insert)

        try:
            session.add_all(scheduled_jobs)
            session.flush()
            print(f'Inserted {len(scheduled_jobs)} scheduled jobs')
        except Exception as e:
            print(f'Error inserting scheduled jobs: {e}')
            raise

        cron_invocation_inserts = [
            DBCronInvocation(
                cron_job_id=active_cron_jobs[i].id,
                scheduled_job_id=scheduled_job.id,
                metadata_=active_cron_jobs[i].metadata_,
            )
            for i, scheduled_job in enumerate(scheduled_jobs)
        ]

        try:
            session.add_all(cron_invocation_inserts)
            session.flush()
        except Exception as e:
            print(f'Error inserting cron invocations: {e}')
            session.rollback()
            raise

        session.commit()
