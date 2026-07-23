# Static site stack ONLY — S3 + CloudFront (+ optional Route53/ACM/budget).
# Safeguard checks: safeguards.tf | Run: terraform plan before every apply.

resource "aws_s3_bucket" "site" {
  bucket = var.site_bucket_name

  lifecycle {
    prevent_destroy = false
    # AWS provider v4+ moved these to separate resources — ignore legacy inline
    # attributes so Terraform does not try to replace the bucket on migration.
    ignore_changes = [
      cors_rule,
      grant,
      lifecycle_rule,
      logging,
      object_lock_configuration,
      replication_configuration,
      server_side_encryption_configuration,
      versioning,
      website,
    ]
  }
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  depends_on = [aws_s3_bucket_ownership_controls.site]
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Disabled"
  }

  depends_on = [aws_s3_bucket_ownership_controls.site]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  # Apex → optional www SAN; explicit domain_aliases always included.
  inferred_www = (
    var.enable_custom_domain &&
    var.include_www_alias &&
    var.domain_name != "" &&
    !startswith(var.domain_name, "www.")
  ) ? ["www.${var.domain_name}"] : []

  cloudfront_aliases = var.enable_custom_domain ? distinct(concat(
    [var.domain_name],
    local.inferred_www,
    var.domain_aliases,
  )) : []

  # AWS managed response headers policy — SecurityHeadersPolicy
  security_headers_policy_id  = "67f7725c-6f97-4210-82d8-225cc5080799"
  caching_disabled_policy_id  = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  caching_optimized_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} static learning site (no compute)"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  http_version        = "http2and3"
  wait_for_deployment = true

  # No WAF (paid), no CloudFront Functions (denied in IAM), no Lambda@Edge
  web_acl_id = null

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.site.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # Hashed Astro assets — high cache hit ratio (cost ↓, scale ↑). Object headers set on sync.
  ordered_cache_behavior {
    path_pattern               = "/_astro/*"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_optimized_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  # Quotes must bypass long cache so price/signal polls see fresh deploys.
  # Cost: negligible — more origin GETs only when visitors poll quotes.json.
  ordered_cache_behavior {
    path_pattern               = "/quotes.json"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_disabled_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  ordered_cache_behavior {
    path_pattern               = "/build-meta.json"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_disabled_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  ordered_cache_behavior {
    path_pattern               = "/health.json"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_disabled_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  ordered_cache_behavior {
    path_pattern               = "/settings.json"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_disabled_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = local.caching_optimized_policy_id
    response_headers_policy_id = var.enable_security_headers ? local.security_headers_policy_id : null
  }

  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 60
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !var.enable_custom_domain
    acm_certificate_arn            = var.enable_custom_domain ? local.custom_domain_cert_arn : null
    ssl_support_method             = var.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = var.enable_custom_domain ? "TLSv1.2_2021" : null
  }

  aliases = local.cloudfront_aliases

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.site.arn
          }
        }
      },
      {
        # Cooldown / ops state must never be world-readable via CloudFront
        Sid       = "DenyCloudFrontPrivatePrefix"
        Effect    = "Deny"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site.arn}/_private/*"
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.site.arn,
          "${aws_s3_bucket.site.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.site]
}

# Custom domain — ACM in us-east-1 (required by CloudFront).
# Cheapest DNS: dns_management = "external" (Cloudflare Free). Skip Route53 (~$0.50/mo).
resource "aws_acm_certificate" "site" {
  count = var.enable_custom_domain ? 1 : 0

  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    for h in local.cloudfront_aliases : h if h != var.domain_name
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.enable_custom_domain && var.dns_management == "route53" && var.route53_zone_id != "" ? {
    for dvo in aws_acm_certificate.site[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "site_route53" {
  count = var.enable_custom_domain && var.dns_management == "route53" ? 1 : 0

  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "45m"
  }
}

# External DNS (Cloudflare): add terraform output acm_dns_validation_records, then this waits until ACM is Issued.
resource "aws_acm_certificate_validation" "site_external" {
  count = var.enable_custom_domain && var.dns_management == "external" ? 1 : 0

  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.site[0].arn

  timeouts {
    create = "45m"
  }
}

locals {
  custom_domain_cert_arn = try(
    aws_acm_certificate_validation.site_route53[0].certificate_arn,
    aws_acm_certificate_validation.site_external[0].certificate_arn,
    null
  )
}

resource "aws_route53_record" "site" {
  count = var.enable_custom_domain && var.dns_management == "route53" && var.route53_zone_id != "" ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# Cost guardrail for THIS stack.
# Expected friend-scale spend ≈ $0.50–3/mo (S3 + CloudFront PriceClass_100 + SNS).
# Default limit $3 with 50% / 80% / 100% alerts — viable only when scoped by Project tag
# (otherwise other account spend trips a $3 budget immediately).
resource "aws_budgets_budget" "monthly" {
  count = var.enable_budget && var.budget_alert_email != "" ? 1 : 0

  name         = "${var.project_name}-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Track usage for this product, not credits/refunds noise.
  cost_types {
    include_credit             = false
    include_discount           = true
    include_other_subscription = true
    include_recurring          = true
    include_refund             = false
    include_subscription       = true
    include_support            = false
    include_tax                = true
    include_upfront            = true
    use_amortized              = false
    use_blended                = false
  }

  dynamic "cost_filter" {
    for_each = var.budget_scope_to_project_tag ? [1] : []
    content {
      # Requires Billing → Cost allocation tags → activate "Project" (user-defined).
      # Format: user:<TagKey>$<TagValue>
      name   = "TagKeyValue"
      values = [format("user:Project$%s", var.project_name)]
    }
  }

  # ~$1.50 at default $3 — early signal that traffic or misconfig is climbing
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # Forecast will exceed limit this month — act before the bill lands
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # Soft overspend while month is still open
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  # Hard: at/over the configured monthly limit
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }

  lifecycle {
    prevent_destroy = false
  }
}
