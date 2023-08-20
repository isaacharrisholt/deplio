import { downloadRepoZip } from '$lib/github.server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
    CodeBuildClient,
    CreateProjectCommand,
    StartBuildCommand,
} from '@aws-sdk/client-codebuild'
import { json, type RequestHandler } from '@sveltejs/kit'
import AdmZip from 'adm-zip'
import type { Config } from '@sveltejs/adapter-vercel'
import { uploadBufferToS3 } from '$lib/aws/s3'
import { createS3BuildProject, startBuild } from '$lib/aws/codebuild'

export const config: Config = {
    runtime: 'nodejs18.x',
}

export const POST: RequestHandler = async ({ request }) => {
    const { body } = request
    console.log(body)
    const repo = await downloadRepoZip(
        40654979,
        'isaacharrisholt/advent-of-code',
        'main',
    )
    if (repo.isErr()) {
        console.log(`Error downloading repo: ${repo.err().message}`)
    }
    const buffer = repo.unwrap()

    const zip = new AdmZip(Buffer.from(buffer))
    const zipEntries = zip.getEntries()

    const dirName = zipEntries[0].entryName.split('/')[0]

    zipEntries.forEach((entry) => {
        entry.entryName = entry.entryName.replace(`${dirName}/`, '')
    })

    const dockerfile = `
FROM golang:1.12-alpine AS build
#Install git
RUN apk add --no-cache git
#Get the hello world package from a GitHub repository
RUN go get github.com/golang/example/hello
WORKDIR /go/src/github.com/golang/example/hello
# Build the project and send the output to /bin/HelloWorld 
RUN go build -o /bin/HelloWorld

FROM golang:1.12-alpine
#Copy the build's output binary from the previous build container
COPY --from=build /bin/HelloWorld /bin/HelloWorld
ENTRYPOINT ["/bin/HelloWorld"]FROM 
    `.trim()

    const buildspec = `
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...          
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG      
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      `.trim()

    zip.addFile('Dockerfile', Buffer.from(dockerfile))
    zip.addFile('buildspec.yml', Buffer.from(buildspec))

    const uploadResult = await uploadBufferToS3(
        'deplio-dev-bucket',
        'test.zip',
        zip.toBuffer(),
    )
    if (uploadResult.isErr()) {
        console.log(`Error uploading zip to S3: ${uploadResult.err().message}`)
        return json({ message: uploadResult.err().message }, { status: 500 })
    }
    const fileName = uploadResult.unwrap()

    const projectName = `test-${Date.now()}`
    const createProjectResult = await createS3BuildProject(
        projectName,
        fileName,
        'deplio-dev',
        'latest',
    )
    if (createProjectResult.isErr()) {
        console.log(
            `Error creating CodeBuild project: ${createProjectResult.err().message}`,
        )
        return json({ message: createProjectResult.err().message }, { status: 500 })
    }

    const startBuildResult = await startBuild(projectName)
    if (startBuildResult.isErr()) {
        console.log(
            `Error starting CodeBuild project: ${startBuildResult.err().message}`,
        )
        return json({ message: startBuildResult.err().message }, { status: 500 })
    }

    return json({ message: 'success' })
}
