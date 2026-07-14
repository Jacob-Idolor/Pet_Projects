output "message" {
  description = "Confirmation message"
  value       = "Wrote ${var.filename} with Terraform"
}

output "file_path" {
  description = "Absolute path to created file"
  value       = local_file.hello.filename
}
