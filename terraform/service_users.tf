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

resource "aws_iam_group_policy_attachment" "service_user_group_ec2_access" {
  group      = aws_iam_group.service_user_group.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
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


