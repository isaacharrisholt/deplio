from typing import Optional
from uuid import UUID
from pydantic import AwareDatetime, BaseModel


class DeplioModel(BaseModel):
    id: UUID


class TimestampedDeplioModel(DeplioModel):
    created_at: AwareDatetime
    deleted_at: Optional[AwareDatetime]
