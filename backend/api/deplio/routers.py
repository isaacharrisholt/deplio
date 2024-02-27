from cadwyn import VersionedAPIRouter
from fastapi import Depends
from deplio.auth.dependencies import auth


def create_router(prefix: str = ''):
    return VersionedAPIRouter(prefix=prefix)


def create_authenticated_router(prefix: str = ''):
    return VersionedAPIRouter(prefix=prefix, dependencies=[Depends(auth)])
