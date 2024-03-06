from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Request, status, Query
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
from deplio.models.data.latest.responses import (
    DeplioError,
    generate_responses,
    error_response,
)
from deplio.routers import create_router
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
    summary='Post messages to Deplio Q',
    description='Send messages to Deplio Q to be processed asynchronously.',
    responses=generate_responses(PostQMessagesResponse),
    tags=[Tags.Q],
)
async def create(
    auth: Annotated[APIKeyAuthCredentials, Depends(api_key_auth)],
    supabase_admin: Annotated[SupabaseClient, Depends(supabase_admin)],
    context: Annotated[Context, Depends(context)],
    request: Request,
    message_request: PostQMessagesRequest,
):
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
        print(f'Error inserting into q_request: {e}')
        context.errors.append(DeplioError(message='Failed to insert into q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    if q_requests.data is None:
        print('No q_requests.data')
        context.errors.append(DeplioError(message='Failed to insert into q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
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
        context.errors.append(DeplioError(message='Failed to send messages to queue'))

        try:
            await (
                supabase_admin.table('q_request')
                .update(
                    {
                        'deleted_at': datetime.now(UTC).isoformat(),
                    }
                )
                .in_('id', [q_request.id for q_request in q_requests])
                .execute()
            )
        except Exception as e:
            print(f'Error updating q_request: {e}')
            context.errors.append(DeplioError(message='Failed to update q_request'))

        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            warnings=context.warnings,
            errors=context.errors,
        )

    return PostQMessagesResponse(
        request_ids=[q_request.id for q_request in q_requests],
        messages_delivered=len(sqs_messages),
        warnings=context.warnings,
    )
