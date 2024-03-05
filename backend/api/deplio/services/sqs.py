from typing import Self
import os
import boto3
from pydantic import BaseModel

from deplio.types.enums import Environment


class SQSMessage(BaseModel):
    Id: str
    MessageBody: str


class SQS:
    def __init__(self: Self):
        env = os.getenv('PUBLIC_DEPLOYMENT_ENV', Environment.LOCAL)
        # TODO: Prod endpoint
        endpoint = 'http://localhost:4566' if env == Environment.LOCAL else None
        if endpoint is None:
            raise NotImplementedError('Only local environment is supported by SQS')

        self.client = boto3.client(
            'sqs',
            endpoint_url=endpoint,
            region_name='us-east-1',
        )

    def list_queues(self: Self):
        return self.client.list_queues()

    def send_messages(self: Self, messages: list[SQSMessage], queue_url: str):
        return self.client.send_message_batch(
            QueueUrl=queue_url,
            Entries=[message.model_dump() for message in messages],
        )
