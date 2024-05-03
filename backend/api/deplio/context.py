from pydantic import BaseModel

from deplio.models.data.head.responses import DeplioError, DeplioWarning


class Context(BaseModel):
    warnings: list[DeplioWarning] = []
    errors: list[DeplioError] = []


def context():
    return Context()
