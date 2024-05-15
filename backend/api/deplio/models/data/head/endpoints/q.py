from typing import Annotated, Optional, Any

from pydantic import AnyHttpUrl, BaseModel, Field

from ..responses import DeplioResponse

from ..enums import HTTPMethod
from ._base import TimestampedDeplioModel
from uuid import UUID


class QRequest(TimestampedDeplioModel):
    team_id: UUID
    api_key_id: UUID
    destination: AnyHttpUrl
    method: HTTPMethod
    body: Optional[str]
    headers: Optional[dict[str, str]]
    query_params: Optional[dict[str, Any]]


class QResponse(TimestampedDeplioModel):
    request_id: UUID
    status_code: Optional[int]
    body: Optional[str]
    headers: Optional[dict[str, str]]
    response_time_ns: Optional[int]


class GetQMessagesResponse(DeplioResponse):
    class QRequestWithResponses(QRequest):
        responses: list[QResponse]

    requests: list[QRequestWithResponses]
    count: int
    total: int
    page: int
    page_size: int


class QMessage(BaseModel):
    destination: AnyHttpUrl
    body: Optional[str] = Field(None)
    method: HTTPMethod
    headers: Optional[dict[str, str]] = Field(None)
    metadata: Optional[dict[str, str]] = Field(None)


PostQMessagesRequest = (
    Annotated[QMessage, Field(..., title='Message')]
    | Annotated[list[QMessage], Field(..., max_length=10, title='Messages')]
)


class PostQMessagesResponse(DeplioResponse):
    request_ids: list[UUID]
    messages_delivered: int
