from typing import Annotated
from fastapi import Depends
from sqlalchemy import URL
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from deplio.config import settings

engine = create_async_engine(
    URL.create(
        'postgresql+asyncpg',
        username=settings.supabase_db_user,
        password=settings.supabase_db_password,
        database=settings.supabase_db_name,
        host=settings.supabase_db_host,
        port=settings.supabase_db_port,
    )
)


async def db_session():
    async with AsyncSession(engine) as session:
        yield session


DbSessionDependency = Annotated[AsyncSession, Depends(db_session)]
