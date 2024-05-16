from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# TODO: use proper url
engine = create_async_engine(
    'postgresql+asyncpg://postgres:postgres@localhost:54322/postgres'
)


async def db_session():
    async with AsyncSession(engine) as session:
        async with session.begin():
            yield session

        await session.close()


DBSessionDependency = Annotated[AsyncSession, Depends(db_session)]
