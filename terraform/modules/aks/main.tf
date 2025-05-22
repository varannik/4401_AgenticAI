# AKS Module

# Variables
variable "resource_group_name" {
  type        = string
  description = "Resource group name"
}

variable "location" {
  type        = string
  description = "Azure region"
}

variable "cluster_name" {
  type        = string
  description = "AKS cluster name"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes version"
  default     = "1.25.6"
}

variable "node_count" {
  type        = number
  description = "Number of nodes in the default node pool"
  default     = 3
}

variable "vm_size" {
  type        = string
  description = "VM size for nodes"
  default     = "Standard_D2s_v3"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}

# Resources
resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version
  
  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size
    os_disk_size_gb = 50
    type       = "VirtualMachineScaleSets"
    enable_auto_scaling = true
    min_count   = 1
    max_count   = 5
  }
  
  identity {
    type = "SystemAssigned"
  }
  
  role_based_access_control_enabled = true
  
  addon_profile {
    aci_connector_linux {
      enabled = false
    }
    
    azure_policy {
      enabled = true
    }
    
    http_application_routing {
      enabled = true
    }
    
    kube_dashboard {
      enabled = false
    }
    
    oms_agent {
      enabled = true
      log_analytics_workspace_id = azurerm_log_analytics_workspace.aks.id
    }
  }
  
  tags = var.tags
}

resource "azurerm_log_analytics_workspace" "aks" {
  name                = "${var.cluster_name}-workspace"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  
  tags = var.tags
}

# Outputs
output "cluster_id" {
  value = azurerm_kubernetes_cluster.aks.id
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "host" {
  value     = azurerm_kubernetes_cluster.aks.kube_config.0.host
  sensitive = true
}

output "client_certificate" {
  value     = azurerm_kubernetes_cluster.aks.kube_config.0.client_certificate
  sensitive = true
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
} 