from typing import Optional
from uuid import UUID
from pydantic import AwareDatetime, BaseModel, ConfigDict, model_validator
from ..db._base import Model


class DeplioModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID

    # Handle converting `metadata_` ORM columns to `metadata` Pydantic fields
    @model_validator(mode='before')
    @classmethod
    def _convert_metadata(cls, values):
        if isinstance(values, Model):
            values = values.__dict__

        if 'metadata_' in values:
            values['metadata'] = values.pop('metadata_')
        return values


class TimestampedDeplioModel(DeplioModel):
    created_at: AwareDatetime
    deleted_at: Optional[AwareDatetime]
