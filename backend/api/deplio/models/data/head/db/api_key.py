from uuid import UUID

from pydantic import AwareDatetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.properties import ForeignKey
from ._base import TimestampedDeplioModel
from .user_and_team import DBTeam
import sqlalchemy as sa
from sqlalchemy import TIMESTAMP


class DBAPIKey(TimestampedDeplioModel):
    __tablename__ = 'api_key'

    team_id: Mapped[UUID] = mapped_column(ForeignKey('team.id'), nullable=False)
    team: Mapped[DBTeam] = relationship()

    created_by: Mapped[UUID] = mapped_column(ForeignKey('user.id'), nullable=False)
    key_hash: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    key_prefix: Mapped[str] = mapped_column(
        sa.String(6),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        sa.Text,
        nullable=False,
    )
    expires_at: Mapped[AwareDatetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    revoked_at: Mapped[AwareDatetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    revoked_by: Mapped[UUID | None] = mapped_column(
        ForeignKey('user.id'),
        nullable=True,
    )
