# MapBlu - Mapa de Calor de Problemas da Cidade

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.8-brightgreen.svg)
![Angular](https://img.shields.io/badge/Angular-20-red.svg)
![Flutter](https://img.shields.io/badge/Flutter-3.8.1-blue.svg)

**Sistema de visualização e análise estratégica de problemas urbanos para tomada de decisão na gestão pública**

[Funcionalidades](#funcionalidades) • [Arquitetura](#arquitetura) • [Instalação](#instalação) • [Documentação](#documentação)

</div>

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Problema](#problema)
- [Solução](#solução)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API](#api)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o Projeto

O **MapBlu** é uma solução desenvolvida para o **Desafio 7 do Hackathon** proposto pela **SEDEAD (Secretaria Municipal de Administração da Prefeitura de Blumenau)**. O sistema oferece uma plataforma completa para visualização, análise e priorização de problemas urbanos através de um mapa de calor interativo, permitindo que gestores públicos identifiquem rapidamente áreas críticas e tomem decisões estratégicas baseadas em dados.

### Proponente

**SEDEAD** - Secretaria Municipal de Administração da Prefeitura de Blumenau

---

## Problema

A Prefeitura de Blumenau recebe solicitações de diversas áreas (iluminação pública, buracos, saúde, transporte, limpeza, entre outros) que vêm de diferentes secretarias e canais, dificultando a análise unificada e a tomada de decisão estratégica.

### Desafios Identificados

- **Dificuldade para identificar os bairros mais críticos** - Ausência de visão consolidada dos problemas
- **Ausência de visão consolidada entre secretarias** - Dados fragmentados em múltiplos sistemas
- **Demora na priorização de recursos** - Processo manual e demorado de análise
- **Falta de indicadores visuais** - Ausência de ferramentas visuais que apoiem decisões
- **Menor precisão na tomada de decisões estratégicas** - Decisões baseadas em percepção, não em dados

---

## Solução

O **MapBlu** resolve esses desafios através de:

### Objetivos do MVP

- **Organizar dados de solicitações** - Consolidação de dados de múltiplas secretarias em uma única plataforma
- **Visualizar áreas com maior concentração de problemas** - Mapa de calor interativo com identificação visual de zonas críticas
- **Filtrar por tipo de demanda** - Filtros avançados por categoria de problema (buracos, iluminação, saúde, etc.)
- **Gerar visão estratégica para tomada de decisão** - Dashboards analíticos com métricas e indicadores
- **Apoiar a gestão na priorização de recursos** - Sistema de classificação de gravidade (1-10) com suporte de IA

### Resultado Esperado

Um **protótipo visual, simples e intuitivo**, que apresente um mapa de calor consolidado com os principais problemas da cidade, permitindo identificar rapidamente regiões prioritárias para alocação de recursos.

---

## Funcionalidades

### Aplicativo Mobile (Flutter)

Desenvolvido para **executivos** (Prefeito, Secretários) com foco em visualização rápida e tomada de decisão:

- **Mapa de Calor Interativo**
  - Visualização em tempo real de zonas críticas
  - Polígonos coloridos por nível de severidade
  - Zoom e navegação intuitiva

- **Sistema de Cores por Severidade**
  - 🔴 **Vermelho (Crítico)**: Requer ação imediata
  - 🟠 **Laranja (Alerta)**: Atenção necessária
  - 🟡 **Amarelo (Moderado)**: Monitoramento ativo
  - 🟢 **Verde (Estável)**: Situação controlada

- **Filtros por Categoria**
  - Todos os problemas
  - Alagamento
  - Buracos
  - Iluminação
  - Limpeza
  - Saúde
  - Segurança
  - Trânsito

- **Dashboard Executivo**
  - Estatísticas em tempo real
  - Total de problemas
  - Zonas críticas identificadas
  - Contadores por severidade

- **Detalhes por Zona**
  - Informações completas ao tocar no mapa
  - Quantidade de problemas por zona
  - Tipo de problemas predominantes
  - Nível de severidade

- **Sistema de Contato**
  - Comunicação direta com órgãos responsáveis
  - Lista completa de entidades públicas
  - Informações de contato (SAMAE, SEMOB, CELESC, etc.)

- **Estatísticas Detalhadas**
  - Gráficos e métricas avançadas
  - Análise por período
  - Tendências e evolução

### Aplicação Web (Angular)

Desenvolvida para **técnicos e analistas** da SEDEAD com funcionalidades avançadas:

- **Mapa Interativo com Leaflet**
  - Visualização detalhada de ocorrências
  - Clusters de problemas
  - Marcadores personalizados

- **Dashboards Analíticos**
  - Gráficos interativos (Chart.js)
  - Métricas de performance
  - Análise temporal

- **Filtros Avançados**
  - Por tipo de problema
  - Por bairro
  - Por status
  - Por gravidade
  - Por período

- **Gestão de Ocorrências**
  - Criação de novas ocorrências
  - Atualização de status
  - Visualização de histórico

- **Classificação por IA**
  - Análise automática de gravidade
  - Sugestões de priorização
  - Relatórios inteligentes

### Backend (Java Spring Boot)

API RESTful completa com recursos avançados:

- **Autenticação e Autorização**
  - JWT (JSON Web Tokens)
  - Spring Security
  - Controle de acesso por roles

- **Geolocalização**
  - PostGIS para consultas espaciais
  - Cálculo de distâncias
  - Agregação por zonas geográficas

- **Integração com IA**
  - Classificação automática de gravidade
  - Análise de padrões
  - Geração de insights

- **Analytics e Relatórios**
  - Agregações complexas
  - Estatísticas por região
  - Exportação de dados

- **Performance**
  - Cache com Redis
  - Paginação otimizada
  - Consultas espaciais indexadas

---

## Arquitetura

### Arquitetura de Microsserviços

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
├──────────────────────┬───────────────────────────────────────┤
│  Flutter Mobile      │        Angular Web                    │
│  (Executivos)        │        (Técnicos SEDEAD)              │
└──────────┬───────────┴──────────────┬────────────────────────┘
           │                          │
           │                          │
┌──────────▼──────────────────────────▼────────────┐
│           BACKEND SERVICES LAYER                 │
├──────────────────────────────────────────────────┤
│  Java Spring Boot Service                       │
│  - API RESTful                                   │
│  - Autenticação JWT                              │
│  - Integração com IA                             │
│  - Analytics e Relatórios                        │
└──────────┬───────────────────────────────────────┘
           │
           │
┌──────────▼───────────────────────────────────────┐
│         DATA & INFRASTRUCTURE LAYER               │
├──────────────────────┬────────────────────────────┤
│  PostgreSQL 16      │    Redis 7                  │
│  + PostGIS           │    (Cache)                 │
└──────────────────────┴────────────────────────────┘
```

### Componentes Principais

- **Frontend Mobile (Flutter)**: Aplicativo nativo para iOS e Android
- **Frontend Web (Angular)**: Aplicação web responsiva
- **Backend (Java)**: API RESTful com Spring Boot
- **Banco de Dados**: PostgreSQL 16 com extensão PostGIS
- **Cache**: Redis para otimização de performance
- **Containerização**: Docker e Docker Compose

---

## Tecnologias

### Frontend Mobile
- **Flutter** 3.8.1
- **Dart** SDK
- **flutter_map** - Visualização de mapas
- **google_maps_flutter** - Integração com Google Maps
- **Provider** - Gerenciamento de estado

### Frontend Web
- **Angular** 20
- **TypeScript** 5.8
- **Leaflet** - Mapas interativos
- **Chart.js** - Gráficos e visualizações
- **PrimeNG** - Componentes UI
- **Tailwind CSS** - Estilização

### Backend
- **Java** 17
- **Spring Boot** 3.5.8
- **Spring Security** - Autenticação e autorização
- **Spring Data JPA** - Persistência
- **Hibernate Spatial** - Consultas geoespaciais
- **JWT** - Tokens de autenticação
- **SpringDoc OpenAPI** - Documentação da API

### Banco de Dados
- **PostgreSQL** 16
- **PostGIS** - Extensão geoespacial
- **Redis** 7 - Cache e sessões

### DevOps & Infraestrutura
- **Docker** & **Docker Compose**
- **Terraform** - Infraestrutura como código
- **Nginx** - Reverse proxy (opcional)

---

## Estrutura do Projeto

```
Desafio-Hackathon/
├── App-Flutter/                 # Aplicativo Mobile (Flutter)
│   ├── lib/
│   │   ├── config/              # Configurações da aplicação
│   │   ├── models/              # Modelos de dados (DTOs)
│   │   ├── pages/               # Telas da aplicação
│   │   ├── services/            # Serviços de comunicação com API
│   │   ├── utils/               # Utilitários e helpers
│   │   └── widgets/             # Componentes reutilizáveis
│   ├── android/                 # Configuração específica Android
│   ├── ios/                     # Configuração específica iOS
│   ├── web/                     # Configuração específica Web
│   └── pubspec.yaml             # Dependências do projeto
│
├── Frontend/                    # Aplicação Web (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/            # Módulo de autenticação e autorização
│   │   │   ├── map/             # Módulo de visualização de mapas
│   │   │   ├── dashboard/       # Módulo de dashboards e estatísticas
│   │   │   ├── ocorrencias/     # Módulo de gestão de ocorrências
│   │   │   ├── insights-ia/     # Módulo de insights gerados por IA
│   │   │   ├── relatorios-ia/   # Módulo de relatórios gerados por IA
│   │   │   ├── shared/          # Componentes e utilitários compartilhados
│   │   │   └── models/          # Modelos TypeScript
│   │   ├── environments/        # Configurações de ambiente (dev/prod)
│   │   └── public/              # Arquivos estáticos públicos
│   ├── angular.json             # Configuração do Angular CLI
│   └── package.json             # Dependências Node.js
│
├── Back-Java/                   # Backend (Spring Boot)
│   ├── src/main/java/com/moredevs/mapblu/
│   │   ├── core/                # Camada de domínio e lógica de negócio
│   │   │   ├── domain/          # Entidades JPA (User, Ocorrencia, etc.)
│   │   │   ├── dto/             # DTOs de request e response
│   │   │   ├── repository/      # Repositórios JPA para acesso a dados
│   │   │   ├── service/         # Serviços de negócio e regras de domínio
│   │   │   ├── mapper/          # Conversores entre entidades e DTOs
│   │   │   ├── exception/       # Exceções customizadas
│   │   │   └── scheduler/       # Jobs agendados
│   │   ├── infraestructure/     # Camada de infraestrutura
│   │   │   ├── controller/      # Controllers REST (endpoints da API)
│   │   │   ├── config/          # Configurações (Security, Redis, OpenAPI)
│   │   │   ├── security/        # Filtros e handlers de segurança JWT
│   │   │   └── integration/     # Integrações com serviços externos (IA)
│   │   ├── ingestion/           # Módulo de ingestão de dados
│   │   │   ├── ia/              # Classificação automática por IA
│   │   │   └── simulator/       # Simulador de dados para testes
│   │   └── shared/              # Utilitários e constantes compartilhadas
│   ├── src/main/resources/      # Arquivos de configuração (application.properties)
│   ├── src/test/                # Testes unitários e de integração
│   └── pom.xml                  # Dependências Maven
│
├── DevopsInfra/                 # Infraestrutura e DevOps
│   ├── docker-compose.yml       # Orquestração de containers Docker
│   ├── Dockerfile.*             # Dockerfiles para cada serviço
│   ├── terraform/               # Infraestrutura como código (Terraform)
│   └── infra/
│       └── db/                  # Scripts SQL de inicialização do banco
│
├── CHANGELOG                    # Histórico de mudanças do projeto
├── code pattern.md              # Padrões de código e convenções
└── README.md                    # Este arquivo
```

---

## Instalação

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Java 17+** (para desenvolvimento local do backend)
- **Node.js 18+** e **npm** (para desenvolvimento do frontend)
- **Flutter SDK 3.8.1+** (para desenvolvimento mobile)
- **PostgreSQL 16** com PostGIS (ou usar Docker)

### Instalação Rápida com Docker

1. **Clone o repositório**
```bash
git clone <repository-url>
cd Desafio-Hackathon
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Inicie os serviços com Docker Compose**
```bash
docker-compose -f DevopsInfra/docker-compose.yml --env-file .env up -d
```

4. **Aguarde a inicialização**
   - PostgreSQL: `http://localhost:5432`
   - PgAdmin: `http://localhost:5050`
   - Backend Java: `http://localhost:8080`
   - Frontend Angular: `http://localhost:4200`
   - Redis: `localhost:6379`

### Instalação Manual

#### Backend (Java)

```bash
cd Back-Java
./mvnw clean install
./mvnw spring-boot:run
```

#### Frontend Web (Angular)

```bash
cd Frontend
npm install
npm start
```

#### Frontend Mobile (Flutter)

```bash
cd App-Flutter
flutter pub get
flutter run
```

---

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
POSTGRES_DB=priorizablu
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin

# Backend
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/priorizablu
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Configuração do Banco de Dados

O script `docs/dados.sql` é executado automaticamente na inicialização do container PostgreSQL e popula o banco com:
- Estrutura de tabelas (users, ocorrencias, zonas, etc.)
- Dados de teste de Blumenau
- Extensões PostGIS habilitadas

### Configuração do Google Maps (Flutter)

1. Obtenha uma API Key no [Google Cloud Console](https://console.cloud.google.com/)
2. Configure no arquivo `App-Flutter/lib/config/api_config.dart`
3. Para Android: `android/app/src/main/AndroidManifest.xml`
4. Para iOS: `ios/Runner/AppDelegate.swift`

---

## Uso

### Aplicativo Mobile (Flutter)

1. Abra o aplicativo
2. Visualize o mapa de calor com zonas coloridas
3. Use os filtros para focar em tipos específicos de problemas
4. Toque em uma zona para ver detalhes
5. Acesse estatísticas e contatos de órgãos responsáveis

### Aplicação Web (Angular)

1. Acesse `http://localhost:4200`
2. Faça login (se necessário)
3. Explore o mapa interativo
4. Use os filtros avançados
5. Visualize dashboards e relatórios
6. Gerencie ocorrências

### API REST

Consulte a documentação completa em `docs/API.md` ou acesse:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

---

## API

### Endpoints Principais

#### Ocorrências
- `GET /api/ocorrencias` - Listar ocorrências
- `GET /api/ocorrencias/{id}` - Obter ocorrência por ID
- `POST /api/ocorrencias` - Criar nova ocorrência
- `PUT /api/ocorrencias/{id}` - Atualizar ocorrência
- `DELETE /api/ocorrencias/{id}` - Deletar ocorrência

#### Heatmap
- `GET /api/heatmap` - Obter dados do mapa de calor
- `GET /api/heatmap/zones` - Obter zonas geográficas
- `GET /api/heatmap/statistics` - Estatísticas do heatmap

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout

Para documentação completa, consulte `docs/API.md`.

---

## Documentação

- [Arquitetura Detalhada](docs/ARCHITECTURE.md)
- [Documentação da API](docs/API.md)
- [Guia de Início Rápido](docs/QUICK_START.md)
- [Documentação Flutter](App-Flutter/README.md)
- [Documentação Angular](Frontend/README.md)
- [Documentação Java Backend](Back-Java/README.md)

---

## Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

<div align="center">

**Desenvolvido pelo grupo BluLabs / Grupo 7**

[Voltar ao topo](#mapblu---mapa-de-calor-de-problemas-da-cidade)

</div>
