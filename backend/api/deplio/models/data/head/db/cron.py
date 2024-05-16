from typing import Any
from uuid import UUID
from sqlalchemy.dialects.postgresql import ENUM as PgEnum, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.properties import ForeignKey
import sqlalchemy as sa

from .user_and_team import DBTeam

from ._base import TimestampedDeplioModel
from .jobs import DBScheduledJob
from ..enums import CronJobStatus


class DBCronInvocation(TimestampedDeplioModel):
    __tablename__ = 'cron_invocation'

    cron_job_id: Mapped[UUID] = mapped_column(
        ForeignKey('cron_job.id'),
    )
    cron_job: Mapped['DBCronJob'] = relationship(back_populates='invocations')

    scheduled_job_id: Mapped[UUID] = mapped_column(
        ForeignKey('scheduled_job.id'),
    )
    scheduled_job: Mapped[DBScheduledJob] = relationship(
        single_parent=True,
    )

    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        name='metadata',
    )


class DBCronJob(TimestampedDeplioModel):
    __tablename__ = 'cron_job'

    team_id: Mapped[UUID] = mapped_column(
        ForeignKey('team.id'),
    )
    team: Mapped[DBTeam] = relationship()
    api_key_id: Mapped[UUID] = mapped_column(
        ForeignKey('api_key.id'),
    )
    status: Mapped[CronJobStatus] = mapped_column(
        PgEnum(CronJobStatus, name='cron_job_status'),
        nullable=False,
    )
    executor: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
    )
    schedule: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        name='metadata',
    )

    invocations: Mapped[list[DBCronInvocation]] = relationship(
        back_populates='cron_job',
    )
