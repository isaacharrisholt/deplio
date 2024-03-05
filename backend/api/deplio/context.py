from pydantic import BaseModel
from deplio.models.data.latest.responses import Warning


class Context(BaseModel):
    warnings: list[Warning] = []


def context():
    return Context()
