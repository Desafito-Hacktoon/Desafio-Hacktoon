# ------------------------------
# Outputs
# ------------------------------

output "instance_id" {
  description = "ID da instância EC2 criada"
  value       = aws_instance.BluLabs_server.id
}

output "instance_public_ip" {
  description = "IP público da instância EC2"
  value       = aws_instance.BluLabs_server.public_ip
}

output "instance_public_dns" {
  description = "DNS público da instância EC2"
  value       = aws_instance.BluLabs_server.public_dns
}

output "subnet_id" {
  description = "ID da subnet criada"
  value       = aws_subnet.BluLabs_subnet.id
}

output "security_group_id" {
  description = "ID do Security Group associado"
  value       = aws_security_group.BluLabs_sg.id
}

output "vpc_id" {
  description = "ID da VPC utilizada"
  value       = data.aws_vpc.existing.id
}
