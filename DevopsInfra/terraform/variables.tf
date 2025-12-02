# ------------------------------
# Variáveis principais
# ------------------------------

variable "region" {
  description = "Região da AWS onde os recursos serão criados"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "AMI utilizada para a instância EC2 (ex: Ubuntu)"
  type        = string
  default     = "ami-0ecb62995f68bb549"
}

variable "instance_type" {
  description = "Tipo da instância EC2"
  type        = string
  default     = "t3.medium"
}

variable "vpc_id" {
  description = "ID da VPC existente"
  type        = string
  default     = "vpc-06786ee7f7a163059"
}

variable "subnet_cidr" {
  description = "CIDR block da subnet pública"
  type        = string
  default     = "172.30.50.0/24"
}

variable "availability_zone" {
  description = "Zona de disponibilidade da subnet"
  type        = string
  default     = "us-east-1a"
}

variable "public_key_path" {
  description = "Caminho para a chave pública SSH"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
