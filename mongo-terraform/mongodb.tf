# This describes your EXISTING MongoDB cluster
resource "mongodbatlas_cluster" "main" {
  project_id = var.mongodb_project_id
  name       = "Cluster0"
  
  # These match your GCP free tier cluster in Sao Paulo
  provider_name               = "GCP"
  provider_region_name        = "SOUTH_AMERICA_EAST_1"
  provider_instance_size_name = "M0"
}