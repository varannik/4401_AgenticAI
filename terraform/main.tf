terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "ai-platform-state"
    storage_account_name = "aiplatformtfstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "project" {
  type        = string
  description = "Project name"
  default     = "ai-platform"
}

variable "environment" {
  type        = string
  description = "Environment (dev, test, prod)"
  default     = "dev"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "eastus"
}

# Local variables
locals {
  resource_prefix = "${var.project}-${var.environment}"
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.resource_prefix}-rg"
  location = var.location
  tags     = local.tags
}

# AKS Cluster
module "aks" {
  source = "./modules/aks"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  cluster_name        = "${local.resource_prefix}-aks"
  kubernetes_version  = "1.25.6"
  node_count          = 3
  vm_size             = "Standard_D2s_v3"
  tags                = local.tags
}

# Azure Container Registry
module "acr" {
  source = "./modules/acr"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  acr_name            = replace("${local.resource_prefix}acr", "-", "")
  sku                 = "Standard"
  tags                = local.tags
}

# Azure Cosmos DB (MongoDB API)
module "cosmosdb" {
  source = "./modules/cosmosdb"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  cosmos_account_name = "${local.resource_prefix}-cosmos"
  tags                = local.tags
}

# Azure Redis Cache
module "redis" {
  source = "./modules/redis"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  redis_name          = "${local.resource_prefix}-redis"
  sku_name            = "Standard"
  family              = "C"
  capacity            = 2
  tags                = local.tags
}

# Azure Key Vault
module "keyvault" {
  source = "./modules/keyvault"
  
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  keyvault_name       = "${local.resource_prefix}-kv"
  tags                = local.tags
}

# Outputs
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "cosmosdb_connection_string" {
  value     = module.cosmosdb.connection_string
  sensitive = true
} 