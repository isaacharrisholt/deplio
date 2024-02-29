from typing import Annotated

from fastapi import Depends, HTTPException, status, Query
from deplio.auth.dependencies import AuthCredentials, auth
from deplio.models.data.latest.endpoints.q import GetQRequestsResponse
from deplio.routers import create_router
from deplio.services.supabase import SupabaseClient, supabase_admin

router = create_router(prefix='/q')


@router.get('')
async def get_q_requests(
    auth: Annotated[AuthCredentials, Depends(auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> GetQRequestsResponse:
    try:
        response = (
            await supabase_admin.table('q_request')
            .select('*, q_response(*)', count='exact')
            .eq('team_id', auth.team.id)
            .order('created_at', desc=True)
            .order('created_at', foreign_table='q_response', desc=True)
            .range((page - 1) * page_size, page * page_size)
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error',
        )

    if response.count is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error',
        )

    print('response:', response.data)
    return GetQRequestsResponse(
        q_requests=response.data,
        count=len(response.data),
        total=response.count,
        page=page,
        page_size=page_size,
    )
