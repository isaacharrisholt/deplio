from typing import Optional
from uuid import UUID
from pydantic import AwareDatetime, BaseModel, ConfigDict


class DeplioModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID


class TimestampedDeplioModel(DeplioModel):
    created_at: AwareDatetime
    deleted_at: Optional[AwareDatetime]
