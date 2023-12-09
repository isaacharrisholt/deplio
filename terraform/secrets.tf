# Supabase URL
data "aws_secretsmanager_secret" "supabase_url" {
    name = "${terraform.workspace}/supabase-url"
}

data "aws_secretsmanager_secret_version" "supabase_url" {
    secret_id = data.aws_secretsmanager_secret.supabase_url.id
}

# Supabase anon key
data "aws_secretsmanager_secret" "supabase_anon_key" {
    name = "${terraform.workspace}/supabase-anon-key"
}

data "aws_secretsmanager_secret_version" "supabase_anon_key" {
    secret_id = data.aws_secretsmanager_secret.supabase_anon_key.id
}

# Supabase service role key
data "aws_secretsmanager_secret" "supabase_service_role_key" {
    name = "${terraform.workspace}/supabase-service-role-key"
}

data "aws_secretsmanager_secret_version" "supabase_service_role_key" {
    secret_id = data.aws_secretsmanager_secret.supabase_service_role_key.id
}