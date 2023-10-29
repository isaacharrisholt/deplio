terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
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
