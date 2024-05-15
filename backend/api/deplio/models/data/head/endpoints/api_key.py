from typing import Annotated, Optional
from uuid import UUID

from pydantic import AwareDatetime, Field
from ._base import TimestampedDeplioModel


class APIKey(TimestampedDeplioModel):
    team_id: UUID
    created_by: UUID
    key_hash: str
    key_prefix: Annotated[str, Field(..., min_length=6, max_length=6)]
    name: str
    expires_at: Optional[AwareDatetime]
    revoked_at: Optional[AwareDatetime]
    revoked_by: Optional[UUID]
