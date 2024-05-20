from sqlalchemy import Column, ForeignKey, Text
from ._base import TimestampedDeplioTable

user_table = TimestampedDeplioTable(
    'user',
    Column('user_id', ForeignKey('auth.user.id'), nullable=False),
    Column('username', Text, nullable=False),
    Column('email', Text, nullable=False),
    Column('first_name', Text, nullable=True),
    Column('last_name', Text, nullable=True),
    Column('avatar_url', Text, nullable=True),
)
