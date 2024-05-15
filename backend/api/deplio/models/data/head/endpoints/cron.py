from typing import Annotated, Optional, Any
from uuid import UUID

from cron_converter import Cron
from fastapi.exceptions import RequestValidationError
from pydantic import AfterValidator, AwareDatetime, BaseModel

from .jobs import Executor
from ..responses import DeplioResponse
from enum import StrEnum

from ._base import TimestampedDeplioModel


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


def validate_cron_schedule(schedule: str) -> str:
    try:
        c = Cron(schedule)
        if c.parts is None:
            raise RequestValidationError(
                ['Invalid cron schedule: cron schedule is empty']
            )
    except ValueError as e:
        raise RequestValidationError([f'Invalid cron schedule: {e}']) from e

    return schedule


CronSchedule = Annotated[str, AfterValidator(validate_cron_schedule)]


class GetCronJobsResponse(DeplioResponse):
    cron_jobs: list[CronJob]
    count: int
    total: int
    page: int
    page_size: int


class PostCronJobRequest(BaseModel):
    status: CronJobStatus = CronJobStatus.ACTIVE
    executor: Executor
    schedule: CronSchedule
    metadata: Optional[dict[str, str]] = None


class PostCronJobResponse(DeplioResponse):
    cron_job_id: UUID
    next_invocation: Optional[AwareDatetime] = None


class DeleteCronJobResponse(DeplioResponse):
    cron_job_id: UUID
    scheduled_job_ids: list[UUID]
