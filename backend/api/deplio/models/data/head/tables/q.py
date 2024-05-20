from ._base import TimestampedDeplioTable
from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB

q_request_table = TimestampedDeplioTable(
    'q_request',
    Column('team_id', ForeignKey('team.id'), nullable=False),
    Column('api_key_id', ForeignKey('api_key.id'), nullable=False),
    Column('destination', Text, nullable=False),
    Column('method', Text, nullable=False),
    Column('body', Text, nullable=True),
    Column('headers', JSONB, nullable=True),
    Column('query_params', JSONB, nullable=True),
    Column('metadata', JSONB, nullable=True),
)

q_response_table = TimestampedDeplioTable(
    'q_response',
    Column('q_request_id', ForeignKey('q_request.id'), nullable=False),
    Column('status_code', Text, nullable=False),
    Column('body', Text, nullable=True),
    Column('headers', JSONB, nullable=True),
    Column('response_time_ns', Integer, nullable=True),
)
