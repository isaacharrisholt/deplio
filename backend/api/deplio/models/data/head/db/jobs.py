from typing import Any
from uuid import UUID

from pydantic import AwareDatetime
from sqlalchemy import ForeignKey, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import JSONB, ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .api_key import DBAPIKey
from .user_and_team import DBTeam

from ._base import TimestampedDeplioModel
from ..enums import ScheduledJobStatus


class DBScheduledJob(TimestampedDeplioModel):
    __tablename__ = 'scheduled_job'

    team_id: Mapped[UUID] = mapped_column(
        ForeignKey('team.id'),
    )
    team: Mapped[DBTeam] = relationship(back_populates='scheduled_jobs')

    api_key_id: Mapped[DBAPIKey] = relationship(back_populates='scheduled_jobs')
    status: Mapped[ScheduledJobStatus] = mapped_column(
        PgEnum(ScheduledJobStatus, name='scheduled_job_status'),
        nullable=False,
    )
    executor: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )
    scheduled_for: Mapped[AwareDatetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
    )
    started_at: Mapped[AwareDatetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    finished_at: Mapped[AwareDatetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        name='metadata',
    )
