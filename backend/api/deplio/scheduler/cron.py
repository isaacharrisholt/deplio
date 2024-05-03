from typing import Any
from deplio.models.data.head.db.cron import CronJob, ScheduledJob
from deplio.services.supabase import supabase_admin
from deplio.utils.async_utils import synchronise
from deplio.utils.q import query_params_to_dict
from deplio.utils.supabase import execute_supabase_query


class ScheduledJobWithCron(ScheduledJob):
    cron_job: CronJob


async def http_executor_job_to_q_message_insert(
    job: ScheduledJobWithCron,
) -> dict[str, Any]:
    if job.executor.type != 'http':
        raise ValueError(f'Job is not an HTTP executor: {job.id}: {job!r}')

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


@synchronise
async def run_scheduled_jobs():
    supabase = await supabase_admin()

    try:
        response = await execute_supabase_query(
            supabase.table('scheduled_jobs').select('*'),
            'scheduled_jobs',
        )
    except Exception as e:
        print(f'Error fetching scheduled jobs: {e}')
        raise

    scheduled_jobs = [ScheduledJobWithCron(**job) for job in response]

    # Group jobs by executor type
    jobs_by_executor_type = {}

    for job in scheduled_jobs:
        jobs_by_executor_type.setdefault(job.executor.type, []).append(job)

    # sqs_messages: list[QSQSMessage] = []
    #
    # for job in scheduled_jobs:
    #     match job.executor.type:
    #         case 'http':
    #             sqs_messages.append(await http_executor_job_to_sqs_message(job))
