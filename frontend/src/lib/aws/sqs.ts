import { SQSClient, ListQueuesCommand, SendMessageCommand } from '@aws-sdk/client-sqs'

export function listQueues() {
  const client = new SQSClient({ region: 'us-east-1' })
  const command = new ListQueuesCommand({})
  return client.send(command)
}

export function sendMessage(message: string, queueUrl: string) {
    const client = new SQSClient({ region: 'us-east-1' })
    const command = new SendMessageCommand({
        MessageBody: message,
        QueueUrl: queueUrl,
    })
    return client.send(command)
}
