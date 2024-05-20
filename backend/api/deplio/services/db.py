from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

# TODO: use the correct database URL
engine = create_async_engine(
    'postgresql+asyncpg://postgres:postgres@localhost:54322/postgres'
)


async def db_session():
    async with AsyncSession(engine) as session:
        yield session


DbSessionDependency = Annotated[AsyncSession, Depends(db_session)]
