from typing import Optional
from uuid import UUID
from pydantic import AnyUrl
from ._base import TimestampedDeplioModel


class User(TimestampedDeplioModel):
    user_id: UUID
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    avatar_url: Optional[AnyUrl]
