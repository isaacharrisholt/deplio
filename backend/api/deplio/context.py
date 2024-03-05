from pydantic import BaseModel
from deplio.models.data.latest.responses import DeplioWarning, DeplioError


class Context(BaseModel):
    warnings: list[DeplioWarning] = []
    errors: list[DeplioError] = []


def context():
    return Context()
