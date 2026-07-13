resource "local_file" "hello" {
  filename = var.filename
  content  = var.content
}
