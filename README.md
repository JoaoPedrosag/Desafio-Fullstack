# 🧠 Desafio Técnico - Fullstack

Um sistema de **chat em tempo real** construído com NestJS, usando WebSockets, Redis, Bull Queue e PostgreSQL. Projetado para escalar horizontalmente com **balanceamento de carga** e suporte a múltiplas instâncias.

## ☁️ Infraestrutura

> ☁️ Os arquivos (imagens/documentos) são armazenados em um **bucket da Cloudflare R2** em produção.
> 📁 Em ambiente de desenvolvimento (`localhost`), os arquivos são salvos localmente para facilitar testes.

## 🌍 Acesso ao Projeto

- 🔗 **Frontend (Web App):** [https://www.infinities.info/](https://www.infinities.info/)
- 📡 **API Backend:** [https://api.infinities.info/](https://api.infinities.info/)
---

## ✨ Funcionalidades

- 💬 **Chat em tempo real** com WebSocket
- 🏠 **Salas de chat** dinâmicas
- 👥 **Usuários online** em tempo real
- 🔐 **Autenticação JWT** com cookies
- 📊 **Testes de carga** automatizados
- ⚖️ **Load balancing** com HAProxy
- 🔄 **Horizontal scaling** (4 instâncias)
- 📦 **Queue system** com Bull/Redis

---

## 🚀 Como iniciar localmente

1. Acesse a pasta do backend:

```bash
cd back
```

2. Instale as dependências:

```bash
npm install
```

3. Suba os containers com Redis e PostgreSQL:

```bash
docker-compose up -d
```

4. Rode as migrações do Prisma:

```bash
npx prisma migrate dev
```

5. Inicie o servidor em modo desenvolvimento:

```bash
npm run start:dev
```

---

## 🧱 Arquitetura do sistema

```
                +-------------------+
                |  Load Balancer    | (HAProxy)
                +--------+----------+
                         |
         +---------------+---------------+
         |               |               |
+--------+-----+ +-------+------+ +------+--------+
| NestJS Inst 1| |NestJS Inst 2 | | NestJS Inst 3 |
| (WebSocket)  | |(WebSocket)   | | (WebSocket)   |
+------+-------+ +------+-------+ +-------+-------+
       |                |                 |
       +----------+-----+------+----------+
                          |
                  +-------v--------+
                  |    Redis Pub/Sub|
                  |     + Bull MQ   |
                  +-------+--------+
                          |
                  +-------v--------+
                  |   Workers NestJS|
                  |  (Process Queue)|
                  +-------+--------+
                          |
                    +-----v------+
                    | PostgreSQL |
                    +------------+
```

- **Redis**: usado como Pub/Sub para comunicação entre instâncias WebSocket.
- **Bull (Queue)**: utilizado para processar mensagens e eventos assíncronos.
- **PostgreSQL**: banco de dados relacional com Prisma ORM.
- **HAProxy**: balanceador de carga para distribuir conexões WebSocket entre instâncias.

---

## ⚖️ Escalabilidade

O sistema foi testado com **4 instâncias do NestJS executando em paralelo**, com balanceamento de carga via HAProxy.

> ❗️Importante: Esta abordagem é uma **tentativa de escalar horizontalmente** com load balancing. Para produção, o ideal seria utilizar **Kubernetes (K8s)**, que fornece gerenciamento automatizado de escalabilidade, disponibilidade e deploys resilientes.

---

## 📂 Scripts úteis

| Comando                  | Descrição                                 |
| ------------------------ | ----------------------------------------- |
| `npm install`            | Instala dependências                      |
| `docker-compose up -d`   | Sobe Redis e PostgreSQL                   |
| `npx prisma migrate dev` | Executa migrações                         |
| `npm run start:dev`      | Inicia o servidor em modo desenvolvimento |

---

## 🧪 Teste de Carga

Foi realizado um pequeno teste de carga para simular múltiplos usuários conectando simultaneamente via WebSocket.

### ▶️ Como executar o teste de carga

1. Inicie o ambiente escalável com múltiplas instâncias:

```bash
docker-compose -f docker-compose.scaling.yml up -d
```

2. Acesse a pasta de testes e instale as dependências:

```bash
cd load-test
npm install
```

3. Execute o teste de carga simulando 100 usuários:

```bash
node websocket-load-test.js --url http://localhost:8080 --users 100
```

Este comando simula 100 usuários conectando-se ao servidor WebSocket em paralelo para avaliar a estabilidade e performance da aplicação.

### 📊 **Resultados dos Testes**

| Usuários | Latência Média | Taxa de Sucesso | Status       |
| -------- | -------------- | --------------- | ------------ |
| 100      | 9ms            | 100%            | ✅ Excelente |
| 1000     | 2.1s           | 98.2%           | ⚠️ Limitado  |

> 💡 O sistema suportou 1000 usuários simultâneos, mas com média de ~3000ms de latência sob carga.

---

## 🚀 Planos para Escalabilidade

Embora o sistema já suporte múltiplas instâncias backend e balanceamento de carga com HAProxy, há diversas melhorias e estratégias que poderiam ser implementadas para permitir que a aplicação escale com maior robustez e performance:

### ⚙️ Backend e Infraestrutura

- **Migrar para Kubernetes (K8s)**: Para orquestração automatizada de instâncias, balanceamento, escalabilidade e deploys resilientes.
- **Separar os Workers em containers dedicados**
- **Monitoramento e métricas**: Usar Prometheus e Grafana para acompanhar uso de CPU, memória, jobs pendentes, throughput etc.
- **Compressão de mensagens WebSocket**: Reduzir o tamanho das mensagens trocadas entre cliente e servidor.
- **Elastic Load Balancer (AWS/GCP)**: Substituir o HAProxy por uma solução nativa de nuvem com auto scaling integrado.

### 🗃️ Otimizações no PostgreSQL

- **Replicação com read/write split**: Usar instâncias de leitura para aliviar a carga do primário.
- **PgBouncer para pooling de conexões**: Evita excesso de conexões simultâneas.
- **Índices inteligentes**: Para colunas com filtros e buscas frequentes.
- **Cache Redis**: Para informações acessadas com frequência, como salas e usuários online.
- **Arquivamento de mensagens antigas**: Fora do banco (ex: S3 ou Cloudflare R2) para manter performance com dados ativos apenas.
> 📌 Estas melhorias visam suportar **milhares de usuários simultâneos com baixa latência**, alta disponibilidade e escalabilidade contínua.
> 
## 🎨 Frontend (React)

O frontend foi desenvolvido com **React + TypeScript**, utilizando **Chakra UI** como design system para uma interface moderna e responsiva.

### 🛠️ **Tecnologias principais:**

- **Chakra UI** - Components e design system
- **Socket.IO Client** - Comunicação WebSocket
- **React Hooks** - Gerenciamento de estado
- **TypeScript** - Type safety

### Funcionalidades principais:

- 🔐 Login e registro de usuários
- 🏠 Criação e busca de salas
- 💬 Envio e recepção de mensagens instantâneas
- 🖼️ Envio de **imagens** e **arquivos**
- 🔗 Preview de links compartilhados
- 🔔 Notificações em tempo real nas salas que o usuário participa

### Acesso

- 🌐 Aplicação online: [https://www.infinities.info/](https://www.infinities.info/)

### 🚀 Como iniciar o frontend localmente

1. Acesse a pasta do frontend:

```bash
cd front
```

2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo de variáveis de ambiente:

```bash
cp .env-example .env
```

4. Configure a variável `VITE_API_BASE_URL` no `.env` com o endereço da API:

```
VITE_API_BASE_URL=http://localhost:3000
```

5. Para gerar o build de produção:

```bash
npm run build
```

6. Para iniciar o projeto localmente:

```bash
npm run preview
```

---

## 🛠️ **Stack Tecnológica**

### Backend

- **NestJS** - Framework Node.js
- **Socket.IO** - WebSocket real-time
- **Bull Queue** - Job processing
- **Redis** - Cache & Pub/Sub
- **PostgreSQL** - Database
- **Prisma** - ORM
- **HAProxy** - Load balancer
- **JWT** - Authentication

### Frontend

- **React** - UI Framework
- **TypeScript** - Type safety
- **Chakra UI** - Component library
- **Vite** - Build tool
- **Socket.IO Client** - Real-time connection

### DevOps & Infraestrutura

- **Docker** - Containerization
- **Cloudflare R2** - File storage (produção)
- **Load Testing** - Performance validation
- **HAProxy** - Load balancing
