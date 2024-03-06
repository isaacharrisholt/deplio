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

    kv_rest_api_url: str = Field(validation_alias='KV_REST_API_URL')
    kv_rest_api_token: str = Field(validation_alias='KV_REST_API_TOKEN')

    aws_sqs_queue_url: str = Field(validation_alias='AWS_SQS_QUEUE_URL')


settings = Settings()

__all__ = ['settings']
