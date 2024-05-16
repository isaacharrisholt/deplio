from datetime import UTC, datetime

from pydantic_core import Url
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from deplio.config import settings
from deplio.models.data.head.db.cron import DBCronInvocation, DBCronJob
from deplio.models.data.head.db.jobs import DBScheduledJob
from deplio.models.data.head.db.q import DBQRequest
from deplio.models.data.head.endpoints.cron import CronJob
from deplio.models.data.head.endpoints.jobs import (
    ScheduledJob,
)
from deplio.models.data.head.enums import ScheduledJobStatus
from deplio.modules.cron import schedule_cron_invocations
from deplio.services.db import sync_sessionmaker
from deplio.services.sqs import SQS, SQSMessage
from deplio.types.q import QSQSMessage
from deplio.utils.q import query_params_to_dict


class ScheduledJobWithCron(ScheduledJob):
    cron_job: list[CronJob]


def http_executor_job_to_q_request_insert(
    job: ScheduledJob,
) -> DBQRequest:
    executor = job.executor
    match executor.version:
        case 1:
            return DBQRequest(
                api_key_id=str(job.api_key_id),
                team_id=str(job.team_id),
                destination=str(executor.destination),
                body=executor.body,
                method=executor.method,
                headers=executor.headers or {},
                query_params=query_params_to_dict(executor.destination.query_params()),
                metadata_={**(job.metadata or {}), 'scheduled_job_id': str(job.id)},
            )


def handle_http_executor_jobs(session: Session, jobs: list[DBScheduledJob]):
    messages = [
        http_executor_job_to_q_request_insert(ScheduledJob.model_validate(job))
        for job in jobs
    ]

    # Insert q_request
    try:
        session.add_all(messages)
        session.flush()
    except Exception as e:
        print(f'Error inserting message into Q: {e}')
        raise

    # Convert q_request to SQSMessage
    sqs_messages = [
        QSQSMessage(
            destination=Url(q_request.destination),
            body=q_request.body,
            method=q_request.method,
            headers=q_request.headers,
            request_id=q_request.id,
        )
        for q_request in messages
    ]

    sqs = SQS()
    sqs_response = sqs.send_messages(
        [
            SQSMessage(
                Id=str(message.request_id), MessageBody=message.model_dump_json()
            )
            for message in sqs_messages
        ],
        settings.deplio_q_queue_url,
    )

    if 'Successful' not in sqs_response:
        print('Error sending messages to SQS')

        try:
            session.rollback()
        except Exception as e:
            print(f'Error undoing all inserts: {e}')
            raise

        raise Exception('Error sending messages to SQS')


MESSAGE_HANDLERS = {
    'http': handle_http_executor_jobs,
}


def run_scheduled_jobs():
    with sync_sessionmaker() as session:
        # Note: we're not using a command controller here as we don't necessarily need to undo
        # the query if something goes wrong. We can just leave the jobs as pending and they will
        # be picked up again on the next run.
        # Equally, if a later step fails, we just record the status as failed, rather than rolling
        # back the entire process.
        try:
            scheduled_jobs_and_cron_jobs = (
                session.execute(
                    select(DBScheduledJob, DBCronJob)
                    .outerjoin(
                        DBCronInvocation,
                        onclause=DBScheduledJob.id == DBCronInvocation.scheduled_job_id,
                    )
                    .outerjoin(
                        DBCronJob,
                        onclause=DBCronInvocation.cron_job_id == DBCronJob.id,
                    )
                    .where(
                        DBScheduledJob.scheduled_for <= datetime.now(UTC),
                        DBScheduledJob.status == 'pending',
                        DBScheduledJob.deleted_at.is_(None),
                        DBCronJob.deleted_at.is_(None),
                        DBCronInvocation.deleted_at.is_(None),
                    )
                )
                .tuples()
                .all()
            )
        except Exception as e:
            print(f'Error fetching scheduled jobs: {e}')
            raise

        if not scheduled_jobs_and_cron_jobs:
            print('No scheduled jobs to process')
            return

        scheduled_jobs_and_cron_jobs[0][0].status = ScheduledJobStatus.running

        # For any jobs that have a cron job, insert a new scheduled job for the next run
        # cron_jobs = {job[1] for job in scheduled_jobs_and_cron_jobs if job[1] is not None}
        cron_jobs = []
        for _, cron_job in scheduled_jobs_and_cron_jobs:
            if cron_job is not None:
                cron_jobs.append(cron_job)
        print(f'Found {len(cron_jobs)} cron jobs to process')
        if cron_jobs:
            try:
                print('Scheduling cron invocations')
                schedule_cron_invocations(session, list(cron_jobs))
            except Exception as e:
                print(f'Error scheduling cron invocations: {e}')
                raise

        # Update scheduled jobs to running status
        # scheduled_jobs = {
        #     job[0] for job in scheduled_jobs_and_cron_jobs if job[0] is not None
        # }
        scheduled_jobs = []
        for job, _ in scheduled_jobs_and_cron_jobs:
            if job is not None:
                scheduled_jobs.append(job)

        updates = [
            {
                'id': job.id,
                'status': ScheduledJobStatus.running,
                'started_at': datetime.now(UTC),
            }
            for job in scheduled_jobs
        ]
        try:
            session.execute(
                update(DBScheduledJob),
                updates,
            )
            print(f'Updated {len(scheduled_jobs)} scheduled jobs to running status')
        except Exception as e:
            print(f'Error updating scheduled jobs to running status: {e}')
            raise

    # Group jobs by executor type
    jobs_by_executor_type = {}

    for job in scheduled_jobs:
        if not job.executor.get('type'):
            raise ValueError(f'No executor type for job {job.id}')
        jobs_by_executor_type.setdefault(job.executor['type'], []).append(job)

    # A list of failed jobs with the failure reason
    completed_jobs: list[DBScheduledJob] = []
    failed_jobs: list[tuple[DBScheduledJob, str]] = []
    for executor_type, jobs in jobs_by_executor_type.items():
        handler = MESSAGE_HANDLERS.get(executor_type)
        if handler is None:
            failure_message = f'No handler for executor type: {executor_type}'
            print(failure_message)
            failed_jobs.extend([(job, failure_message) for job in jobs])
            continue

        try:
            handler(session, jobs)
            completed_jobs.extend(jobs)
        except Exception as e:
            print(f'Error processing jobs for executor type: {executor_type}: {e}')
            failed_jobs.extend([(job, str(e)) for job in jobs])

    # Update jobs to mark completion
    finished_at = datetime.now(UTC)
    updates = []
    for job in completed_jobs:
        updates.append(
            {
                'id': job.id,
                'status': ScheduledJobStatus.completed,
                'finished_at': finished_at,
            }
        )

    for job, failure_message in failed_jobs:
        updates.append(
            {
                'id': job.id,
                'status': ScheduledJobStatus.failed,
                'finished_at': finished_at,
                'error': failure_message,
            }
        )

    with sync_sessionmaker() as session:
        try:
            session.execute(
                update(DBScheduledJob),
                updates,
            )
            session.commit()
        except Exception as e:
            print(f'Error updating scheduled jobs to completed status: {e}')
            raise

    print('Processed all scheduled jobs')
