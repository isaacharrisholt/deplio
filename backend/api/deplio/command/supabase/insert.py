from typing import Any, Optional
from dataclasses import dataclass
from datetime import UTC, datetime

from postgrest._async.request_builder import AsyncFilterRequestBuilder
from deplio.command.supabase.error import SupabaseError
from deplio.command.supabase.execute import execute_supabase_query
from deplio.services.supabase import SupabaseClient


@dataclass
class SupabaseInsertSingle:
    supabase: SupabaseClient
    table: str
    data: dict[str, Any]
    primary_key: str | list[str] = 'id'
    response_data: Optional[dict[str, Any]] = None

    def _add_query_filter[T](self, query: AsyncFilterRequestBuilder[T]):
        if self.response_data is None:
            raise SupabaseError('Cannot add query filter without response data')

        if isinstance(self.primary_key, str):
            query = query.eq(self.primary_key, self.response_data[self.primary_key])
        else:
            for key in self.primary_key:
                query = query.eq(key, self.response_data[key])

        return query

    async def execute(self) -> Any:
        response = await execute_supabase_query(
            self.supabase.table(self.table).insert(self.data),
            self.table,
        )

        # Store the response data for access in undo/redo
        self.response_data = response[0]
        return self.response_data

    async def undo(self) -> Any:
        if self.response_data is None:
            return

        # Build query to delete the data from the specified table,
        # using the primary key(s) to identify the row
        query = self.supabase.table(self.table).update(
            {'deleted_at': datetime.now(UTC).isoformat()}
        )
        query = self._add_query_filter(query)

        response = await execute_supabase_query(query, self.table)

        return response[0]

    async def redo(self) -> Any:
        if self.response_data is None:
            return

        # Build query to delete the data from the specified table,
        # using the primary key(s) to identify the row
        query = self.supabase.table(self.table).update({'deleted_at': None})
        query = self._add_query_filter(query)

        response = await execute_supabase_query(query, self.table)

        return response[0]
