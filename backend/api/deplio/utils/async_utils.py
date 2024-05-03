from typing import Callable
from functools import wraps
import asyncio


def synchronise(fn: Callable):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return asyncio.run(fn(*args, **kwargs))

    return wrapper
