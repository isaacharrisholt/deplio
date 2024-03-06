import abc
from typing import Any, Optional
from pydantic import BaseModel


class Warning(BaseModel):
    message: str
    data: Optional[dict[str, Any]] = None


class DeplioResponse(BaseModel, abc.ABC):
    __abstract__ = True
    warnings: list[Warning]
