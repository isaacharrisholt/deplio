from ._base import TimestampedDeplioTable
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import DATE

team_table = TimestampedDeplioTable(
    'team',
    Column('name', Text, nullable=False),
    Column('type', Text, nullable=False),
    Column('avatar_url', Text, nullable=True),
    Column('api_version', DATE, nullable=False),
)
