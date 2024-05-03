from enum import StrEnum
from typing import Any, Optional
from uuid import UUID

from .._base import TimestampedDeplioModel
from .jobs import Executor


class CronJobStatus(StrEnum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'


class CronJob(TimestampedDeplioModel):
    team_id: UUID
    api_key_id: UUID
    status: CronJobStatus
    executor: Executor
    schedule: str
    metadata: Optional[dict[str, Any]]


class CronInvocation(TimestampedDeplioModel):
    cron_job_id: UUID
    scheduled_job_id: UUID
    metadata: Optional[dict[str, Any]]
