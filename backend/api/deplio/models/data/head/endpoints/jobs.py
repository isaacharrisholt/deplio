from typing import Optional, Literal, Annotated, Any
from uuid import UUID
from pydantic import AnyHttpUrl, BaseModel, Field, AwareDatetime
from ._base import TimestampedDeplioModel

from deplio.models.data.head.responses import DeplioResponse
from ..enums import HTTPMethod, ScheduledJobStatus


class HTTPExecutorV1(BaseModel):
    type: Literal['http']
    version: Literal[1]
    destination: AnyHttpUrl
    method: HTTPMethod
    body: Optional[str] = None
    headers: Optional[dict[str, str]] = None


HTTPExecutor = Annotated[HTTPExecutorV1, Field(..., discriminator='version')]

Executor = Annotated[HTTPExecutor, Field(..., discriminator='type')]


class ScheduledJob(TimestampedDeplioModel):
    team_id: UUID
    api_key_id: UUID
    status: ScheduledJobStatus
    executor: Executor
    scheduled_for: AwareDatetime
    started_at: Optional[AwareDatetime]
    finished_at: Optional[AwareDatetime]
    error: Optional[str]
    metadata: Optional[dict[str, Any]]


class PostScheduledJobRequest(BaseModel):
    executor: Executor
    schedule_for: AwareDatetime
    metadata: Optional[dict[str, str]] = None


class PostScheduledJobResponse(DeplioResponse):
    scheduled_job_id: UUID
    next_invocation: Optional[AwareDatetime] = None
