from typing import Optional
from uuid import UUID
from pydantic import AnyHttpUrl, BaseModel

from deplio.models.data.latest.db.enums import HTTPMethod


class QSQSMessage(BaseModel):
    destination: AnyHttpUrl
    body: Optional[str]
    method: HTTPMethod
    headers: Optional[dict[str, str]]
    request_id: UUID
