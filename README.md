# 🧠 Desafio Técnico - Fullstack

Um sistema de **chat em tempo real** construído com NestJS, usando WebSockets, Redis, Bull Queue e PostgreSQL. Projetado para escalar horizontalmente com **balanceamento de carga** e suporte a múltiplas instâncias.

## ☁️ Infraestrutura

> ☁️ Os arquivos (imagens/documentos) são armazenados em um **bucket da Cloudflare R2** em produção.
> 📁 Em ambiente de desenvolvimento (`localhost`), os arquivos são salvos localmente para facilitar testes.

## 🌍 Acesso ao Projeto

- 🔗 **Frontend (Web App):** [https://www.infinities.info/](https://www.infinities.info/)
- 📡 **API Backend:** [https://api.infinities.info/](https://api.infinities.info/)
- 📁 **Repositório:** [https://github.com/JoaoPedrosag/chat-app]

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

2. **Instale as dependências:**

```bash
npm install
```

4. **Suba os containers com Redis e PostgreSQL:**

```bash
docker-compose up -d
```

4. **Rode as migrações do Prisma:**

```bash
npx prisma migrate dev
```

5. **Inicie o servidor em modo desenvolvimento:**

```bash
npm run start:dev
```

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

Este projeto foi testado com **4 instâncias NestJS** em execução simultaneamente, utilizando **HAProxy** para distribuir a carga.

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

## 🎨 Frontend (React)

O frontend do projeto foi desenvolvido com **React**, com integração completa ao WebSocket.

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

2. Acesse o diretório do frontend:

```bash
cd frontend
```

3. Instale as dependências:

```bash
npm install
```

4. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

5. Configure a variável `VITE_API_BASE_URL` no `.env` com o endereço da API:

```
VITE_API_BASE_URL=http://localhost:3000
```

6. Para gerar o build de produção:

```bash
npm run build
```
