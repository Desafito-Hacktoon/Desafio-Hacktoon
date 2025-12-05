terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# ------------------------------
# Reutilizar VPC e IGW existentes
# ------------------------------

data "aws_vpc" "existing" {
  id = var.vpc_id
}

data "aws_internet_gateway" "existing" {
  filter {
    name   = "attachment.vpc-id"
    values = [var.vpc_id]
  }
}

# ------------------------------
# Subnet + Roteamento
# ------------------------------

resource "aws_subnet" "BluLabs_subnet" {
  vpc_id                  = var.vpc_id
  cidr_block              = var.subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = var.availability_zone
  tags                    = { Name = "BluLabs-subnet" }
}

resource "aws_route_table" "BluLabs_rt" {
  vpc_id = var.vpc_id
  tags   = { Name = "BluLabs-rt" }
}

resource "aws_route" "BluLabs_route" {
  route_table_id         = aws_route_table.BluLabs_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = data.aws_internet_gateway.existing.id
}

resource "aws_route_table_association" "BluLabs_assoc" {
  subnet_id      = aws_subnet.BluLabs_subnet.id
  route_table_id = aws_route_table.BluLabs_rt.id
}

# ------------------------------
# Segurança
# ------------------------------

resource "aws_key_pair" "main" {
  key_name   = "BluLabs-key"
  public_key = file(var.public_key_path)
}

resource "aws_security_group" "BluLabs_sg" {
  name        = "BluLabs-sg"
  description = "Allow SSH and app ports"
  vpc_id      = var.vpc_id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Postgres
  ingress {
    description = "PostgreSQL"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # PgAdmin
  ingress {
    description = "PgAdmin"
    from_port   = 5050
    to_port     = 5050
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Redis
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }


  # Backend Java
  ingress {
    description = "Backend Java"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend C#
  ingress {
    description = "Backend C#"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend Angular
  ingress {
    description = "Frontend Angular"
    from_port   = 4200
    to_port     = 4200
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1" 
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "null_resource" "flutter_web" {
  provisioner "local-exec" {
    command = "docker-compose -f docker-compose.yml up -d --build"
    working_dir = "${path.module}"
  }
}

# ------------------------------
# EC2 Instance
# ------------------------------
resource "aws_instance" "BluLabs_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.BluLabs_subnet.id
  key_name                    = aws_key_pair.main.key_name
  vpc_security_group_ids      = [aws_security_group.BluLabs_sg.id]
  associate_public_ip_address = true

  user_data = <<-EOF
    #!/bin/bash
    set -e

    echo "🚀 Iniciando setup da VM..."

    # Atualiza pacotes e instala dependências
    apt-get update -y
    apt-get install -y git curl unzip xz-utils zip libglu1-mesa docker.io

    # Instalar Docker
    if ! command -v docker &> /dev/null; then
      curl -fsSL https://get.docker.com -o get-docker.sh
      sh get-docker.sh
      usermod -aG docker ubuntu
    fi

    # Instalar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
      curl -L "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      chmod +x /usr/local/bin/docker-compose
    fi

    # Clonar repositório
    cd /home/ubuntu
    git clone -b develop https://github.com/Desafito-Hacktoon/Desafio-Hackathon.git
    
    chown -R ubuntu:ubuntu /home/ubuntu/Desafio-Hackathon

    # Instalar Flutter SDK
    git clone https://github.com/flutter/flutter.git -b stable /home/ubuntu/flutter
    echo 'export PATH="$PATH:/home/ubuntu/flutter/bin"' >> /etc/profile
    export PATH="$PATH:/home/ubuntu/flutter/bin"

    

    # Marca diretório Flutter como seguro para Git
    git config --global --add safe.directory /home/ubuntu/flutter

    # Corrige permissões
    chown -R ubuntu:ubuntu /home/ubuntu/flutter
    chown -R ubuntu:ubuntu /home/ubuntu/Desafio-Hackathon

    # Build do Flutter Web
    cd /home/ubuntu/Desafio-Hackathon/App-Flutter
    flutter clean
    flutter pub get
    flutter build web

    # Build da imagem Docker
    cd /home/ubuntu/Desafio-Hackathon
    docker build -t flutter-web -f DevopsInfra/Dockerfile .

    # Subir container
    docker run -d -p 4200:80 --name frontend-flutter flutter-web
         
  EOF

    

  # Copia o .env da sua máquina para dentro da EC2
  provisioner "file" {
    source      = "../.env"
    destination = "/home/ubuntu/.env"
  }


  # Executa os comandos do Docker Compose já com o .env presente
  provisioner "remote-exec" {
  inline = [
    "while [ ! -d /home/ubuntu/Desafio-Hackathon/DevopsInfra ]; do sleep 2; done",
    "if [ -f /home/ubuntu/.env ]; then sudo mv /home/ubuntu/.env /home/ubuntu/Desafio-Hackathon/DevopsInfra/.env; else echo 'Arquivo .env não encontrado'; fi",
    "cd /home/ubuntu/Desafio-Hackathon/DevopsInfra",
    "sudo docker-compose pull",
    "sudo docker-compose up --build -d"
  ]
}

  # Conexão SSH para os provisioners
  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("~/.ssh/id_rsa")
    host        = self.public_ip
  }


  tags = {
    Name        = "BluLabs-server"
    Environment = "dev"
    Owner       = "Desafio-Hackthon"
  }
}