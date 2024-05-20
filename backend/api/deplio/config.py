from datetime import date
from pydantic_settings import BaseSettings
from deplio.models.versions import version_bundle
from pydantic import Field

earliest_version = sorted(version_bundle.version_dates)[0]
latest_version = sorted(version_bundle.version_dates)[-1]


class Settings(BaseSettings):
    version_header: str = 'Deplio-Version'
    default_version: date = earliest_version
    current_version: date = latest_version

    supabase_url: str = Field(validation_alias='PUBLIC_SUPABASE_URL')
    supabase_anon_key: str = Field(validation_alias='PUBLIC_SUPABASE_ANON_KEY')
    supabase_service_role_key: str = Field(
        validation_alias='PRIVATE_SUPABASE_SERVICE_ROLE_KEY',
    )

    supabase_db_user: str = Field(validation_alias='SUPABASE_DB_USER')
    supabase_db_password: str = Field(validation_alias='SUPABASE_DB_PASSWORD')
    supabase_db_name: str = Field(validation_alias='SUPABASE_DB_NAME')
    supabase_db_host: str = Field(validation_alias='SUPABASE_DB_HOST')
    supabase_db_port: str = Field(validation_alias='SUPABASE_DB_PORT')

    kv_url: str = Field(validation_alias='KV_URL')
    kv_rest_api_url: str = Field(validation_alias='KV_REST_API_URL')
    kv_rest_api_token: str = Field(validation_alias='KV_REST_API_TOKEN')

    deplio_q_queue_url: str = Field(validation_alias='DEPLIO_Q_QUEUE_URL')


settings = Settings()

__all__ = ['settings']
