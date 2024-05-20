from sqlalchemy import Column, ForeignKey, Text

from ..db.cron import CronJobStatus
from ._base import TimestampedDeplioTable
from sqlalchemy.dialects.postgresql import JSONB, ENUM as PgEnum

cron_job_table = TimestampedDeplioTable(
    'cron_job',
    Column('team_id', ForeignKey('team.id'), nullable=False),
    Column('api_key_id', ForeignKey('api_key.id'), nullable=False),
    Column('status', PgEnum(CronJobStatus, name='cron_job_status'), nullable=False),
    Column('executor', JSONB, nullable=False),
    Column('schedule', Text, nullable=False),
    Column('metadata', JSONB, nullable=True),
)

cron_invocation_table = TimestampedDeplioTable(
    'cron_invocation',
    Column('cron_job_id', ForeignKey('cron_job.id'), nullable=False),
    Column('scheduled_job_id', ForeignKey('scheduled_job.id'), nullable=False),
    Column('metadata', JSONB, nullable=True),
)
