from typing import Annotated

from fastapi import Depends, Query, Request, status
from pydantic_core import Url
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from deplio.auth.dependencies import (
    APIKeyAuthCredentials,
    AuthCredentials,
    any_auth,
    api_key_auth,
)
from deplio.config import settings
from deplio.context import Context, context
from deplio.models.data.head.endpoints.q import QRequestWithResponses
from deplio.models.data.head.db.q import DBQRequest
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
from deplio.services.db import db_session
from deplio.services.sqs import SQS, SQSMessage
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
    session: Annotated[AsyncSession, Depends(db_session)],
    context: Annotated[Context, Depends(context)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 25,
):
    try:
        result = await session.execute(
            select(DBQRequest, func.count(DBQRequest.id).over().label('total'))
            .outerjoin(DBQRequest.responses)
            .options(selectinload(DBQRequest.responses))
            .where(DBQRequest.team_id == auth.team.id)
            .order_by(DBQRequest.created_at.desc())
            .limit(page_size)
            .offset((page - 1) * page_size)
        )
        q_requests_with_total = result.tuples().all()
    except Exception as e:
        print(f'Error retrieving from q_request: {e}')
        context.errors.append(DeplioError(message='Failed to retrieve from q_request'))
        return error_response(
            message='Internal server error',
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            errors=context.errors,
            warnings=context.warnings,
        )

    print(q_requests_with_total)
    data = [
        QRequestWithResponses.model_validate(request)
        for request, _ in q_requests_with_total
    ]

    # If we have no data, run another query to get the total count
    # This isn't a problem as it'll only occur if there are no messages
    # or if the page number is too high
    if data:
        count = q_requests_with_total[0][1]
    else:
        try:
            result = await session.execute(
                select(func.count(DBQRequest.id)).where(
                    DBQRequest.team_id == auth.team.id
                )
            )
            count = result.scalar() or 0
        except Exception as e:
            print(f'Error retrieving from q_request: {e}')
            context.errors.append(
                DeplioError(message='Failed to retrieve from q_request')
            )
            return error_response(
                message='Internal server error',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                errors=context.errors,
                warnings=context.warnings,
            )

    return GetQMessagesResponse(
        requests=data,
        count=len(data),
        total=count,
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
    session: Annotated[AsyncSession, Depends(db_session)],
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

    q_requests: list[DBQRequest] = []
    for message in messages_list:
        req = DBQRequest(
            api_key_id=auth.api_key.id,
            team_id=auth.team.id,
            destination=str(message.destination),
            body=message.body,
            method=message.method.value,
            headers={**(request_headers or {}), **(message.headers or {})},
            query_params=query_params_to_dict(message.destination.query_params()),
            metadata=message.metadata,
        )
        q_requests.append(req)
        session.add(req)

    try:
        await session.flush()
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
                destination=Url(q_request.destination),
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
        settings.deplio_q_queue_url,
    )

    if 'Successful' not in sqs_response:
        print(f'Error sending messages to SQS: {sqs_response}')
        context.errors.append(DeplioError(message='Failed to send messages to queue'))

        try:
            await session.rollback()
        except Exception as e:
            print(f'Error rolling back session: {e}')
            context.errors.append(DeplioError(message='Failed to roll back session'))

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
