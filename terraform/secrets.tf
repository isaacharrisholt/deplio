#####################################
# Secrets are managed using Doppler #
#####################################
variable "doppler_token" {
  type        = string
  description = "Doppler access token"
}

provider "doppler" {
  doppler_token = var.doppler_token
  alias         = "globals"
}

data "doppler_secrets" "globals" {
  provider = doppler.globals
  config   = terraform.workspace
}

###########
# OUTPUTS #
###########
resource "doppler_secret" "deplio_q_queue_url" {
  project = "globals"
  config  = terraform.workspace
  name    = "DEPLIO_Q_QUEUE_URL"
  value   = aws_sqs_queue.q_queue.url
}
