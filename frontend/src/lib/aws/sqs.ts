import { SQSClient, ListQueuesCommand, SendMessageCommand } from '@aws-sdk/client-sqs'
import { VERCEL_ENV } from '$env/static/private'

function getSQSClient() {
  return new SQSClient({
    region: 'us-east-1',
    endpoint: VERCEL_ENV === 'development' ? 'http://localhost:4566' : undefined,
  })
}

export function listQueues() {
  const client = getSQSClient()
  const command = new ListQueuesCommand({})
  return client.send(command)
}

export function sendMessage(message: string, queueUrl: string) {
  const client = getSQSClient()
  console.log('Sending message to queue', queueUrl)
  const command = new SendMessageCommand({
    MessageBody: message,
    QueueUrl: queueUrl,
  })
  return client.send(command)
}
