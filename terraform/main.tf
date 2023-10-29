terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
    archive = {
      source = "hashicorp/archive"
    }
    null = {
      source = "hashicorp/null"
    }
  }

  required_version = ">= 1.2.0"

  backend "s3" {
    bucket               = "deplio-terraform"
    key                  = "terraform.tfstate"
    region               = "us-east-1"
    workspace_key_prefix = "workspaces"
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

provider "aws" {
  region = var.aws_region
}

#########
# USERS #
#########
resource "aws_iam_group" "service_user_group" {
  name = "${terraform.workspace}-deplio-service-user-group"
}

resource "aws_iam_user" "service_user" {
  name = "${terraform.workspace}-deplio-service-user"
}

resource "aws_iam_group_policy_attachment" "service_user_group_s3_access" {
  group      = aws_iam_group.service_user_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_group_policy_attachment" "service_user_group_sqs_access" {
  group      = aws_iam_group.service_user_group.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_user_group_membership" "service_user_group_membership" {
  user   = aws_iam_user.service_user.name
  groups = [aws_iam_group.service_user_group.name]
}

resource "aws_iam_access_key" "service_user_access_key" {
  user = aws_iam_user.service_user.name
}

output "aws_access_key_id" {
  value = aws_iam_access_key.service_user_access_key.id
}

output "aws_secret_access_key" {
  value     = aws_iam_access_key.service_user_access_key.secret
  sensitive = true
}

#############
# SQS QUEUE #
#############
resource "aws_sqs_queue" "q_queue" {
  name = "${terraform.workspace}-deplio-q-queue"
}

output "q_queue_url" {
  value = aws_sqs_queue.q_queue.url
}

##############
# Q RECEIVER #
##############
resource "null_resource" "q_receiver_binary" {
  triggers = {
    code_sha1 = "${sha1(join("", [for f in fileset("../lambda/q_receiver", "./**/*.go"): filesha1("../lambda/q_receiver/${f}")]))}"
  }
  provisioner "local-exec" {
    command = "cd ../lambda/q_receiver && GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go"
  }
}

data "archive_file" "q_receiver_archive" {
  depends_on  = [null_resource.q_receiver_binary]
  type        = "zip"
  source_file  = "../lambda/q_receiver/bootstrap"
  output_path = "../lambda/q_receiver/q_receiver.zip"
}

data "aws_iam_policy_document" "q_assume_lambda_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "q_lambda_role" {
  name               = "QAssumeLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.q_assume_lambda_role.json
}

resource "aws_iam_role_policy_attachment" "q_lambda_role_sqs_access" {
  role       = aws_iam_role.q_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSQSFullAccess"
}

resource "aws_iam_role_policy_attachment" "q_lambda_role_lambda_access" {
  role       = aws_iam_role.q_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "q_receiver_function" {
  function_name    = "${terraform.workspace}-deplio-q-receiver"
  role             = aws_iam_role.q_lambda_role.arn
  handler          = "q_receiver"
  architectures    = ["arm64"]
  filename         = data.archive_file.q_receiver_archive.output_path
  source_code_hash = data.archive_file.q_receiver_archive.output_base64sha256

  runtime = "provided.al2"
}

resource "aws_lambda_event_source_mapping" "q_receiver_event_source_mapping" {
  event_source_arn = aws_sqs_queue.q_queue.arn
  function_name    = aws_lambda_function.q_receiver_function.arn
}
