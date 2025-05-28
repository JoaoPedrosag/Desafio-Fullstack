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

1. Acesse o diretório do frontend:

```bash
cd frontend
```

2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

4. Configure a variável `VITE_API_BASE_URL` no `.env` com o endereço da API:

```
VITE_API_BASE_URL=http://localhost:3000
```

5. Para gerar o build de produção:

```bash
npm run build
```
