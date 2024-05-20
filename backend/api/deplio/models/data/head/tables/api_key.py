from ._base import TimestampedDeplioTable
from sqlalchemy import Column, ForeignKey, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP

api_key_table = TimestampedDeplioTable(
    'api_key',
    Column('team_id', ForeignKey('team.id'), nullable=False),
    Column('created_by', ForeignKey('auth.user.id'), nullable=False),
    Column('key_hash', Text, nullable=False),
    Column('key_prefix', Text, nullable=False),
    Column('name', Text, nullable=False),
    Column('expires_at', TIMESTAMP(timezone=True), nullable=True),
    Column('revoked_at', TIMESTAMP(timezone=True), nullable=True),
    Column('revoked_by', ForeignKey('auth.user.id'), nullable=True),
)
