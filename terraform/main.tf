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

