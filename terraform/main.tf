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
    doppler = {
      source = "dopplerhq/doppler"
    }
  }

  required_version = "1.7.4"

  backend "s3" {
    bucket               = "deplio-terraform-backend"
    key                  = "terraform.tfstate"
    region               = "eu-west-2"
    workspace_key_prefix = "workspaces"
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

provider "aws" {
  region = var.aws_region
}

