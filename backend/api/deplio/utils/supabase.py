from typing import Protocol
from postgrest.base_request_builder import APIResponse
from deplio.command.supabase.error import SupabaseError


class SupabaseQuery[T](Protocol):
    async def execute(self) -> APIResponse[T]:
        ...


async def execute_supabase_query[T](
    query: SupabaseQuery[T],
    table_name: str,
) -> list[T]:
    try:
        response = await query.execute()
    except Exception as e:
        raise SupabaseError(f'Error running query against {table_name}: {e}') from e

    if response.data is None:
        raise SupabaseError(f'Failed to query {table_name}: no data returned')

    return response.data
