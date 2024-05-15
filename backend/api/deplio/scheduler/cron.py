import asyncio
from datetime import UTC, datetime
from typing import Any

from deplio.command.command_controller import CommandController
from deplio.command.supabase.insert import SupabaseInsertMany
from deplio.config import settings
from deplio.models.data.head.endpoints.cron import CronJob
from deplio.models.data.head.endpoints.jobs import ScheduledJob
from deplio.models.data.head.endpoints.q import QRequest
from deplio.modules.cron import schedule_cron_invocations
from deplio.services.sqs import SQS, SQSMessage
from deplio.services.supabase import SupabaseClient, supabase_admin
from deplio.types.q import QSQSMessage
from deplio.utils.async_utils import synchronise
from deplio.utils.q import query_params_to_dict
from deplio.utils.supabase import execute_supabase_query


class ScheduledJobWithCron(ScheduledJob):
    cron_job: list[CronJob]


def http_executor_job_to_q_request_insert(
    job: ScheduledJobWithCron,
) -> dict[str, Any]:
    match job.executor.version:
        case 1:
            message = job.executor
            return {
                'api_key_id': str(job.api_key_id),
                'team_id': str(job.team_id),
                'destination': str(message.destination),
                'body': message.body,
                'method': message.method,
                'headers': message.headers or {},
                'query_params': query_params_to_dict(
                    message.destination.query_params()
                ),
                'metadata': {**(job.metadata or {}), 'scheduled_job_id': str(job.id)},
            }


async def handle_http_executor_jobs(
    supabase: SupabaseClient, jobs: list[ScheduledJobWithCron]
):
    messages = [http_executor_job_to_q_request_insert(job) for job in jobs]

    controller = CommandController()
    q_request_insert = SupabaseInsertMany(supabase, 'q_request', messages)

    # Insert q_request
    try:
        q_request_records = await controller.execute(q_request_insert)
    except Exception as e:
        print(f'Error inserting message into Q: {e}')
        raise

    q_requests = [QRequest(**q_request) for q_request in q_request_records]

    # Convert q_request to SQSMessage
    sqs_messages = [
        QSQSMessage(
            destination=q_request.destination,
            body=q_request.body,
            method=q_request.method,
            headers=q_request.headers,
            request_id=q_request.id,
        )
        for q_request in q_requests
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
            await controller.undo_all()
        except Exception as e:
            print(f'Error undoing all inserts: {e}')
            raise

        raise Exception('Error sending messages to SQS')


MESSAGE_HANDLERS = {
    'http': handle_http_executor_jobs,
}


@synchronise
async def run_scheduled_jobs():
    supabase = await supabase_admin()

    # Note: we're not using a command controller here as we don't necessarily need to undo
    # the query if something goes wrong. We can just leave the jobs as pending and they will
    # be picked up again on the next run.
    # Equally, if a later step fails, we just record the status as failed, rather than rolling
    # back the entire process.
    try:
        scheduled_job_records = await execute_supabase_query(
            (
                supabase.table('scheduled_job')
                .select('*, cron_job(*)')
                .lte('scheduled_for', datetime.now(UTC).isoformat())
                .is_('deleted_at', 'null')
                .is_('cron_job.deleted_at', 'null')
                .eq('status', 'pending')
            ),
            'scheduled_job',
        )
    except Exception as e:
        print(f'Error fetching scheduled jobs: {e}')
        raise

    scheduled_jobs = [ScheduledJobWithCron(**job) for job in scheduled_job_records]
    print(f'Found {len(scheduled_jobs)} scheduled jobs')
    if not scheduled_jobs:
        print('No scheduled jobs to process')
        return

    # For any jobs that have a cron job, insert a new scheduled job for the next run
    cron_jobs = [job.cron_job[0] for job in scheduled_jobs if job.cron_job]
    print(f'Found {len(cron_jobs)} cron jobs to process')
    if cron_jobs:
        try:
            await schedule_cron_invocations(supabase, cron_jobs)
        except Exception as e:
            print(f'Error scheduling cron invocations: {e}')
            raise

    # Update scheduled jobs to running status
    try:
        await execute_supabase_query(
            (
                supabase.table('scheduled_job')
                .update(
                    {'status': 'running', 'started_at': datetime.now(UTC).isoformat()}
                )
                .in_('id', [job.id for job in scheduled_jobs])
            ),
            'scheduled_job',
        )
    except Exception as e:
        print(f'Error updating scheduled jobs to running status: {e}')
        raise

    # Group jobs by executor type
    jobs_by_executor_type = {}

    for job in scheduled_jobs:
        jobs_by_executor_type.setdefault(job.executor.type, []).append(job)

    # A list of failed jobs with the failure reason
    failed_jobs: list[tuple[ScheduledJobWithCron, str]] = []
    for executor_type, jobs in jobs_by_executor_type.items():
        handler = MESSAGE_HANDLERS.get(executor_type)
        if handler is None:
            failure_message = f'No handler for executor type: {executor_type}'
            print(failure_message)
            failed_jobs.extend([(job, failure_message) for job in jobs])
            continue

        try:
            await handler(supabase, jobs)
        except Exception as e:
            print(f'Error processing jobs for executor type: {executor_type}: {e}')
            failed_jobs.extend([(job, str(e)) for job in jobs])

    # Update jobs to mark completion
    try:
        await execute_supabase_query(
            (
                supabase.table('scheduled_job')
                .update(
                    {
                        'status': 'completed',
                        'finished_at': datetime.now(UTC).isoformat(),
                    }
                )
                .in_('id', [job.id for job in scheduled_jobs if job not in failed_jobs])
            ),
            'scheduled_job',
        )
    except Exception as e:
        print(f'Error updating scheduled jobs to completed status: {e}')
        raise

    if failed_jobs:
        print(f'{len(failed_jobs)} jobs failed, updating status to failed')
        updates = [
            execute_supabase_query(
                supabase.table('scheduled_job')
                .update(
                    {
                        'status': 'failed',
                        'finished_at': datetime.now(UTC).isoformat(),
                        'error': failure_message,
                    }
                )
                .eq('id', job.id),
                'scheduled_job',
            )
            for job, failure_message in failed_jobs
        ]
        try:
            await asyncio.gather(*updates)
        except Exception as e:
            print(f'Error updating failed jobs: {e}')
            raise

    print('Processed all scheduled jobs')
