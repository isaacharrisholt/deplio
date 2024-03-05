from typing import Annotated

from fastapi import Depends, HTTPException, Request, status, Query
from deplio.auth.dependencies import (
    APIKeyAuthCredentials,
    AuthCredentials,
    any_auth,
    api_key_auth,
)
from deplio.config import settings
from deplio.context import Context, context
from deplio.models.data.latest.db.q import QRequest
from deplio.models.data.latest.endpoints.q import (
    GetQMessagesResponse,
    PostQMessagesRequest,
    PostQMessagesResponse,
    QMessage,
)
from deplio.routers import create_router
from deplio.services.sqs import SQS, SQSMessage
from deplio.services.supabase import SupabaseClient, supabase_admin
from deplio.types.q import QSQSMessage
from deplio.utils.q import get_forward_headers, query_params_to_dict

router = create_router(prefix='/q')


@router.get('')
async def get_q_requests(
    auth: Annotated[AuthCredentials, Depends(any_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
) -> GetQMessagesResponse:
    try:
        response = (
            await supabase_admin.table('q_request')
            .select('*, responses:q_response (*)', count='exact')  # type: ignore
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
    return GetQMessagesResponse(
        requests=response.data,
        count=len(response.data),
        total=response.count,
        page=page,
        page_size=page_size,
        warnings=context.warnings,
    )


@router.post('')
async def post_q_requests(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    request: Request,
    message_request: PostQMessagesRequest,
) -> PostQMessagesResponse:
    messages: list[QMessage]

    if not isinstance(message_request, list):
        messages = [message_request]
    else:
        messages = message_request

    request_headers = get_forward_headers(request.headers) or None

    database_insert = []
    for message in messages:
        database_insert.append(
            {
                'api_key_id': str(auth.api_key.id),
                'team_id': str(auth.team.id),
                'destination': str(message.destination),
                'body': message.body,
                'method': message.method,
                'headers': {**(request_headers or {}), **(message.headers or {})},
                'query_params': query_params_to_dict(
                    message.destination.query_params()
                ),
            }
        )

    try:
        q_requests = (
            await supabase_admin.table('q_request').insert(database_insert).execute()
        )
    except Exception as e:
        print(f'Error inserting q_requests: {e}')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error',
        )

    if not q_requests.data:
        print('No q_requests returned')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error',
        )

    q_requests = [QRequest(**q_request) for q_request in q_requests.data]

    sqs_messages: list[QSQSMessage] = []
    for q_request in q_requests:
        sqs_messages.append(
            QSQSMessage(
                destination=q_request.destination,
                body=q_request.body,
                method=q_request.method,
                headers=q_request.headers,
                request_id=q_request.id,
            )
        )

    sqs = SQS()
    sqs_response = sqs.send_messages(
        [
            SQSMessage(
                Id=str(message.request_id),
                MessageBody=message.model_dump_json(),
            )
            for message in sqs_messages
        ],
        settings.aws_sqs_queue_url,
    )

    if 'Successful' not in sqs_response:
        print(f'Error sending messages to SQS: {sqs_response}')
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Internal server error',
        )

    return PostQMessagesResponse(
        request_ids=[q_request.id for q_request in q_requests],
        messages_delivered=len(sqs_messages),
        warnings=context.warnings,
    )
