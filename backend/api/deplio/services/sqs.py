from typing import Self
import os
import boto3
from pydantic import BaseModel


class SQSMessage(BaseModel):
    Id: str
    MessageBody: str


class SQS:
    def __init__(self: Self):
        endpoint = os.getenv('DEPLIO_Q_QUEUE_URL', 'http://localhost:4566')
        region = os.getenv('AWS_REGION', 'eu-west-2')

        self.client = boto3.client(
            'sqs',
            endpoint_url=endpoint,
            region_name=region,
        )

    def list_queues(self: Self):
        return self.client.list_queues()

    def send_messages(self: Self, messages: list[SQSMessage], queue_url: str):
        return self.client.send_message_batch(
            QueueUrl=queue_url,
            Entries=[message.model_dump() for message in messages],
        )
