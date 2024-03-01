from typing import Optional

from pydantic import AnyUrl
from ._base import TimestampedDeplioModel
from .enums import TeamType


class Team(TimestampedDeplioModel):
    name: str
    type: TeamType
    avatar_url: Optional[AnyUrl]
