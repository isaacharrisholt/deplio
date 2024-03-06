from datetime import date
from typing import Optional
from pydantic import BaseModel


class Versions(BaseModel):
    latest: date
    current: Optional[date]
    team: Optional[date]
