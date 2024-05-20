from typing import Optional
from uuid import UUID

from pydantic import AwareDatetime, BaseModel

from ..db.jobs import Executor
from ..responses import DeplioResponse


class PostScheduledJobRequest(BaseModel):
    executor: Executor
    schedule_for: AwareDatetime
    metadata: Optional[dict[str, str]] = None


class PostScheduledJobResponse(DeplioResponse):
    scheduled_job_id: UUID
    next_invocation: Optional[AwareDatetime] = None
