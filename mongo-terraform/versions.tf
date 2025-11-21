terraform {
  required_version = ">= 1.0"
  
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "1.12.0"
    }
  }

  cloud {
    organization = "Betts"  # ← Replace with your actual org name
    
    workspaces {
      name = "mongodb-management"
    }
  }
}