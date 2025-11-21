variable "mongodb_public_key" {
  description = "MongoDB Atlas Public API Key"
  type        = string
  sensitive   = true
}

variable "mongodb_private_key" {
  description = "MongoDB Atlas Private API Key" 
  type        = string
  sensitive   = true
}

variable "mongodb_project_id" {
  description = "MongoDB Atlas Project ID"
  type        = string
}