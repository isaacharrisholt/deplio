from typing import Optional
from uuid import UUID
from pydantic import AwareDatetime, BaseModel
import json


class DeplioBaseModel(BaseModel):
    def to_insert(self) -> dict:
        """Creates a JSON-serializable dictionary for inserting the model into the database."""
        return json.loads(self.model_dump_json())


class DeplioModel(DeplioBaseModel):
    id: UUID


class TimestampedDeplioModel(DeplioModel):
    created_at: AwareDatetime
    deleted_at: Optional[AwareDatetime]
