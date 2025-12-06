# ��� Arquitetura de Microserviços (Java/Flutter/Angular)

> Este projeto define e orquestra uma arquitetura de aplicação completa usando Docker Compose, incluindo serviços de banco de dados, cache e múltiplos frontends e backends.

---

## ✨ Componentes da Arquitetura

O ambiente é composto pelos seguintes serviços:

* **postgres**: Banco de dados **PostgreSQL** com extensão **PostGIS** para dados geoespaciais.
* **pgadmin**: Interface web **PGAdmin 4** para gerenciamento do PostgreSQL.
* **redis**: Servidor de cache/estrutura de dados **Redis**.
* **backend-java-core**: Serviço **Backend Java (Spring Boot)**, sendo o coração da aplicação, conectado ao PostgreSQL e Redis.
* **frontend-flutter**: Aplicação **Frontend Flutter** (compilada para web) servida por um contêiner web.
* **frontend-angular**: Aplicação **Frontend Angular** servida por um contêiner web.



---

## ���️ Pré-requisitos

Para executar este projeto, você precisará ter:

1.  **Docker**
2.  **Docker Compose** (geralmente incluído no Docker Desktop)
3.  **Git** (para clonar o repositório)

---

## ⚙️ Configuração e Execução

### 1. Variáveis de Ambiente

O projeto depende de um arquivo `.env` para carregar as credenciais de banco de dados, acesso ao PGAdmin e chaves de API.

* Crie um arquivo chamado **`.env`** na raiz do diretório onde o `docker-compose.yml` está localizado.

* Preencha o arquivo com as seguintes variáveis (substitua os valores de exemplo por suas próprias credenciais):

    ```env
    # Variáveis do PostgreSQL/PostGIS
    POSTGRES_DB=seu_banco_de_dados
    POSTGRES_USER=seu_usuario
    POSTGRES_PASSWORD=sua_senha_forte

    # Variáveis do PGAdmin
    PGADMIN_DEFAULT_EMAIL=admin@example.com
    PGADMIN_DEFAULT_PASSWORD=admin_password

    # Variáveis do Backend (APIs)
    OPENROUTER_API_KEY=sua_chave_openrouter
    XAI_API_KEY=sua_chave_xai
    ```
    ⚠️ **Segurança:** Nunca publique seu arquivo `.env` com credenciais em repositórios públicos.

### 2. Estrutura de Arquivos

Certifique-se de que a estrutura de arquivos para os serviços `build` esteja correta:

* O **Backend Java** espera encontrar o código-fonte em `/home/ubuntu/Desafio-Hackathon/Back-Java` e o `Dockerfile.java` em `../DevopsInfra`. (Ajuste o caminho `context` se estiver executando de um diretório diferente).
* O **Frontend Flutter** espera encontrar o código-fonte em `../` e o `Dockerfile.flutter` em `DevopsInfra/`.
* O **Frontend Angular** espera encontrar o código-fonte em `../Frontend` e o `Dockerfile.angular` em `../DevopsInfra/`.
* O **Postgres** espera os scripts de inicialização em `./infra/db/init`.

### 3. Inicialização

Na raiz do projeto (onde está o `docker-compose.yml` e o `.env`), execute o seguinte comando:

```bash
docker compose up -d --build


Serviço,Porta Local,URL de Acesso,Descrição
Frontend Angular,3000,http://localhost:3000,Interface web principal.
Frontend Flutter,4200,http://localhost:4200,Interface web alternativa/secundária.
Backend Java Core,8080,http://localhost:8080,API principal.
PGAdmin 4,5050,http://localhost:5050,Gerenciamento do banco de dados .
PostgreSQL,5432,localhost:5432,Acesso direto ao DB (se necessário).
Redis,6379,localhost:6379,Acesso ao servidor de cache.

Comandos essenciais

Comando,Descrição
docker compose ps,Lista o status dos contêineres em execução.
docker compose down,"Para e remove os contêineres, volumes e redes criadas pelo Compose."
docker compose logs -f [NOME_SERVICO],Exibe os logs em tempo real de um serviço específico (ex: backend-java-core).
docker compose exec [NOME_SERVICO] bash,Abre um terminal dentro do contêiner de um serviço.
docker volume rm nome_volume,Remove um volume persistente (ex: docker volume rm pg_data).