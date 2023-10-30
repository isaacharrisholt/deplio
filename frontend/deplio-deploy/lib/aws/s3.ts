import { Err, Ok, type Result } from '$lib/types/result'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export async function uploadBufferToS3(
  bucketName: string,
  fileName: string,
  buffer: Buffer,
  region = 'us-west-1',
): Promise<Result<string>> {
  const s3Client = new S3Client({ region })

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
  })

  try {
    await s3Client.send(command)
  } catch (err: unknown) {
    if (!(err instanceof Error)) return Err(new Error('Unknown error'))
    return Err(err)
  }
  return Ok(`${bucketName}/${fileName}`)
}

export function getBucketForEnv(env: string) {
  if (env === 'local') {
    env = 'dev'
  }
  return `deplio-${env}-bucket`
}
