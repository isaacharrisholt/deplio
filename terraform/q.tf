#############
# SQS QUEUE #
#############
variable "q_lambda_timeout" {
  type    = number
  default = 60
}

resource "aws_sqs_queue" "q_queue" {
  name                       = "${terraform.workspace}-deplio-q-queue"
  visibility_timeout_seconds = var.q_lambda_timeout
}

output "q_queue_url" {
  value = aws_sqs_queue.q_queue.url
}

##############
# Q RECEIVER #
##############
resource "null_resource" "q_receiver_binary" {
  triggers = {
    # code_sha1   = sha1(join("", [for f in fileset("../lambda/q_receiver", "./**/*.go") : filesha1("../lambda/q_receiver/${f}")]))
    # binary_sha1 = sha1("../lambda/q_receiver/bootstrap")
    # zip_sha1    = sha1("../lambda/q_receiver/q_receiver.zip")
    # workspace   = terraform.workspace
    always_run = timestamp()
  }
  provisioner "local-exec" {
    # Use x86_64 for local development, arm64 for production
    command = "cd ../lambda/q_receiver && CGO_ENABLED=0 GOOS=linux GOARCH=${terraform.workspace == "local" ? "amd64" : "arm64"} go build -tags lambda.norpc -o bootstrap main.go"
  }
}

data "archive_file" "q_receiver_archive" {
  depends_on  = [null_resource.q_receiver_binary]
  type        = "zip"
  source_file = "../lambda/q_receiver/bootstrap"
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
  name               = "QAssumeLambdaRole${title(terraform.workspace)}"
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
  architectures    = [terraform.workspace == "local" ? "x86_64" : "arm64"]
  filename         = data.archive_file.q_receiver_archive.output_path
  source_code_hash = data.archive_file.q_receiver_archive.output_base64sha256
  timeout          = var.q_lambda_timeout

  runtime = "provided.al2"

  environment {
    variables = {
      "PUBLIC_DEPLOYMENT_ENV" = terraform.workspace
      # Replace localhost with the Docker host IP to allow Localstack to access the host
      "PUBLIC_SUPABASE_URL"               = replace(data.doppler_secrets.globals.map.PUBLIC_SUPABASE_URL, "localhost", "172.17.0.1")
      "PUBLIC_SUPABASE_ANON_KEY"          = data.doppler_secrets.globals.map.PUBLIC_SUPABASE_ANON_KEY
      "PRIVATE_SUPABASE_SERVICE_ROLE_KEY" = data.doppler_secrets.globals.map.PRIVATE_SUPABASE_SERVICE_ROLE_KEY
    }
  }
}

resource "aws_lambda_event_source_mapping" "q_receiver_event_source_mapping" {
  event_source_arn = aws_sqs_queue.q_queue.arn
  function_name    = aws_lambda_function.q_receiver_function.arn
}
