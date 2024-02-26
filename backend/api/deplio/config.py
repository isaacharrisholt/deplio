from datetime import date
from pydantic_settings import BaseSettings
from deplio.models.versions import version_bundle

earliest_version = sorted(version_bundle.version_dates)[0]


class Settings(BaseSettings):
    version_header: str = 'X-Deplio-Api-Version'
    default_version: date = earliest_version


settings = Settings()

__all__ = ['settings']
