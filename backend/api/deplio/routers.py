from cadwyn import VersionedAPIRouter


def create_router(prefix: str = ''):
    return VersionedAPIRouter(prefix=prefix)
