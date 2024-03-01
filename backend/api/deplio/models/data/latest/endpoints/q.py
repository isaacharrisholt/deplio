from pydantic import BaseModel
from deplio.models.data.latest.db.q import QRequest, QResponse


class GetQRequestsResponse(BaseModel):
    class QRequestWithResponses(QRequest):
        q_response: list[QResponse]

    q_requests: list[QRequestWithResponses]
    count: int
    total: int
    page: int
    page_size: int
