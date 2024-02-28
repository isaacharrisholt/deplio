from supabase._async.client import create_client, AsyncClient as SupabaseClient
from deplio.config import settings


async def supabase_client() -> SupabaseClient:
    return await create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )


async def supabase_admin() -> SupabaseClient:
    return await create_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )


__all__ = [
    'supabase_client',
    'supabase_admin',
    'SupabaseClient',
]
