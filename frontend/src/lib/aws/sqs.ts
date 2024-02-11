import {
  SQSClient,
  ListQueuesCommand,
  SendMessageBatchCommand,
  type SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs'
import { PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'

function getSQSClient() {
  return new SQSClient({
    region: 'us-east-1',
    endpoint: PUBLIC_DEPLOYMENT_ENV === 'local' ? 'http://localhost:4566' : undefined,
  })
}

export function listQueues() {
  const client = getSQSClient()
  const command = new ListQueuesCommand({})
  return client.send(command)
}

export function sendMessages(
  entries: SendMessageBatchRequestEntry[],
  queueUrl: string,
) {
  const client = getSQSClient()
  console.log(`Sending ${entries.length} messages to queue`, queueUrl)
  const command = new SendMessageBatchCommand({
    Entries: entries,
    QueueUrl: queueUrl,
  })
  return client.send(command)
}
