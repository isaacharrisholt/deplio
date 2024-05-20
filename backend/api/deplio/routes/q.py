from typing import Annotated

from fastapi import Depends, Query, Request, status
from sqlalchemy import insert

from deplio.auth.dependencies import (
    APIKeyAuthCredentials,
    AuthCredentials,
    any_auth,
    api_key_auth,
)
from deplio.config import settings
from deplio.context import Context, context
from deplio.models.data.head.db.q import QRequest
from deplio.models.data.head.tables.q import q_request_table
from deplio.models.data.head.endpoints.q import (
    GetQMessagesResponse,
    PostQMessagesRequest,
    PostQMessagesResponse,
    QMessage,
)
from deplio.models.data.head.responses import (
    DeplioError,
    error_response,
    generate_responses,
)
from deplio.routers import create_router
from deplio.services.db import DbSessionDependency
from deplio.services.sqs import SQS, SQSMessage
from deplio.services.supabase import SupabaseClient, supabase_admin
from deplio.tags import Tags
from deplio.types.q import QSQSMessage
from deplio.utils.q import get_forward_headers, query_params_to_dict

router = create_router(prefix='/q')


@router.get(
    '',
    summary='List Deplio Q messages',
    description='Get a list of messages that have been sent to Deplio Q and their responses (if any).',
    responses=generate_responses(GetQMessagesResponse),
    tags=[Tags.Q],
    response_description='List of messages and their responses',
    operation_id='q:list',
)
async def get(
    auth: Annotated[AuthCredentials, Depends(any_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
):
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
        context.errors.append(DeplioError(message='Failed to retrieve from q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            errors=context.errors,
            warnings=context.warnings,
        )

    if response.count is None:
        context.errors.append(DeplioError(message='Failed to retrieve from q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            errors=context.errors,
            warnings=context.warnings,
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


@router.post(
    '',
    summary='Send messages to Deplio Q',
    description='Send messages to Deplio Q to be processed asynchronously.',
    responses=generate_responses(PostQMessagesResponse),
    tags=[Tags.Q],
    response_description='List of request IDs and number of messages delivered',
)
async def create(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    session: DbSessionDependency,
    context: Annotated[Context, Depends(context)],
    request: Request,
    messages: PostQMessagesRequest,
):
    messages_list: list[QMessage]

    if not isinstance(messages, list):
        messages_list = [messages]
    else:
        messages_list = messages

    request_headers = get_forward_headers(request.headers) or None

    database_insert = []
    for message in messages_list:
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
                'metadata': message.metadata,
            }
        )

    try:
        response = await session.execute(
            insert(q_request_table).values(database_insert).returning(q_request_table)
        )
        q_requests = [QRequest(**q_request) for q_request in response.mappings()]
    except Exception as e:
        print(f'Error inserting into q_request: {e}')
        context.errors.append(DeplioError(message='Failed to insert into q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

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
    try:
        sqs_response = sqs.send_messages(
            [
                SQSMessage(
                    Id=str(message.request_id),
                    MessageBody=message.model_dump_json(),
                )
                for message in sqs_messages
            ],
            settings.deplio_q_queue_url,
        )
    except Exception as e:
        print(f'Error sending messages to SQS: {e}')
        context.errors.append(DeplioError(message='Failed to send messages to queue'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    if 'Successful' not in sqs_response:
        print(f'Error sending messages to SQS: {sqs_response}')
        context.errors.append(DeplioError(message='Failed to send messages to queue'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    await session.commit()
    return PostQMessagesResponse(
        request_ids=[q_request.id for q_request in q_requests],
        messages_delivered=len(sqs_messages),
        warnings=context.warnings,
    )
