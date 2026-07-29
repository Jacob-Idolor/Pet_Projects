# GitHub Actions OIDC → IAM role for StocksWatch deploys (no long-lived access keys).
# Apply with an admin/AWS profile that can manage IAM (not the narrowed deploy-policy user).
#
#   enable_github_oidc = true
#   github_repository   = "Jacob-Idolor/Pet_Projects"
#
# Then set GitHub secret AWS_ROLE_ARN to the output github_actions_role_arn
# and variable STOCKS_RADAR_USE_OIDC=true

variable "enable_github_oidc" {
  description = "Create GitHub OIDC provider + deploy role for Actions (preferred over access keys)"
  type        = bool
  default     = false
}

variable "create_github_oidc_provider" {
  description = "Create the account-level GitHub OIDC provider. Set false and import/use existing if another stack already created token.actions.githubusercontent.com"
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "GitHub repo (OWNER/NAME) allowed to assume the deploy role via OIDC"
  type        = string
  default     = "Jacob-Idolor/Pet_Projects"
}

variable "github_oidc_subjects" {
  description = <<-EOT
    Additional sub claim patterns (beyond refs/heads/main and environment:stockwatch).
    Example: ["repo:ORG/REPO:ref:refs/heads/release/*"]
  EOT
  type        = list(string)
  default     = []
}

data "tls_certificate" "github_actions" {
  count = var.enable_github_oidc && var.create_github_oidc_provider ? 1 : 0
  url   = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.enable_github_oidc && var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions[0].certificates[0].sha1_fingerprint]

  tags = {
    Project = var.project_name
    Purpose = "github-actions-oidc"
  }
}

data "aws_iam_openid_connect_provider" "github_existing" {
  count = var.enable_github_oidc && !var.create_github_oidc_provider ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_provider_arn = var.enable_github_oidc ? (
    var.create_github_oidc_provider
    ? aws_iam_openid_connect_provider.github[0].arn
    : data.aws_iam_openid_connect_provider.github_existing[0].arn
  ) : null

  github_oidc_subs = var.enable_github_oidc ? concat(
    [
      "repo:${var.github_repository}:ref:refs/heads/main",
      "repo:${var.github_repository}:environment:stockwatch",
    ],
    var.github_oidc_subjects
  ) : []
}

data "aws_iam_policy_document" "github_assume" {
  count = var.enable_github_oidc ? 1 : 0

  statement {
    sid     = "GitHubActionsOidc"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.github_oidc_subs
    }
  }
}

resource "aws_iam_role" "github_actions" {
  count = var.enable_github_oidc ? 1 : 0

  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json

  tags = {
    Project = var.project_name
    Purpose = "github-actions-deploy"
  }
}

data "aws_iam_policy_document" "github_actions_deploy" {
  count = var.enable_github_oidc ? 1 : 0

  statement {
    sid    = "S3ListBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid    = "S3ObjectRW"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts",
    ]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "CloudFrontInvalidate"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation", "cloudfront:ListInvalidations"]
    resources = [aws_cloudfront_distribution.site.arn]
  }

  statement {
    sid       = "SnsPublishRadar"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = ["arn:aws:sns:*:${data.aws_caller_identity.current.account_id}:stocks-radar-*"]
  }

  statement {
    sid    = "CloudWatchReadForDigest"
    effect = "Allow"
    actions = [
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:GetMetricData",
      "cloudwatch:ListMetrics",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "WhoAmI"
    effect    = "Allow"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  count = var.enable_github_oidc ? 1 : 0

  name   = "${var.project_name}-github-actions-deploy"
  role   = aws_iam_role.github_actions[0].id
  policy = data.aws_iam_policy_document.github_actions_deploy[0].json
}

output "github_actions_role_arn" {
  description = "Set GitHub secret AWS_ROLE_ARN and STOCKS_RADAR_USE_OIDC=true when enable_github_oidc is on"
  value       = try(aws_iam_role.github_actions[0].arn, null)
}

output "github_oidc_setup_hint" {
  description = "How to switch Actions from access keys to OIDC"
  value = var.enable_github_oidc ? join("\n", [
    "1) terraform apply with enable_github_oidc=true",
    "2) gh secret set AWS_ROLE_ARN --body \"$(terraform output -raw github_actions_role_arn)\"",
    "3) gh variable set STOCKS_RADAR_USE_OIDC --body true",
    "4) Optionally delete AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY after a successful OIDC deploy",
  ]) : "Set enable_github_oidc=true to create the GitHub Actions deploy role"
}
