from sqlalchemy import Column, MetaData, Table
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.schema import SchemaItem

metadata_obj = MetaData()


def DeplioTable(name: str, *columns: SchemaItem) -> Table:
    return Table(
        name,
        metadata_obj,
        *columns,
        Column('id', UUID, primary_key=True, server_default='tuid6()'),
    )


def TimestampedDeplioTable(name: str, *columns: SchemaItem) -> Table:
    return DeplioTable(
        name,
        *columns,
        Column(
            'created_at',
            TIMESTAMP(timezone=True),
            nullable=False,
            server_default='now()',
        ),
        Column('deleted_at', TIMESTAMP(timezone=True), nullable=True),
    )
