variable "filename" {
  description = "Output file name"
  type        = string
  default     = "hello.txt"
}

variable "content" {
  description = "File content"
  type        = string
  default     = "Hello from Terraform!"
}
