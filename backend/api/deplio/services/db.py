from typing import Annotated
from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# TODO: use proper url
async_engine = create_async_engine(
    'postgresql+asyncpg://postgres:postgres@localhost:54322/postgres'
)
sync_engine = create_engine(
    'postgresql+psycopg2://postgres:postgres@localhost:54322/postgres'
)

sync_sessionmaker = sessionmaker(bind=sync_engine, expire_on_commit=False)


async def db_session():
    async with AsyncSession(async_engine, expire_on_commit=False) as session:
        async with session.begin():
            yield session

        await session.close()


DBSessionDependency = Annotated[AsyncSession, Depends(db_session)]
