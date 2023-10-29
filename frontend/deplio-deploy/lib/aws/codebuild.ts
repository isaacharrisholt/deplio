import { Err, Ok, type Result } from '$lib/types/result'
import {
  CodeBuildClient,
  CreateProjectCommand,
  StartBuildCommand,
} from '@aws-sdk/client-codebuild'
import { getBucketForEnv } from './s3'
import { PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'

function createCodeBuildClient(region: string) {
  return new CodeBuildClient({
    region,
  })
}

export async function createS3BuildProject(
  projectName: string,
  location: string,
  imageRepoName: string,
  imageTag: string,
  region = 'us-west-1',
): Promise<Result<null>> {
  const codeBuildClient = createCodeBuildClient(region)
  console.log(`Creating project ${projectName}`)

  const createProjectCommand = new CreateProjectCommand({
    name: projectName,
    source: {
      type: 'S3',
      location,
      buildspec: 'buildspec.yml',
    },
    artifacts: {
      type: 'NO_ARTIFACTS',
    },
    environment: {
      type: 'LINUX_CONTAINER',
      image: 'aws/codebuild/standard:5.0',
      computeType: 'BUILD_GENERAL1_SMALL',
      privilegedMode: true,
      environmentVariables: [
        {
          name: 'AWS_ACCOUNT_ID',
          value: '263093873664',
        },
        {
          name: 'AWS_DEFAULT_REGION',
          value: region,
        },
        {
          name: 'IMAGE_REPO_NAME',
          value: imageRepoName,
        },
        {
          name: 'IMAGE_TAG',
          value: imageTag,
        },
      ],
    },
    serviceRole:
      'arn:aws:iam::263093873664:role/service-role/deplio-dev-codebuild-service-role',
    logsConfig: {
      s3Logs: {
        status: 'ENABLED',
        encryptionDisabled: true,
        location: `${getBucketForEnv(PUBLIC_DEPLOYMENT_ENV)}/logs/${projectName}`,
      },
      cloudWatchLogs: {
        status: 'DISABLED',
      },
    },
  })

  try {
    await codeBuildClient.send(createProjectCommand)
  } catch (err: unknown) {
    if (!(err instanceof Error)) return Err(new Error('Unknown error'))
    return Err(err)
  }

  console.log(`Created project ${projectName}`)
  return Ok(null)
}

export async function startBuild(
  projectName: string,
  region = 'us-west-1',
): Promise<Result<null>> {
  const codeBuildClient = createCodeBuildClient(region)
  const startBuildCommand = new StartBuildCommand({
    projectName,
  })

  try {
    await codeBuildClient.send(startBuildCommand)
  } catch (err: unknown) {
    if (!(err instanceof Error)) return Err(new Error('Unknown error'))
    return Err(err)
  }
  return Ok(null)
}
