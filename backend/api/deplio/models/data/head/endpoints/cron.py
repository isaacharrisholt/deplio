from typing import Optional

from pydantic import BaseModel

from deplio.models.data.head.db.cron import CronJobStatus, HTTPExecutor


class PostCronJobRequest(BaseModel):
    status: CronJobStatus = CronJobStatus.ACTIVE
    executor: HTTPExecutor
    schedule: str
    metadata: Optional[dict[str, str]] = None
