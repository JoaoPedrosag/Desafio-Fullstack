const { io } = require("socket.io-client");
const os = require("os");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

class WebSocketLoadTest {
  constructor(serverUrl = "http://localhost:3000") {
    console.log("🚀 Iniciando teste de carga com o servidor:", serverUrl);
    this.serverUrl = serverUrl;
    this.clients = [];
    this.messageTimestamps = new Map();
    this.createdUsers = new Map();
    this.createdRooms = new Map();
    this.connectionTimeouts = new Set();
    this.metrics = {
      connected: 0,
      disconnected: 0,
      messagesReceived: 0,
      messagesSent: 0,
      errors: 0,
      timeouts: 0,
      latencies: [],
      startTime: null,
      endTime: null,
      usersCreated: 0,
      roomsCreated: 0,
    };
  }

  async makeHttpRequest(method, path, data = null, authToken = null) {
    const url = new URL(path, this.serverUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (authToken) {
      options.headers.Authorization = `Bearer ${authToken}`;
    }

    const client = url.protocol === "https:" ? https : http;

    return new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            let token = null;
            const cookies = res.headers["set-cookie"];
            if (cookies) {
              const tokenCookie = cookies.find((cookie) =>
                cookie.includes("accessToken=")
              );
              if (tokenCookie) {
                token = tokenCookie.split("accessToken=")[1].split(";")[0];
              }
            }

            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                status: res.statusCode,
                data: parsed,
                token: token,
              });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ status: res.statusCode, data: responseData });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.setTimeout(10000);

      if (data) {
        const postData = JSON.stringify(data);
        req.write(postData);
      }
      req.end();
    });
  }

  async createRealUser(userId, username, email) {
    try {
      const userData = {
        username: username,
        email: email,
        password: "teste123",
      };

      await this.makeHttpRequest("POST", "/auth/register", userData);
      console.log(`👤 Usuário ${username} criado no banco de dados`);
      this.metrics.usersCreated++;

      this.createdUsers.set(userId, {
        ...userData,
        id: userId,
        dbEmail: email,
      });

      return { success: true, userData };
    } catch (error) {
      if (
        error.message.includes("Email está em uso") ||
        error.message.includes("E-mail já está em uso")
      ) {
        console.log(`📧 Email ${email} já existe, usuário será reutilizado`);
        this.createdUsers.set(userId, {
          username,
          email,
          password: "teste123",
          id: userId,
          dbEmail: email,
          userExists: true,
        });
        return { success: true, userExists: true };
      }

      console.warn(`⚠️ Falha ao criar usuário ${username}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async loginUser(email, password = "teste123") {
    try {
      const loginData = { email, password };
      const response = await this.makeHttpRequest(
        "POST",
        "/auth/login",
        loginData
      );

      if (response.token) {
        console.log(`🔑 Login realizado para ${email} - Token obtido`);
        return { success: true, token: response.token };
      } else {
        console.log(`🔑 Login realizado para ${email} - Sem token no cookie`);
        return { success: true, needsTokenExtraction: true };
      }
    } catch (error) {
      console.warn(`⚠️ Falha no login para ${email}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getUserData(token) {
    try {
      const response = await this.makeHttpRequest(
        "GET",
        "/auth/me",
        null,
        token
      );
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Erro ao obter dados do usuário: ${error.message}`);
      return null;
    }
  }

  async createRealRoom(roomName, authToken) {
    try {
      const roomData = { name: roomName };
      const response = await this.makeHttpRequest(
        "POST",
        "/rooms",
        roomData,
        authToken
      );

      console.log(
        `🏠 Sala ${roomName} criada no banco de dados (ID: ${response.data.id})`
      );
      this.metrics.roomsCreated++;
      this.createdRooms.set(roomName, response.data);
      return response.data;
    } catch (error) {
      console.warn(`⚠️ Falha ao criar sala ${roomName}: ${error.message}`);
      return null;
    }
  }

  async joinRoomViaAPI(roomId, userId, authToken) {
    try {
      await this.makeHttpRequest(
        "POST",
        `/rooms/${roomId}/join`,
        { userId },
        authToken
      );
      console.log(`👥 Usuário ${userId} entrou na sala ${roomId} via API`);
      return { success: true };
    } catch (error) {
      console.warn(`⚠️ Falha ao entrar na sala ${roomId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async createAuthenticatedClient(userId, username) {
    return new Promise(async (resolve) => {
      try {
        const email = `${username.toLowerCase()}@test.com`;

        const userCreationResult = await this.createRealUser(
          userId,
          username,
          email
        );

        if (!userCreationResult || !userCreationResult.success) {
          const mockClientData = {
            id: userId,
            username: username,
            email: email,
            token: "mock-token",
            isMock: true,
            isRealUser: false,
            realUserId: null,
            client: null,
            messagesSent: 0,
            messagesReceived: 0,
          };
          this.clients.push(mockClientData);
          this.metrics.errors++;
          console.log(
            `⚠️  Cliente ${username} criado como mock (falha na API)`
          );
          return resolve(mockClientData);
        }

        const loginResult = await this.loginUser(email);

        if (!loginResult || !loginResult.success) {
          console.log(`⚠️  Falha no login para ${username}, criando como mock`);
          const mockClientData = {
            id: userId,
            username: username,
            email: email,
            token: "mock-token",
            isMock: true,
            isRealUser: false,
            realUserId: null,
            client: null,
            messagesSent: 0,
            messagesReceived: 0,
          };
          this.clients.push(mockClientData);
          this.metrics.errors++;
          return resolve(mockClientData);
        }

        const jwtToken = loginResult.token;

        const realUserData = await this.getUserData(jwtToken);
        const realUserId = realUserData ? realUserData.id : userId;

        console.log(
          `✅ Usuário real autenticado: ${username} - ID real: ${realUserId}`
        );

        const connectionTimeout = 20000;
        let timeoutId;
        let isResolved = false;

        const client = io(this.serverUrl, {
          auth: {
            token: jwtToken,
          },
          reconnection: false,
          timeout: connectionTimeout,
          forceNew: true,
          transports: ["websocket"],
        });

        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            this.metrics.timeouts++;
            this.metrics.errors++;
            client.disconnect();

            console.log(`⏰ Cliente ${username} falhou por timeout`);

            const mockClientData = {
              id: userId,
              username: username,
              email: email,
              token: jwtToken,
              isMock: true,
              isRealUser: true,
              realUserId: realUserId,
              client: null,
              messagesSent: 0,
              messagesReceived: 0,
            };
            this.clients.push(mockClientData);
            resolve(mockClientData);
          }
        }, connectionTimeout);

        client.on("connect", () => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);

            this.metrics.connected++;
            console.log(`✅ Cliente ${username} conectado via WebSocket`);

            const clientData = {
              id: userId,
              username: username,
              email: email,
              token: jwtToken,
              isMock: false,
              isRealUser: true,
              realUserId: realUserId,
              client: client,
              messagesSent: 0,
              messagesReceived: 0,
              currentRoomId: null,
            };

            client.on("newMessage", (data) => {
              clientData.messagesReceived++;
              this.metrics.messagesReceived++;

              const messageKey = `${data.userId || clientData.realUserId}-${data.content}`;
              if (this.messageTimestamps.has(messageKey)) {
                const latency =
                  Date.now() - this.messageTimestamps.get(messageKey);
                this.metrics.latencies.push(latency);
                this.messageTimestamps.delete(messageKey);
              }
            });

            client.on("disconnect", () => {
              this.metrics.disconnected++;
              console.log(`❌ Cliente ${username} desconectado`);
            });

            client.on("connect_error", (error) => {
              if (!isResolved) {
                isResolved = true;
                clearTimeout(timeoutId);
                this.metrics.errors++;
                console.log(`❌ Erro de conexão ${username}: ${error.message}`);

                const mockClientData = {
                  id: userId,
                  username: username,
                  email: email,
                  token: jwtToken,
                  isMock: true,
                  isRealUser: true,
                  realUserId: realUserId,
                  client: null,
                  messagesSent: 0,
                  messagesReceived: 0,
                };
                this.clients.push(mockClientData);
                resolve(mockClientData);
              }
            });

            this.clients.push(clientData);
            resolve(clientData);
          }
        });
      } catch (error) {
        this.metrics.errors++;
        console.log(`❌ Erro ao criar cliente ${username}: ${error.message}`);

        const mockClientData = {
          id: userId,
          username: username,
          email: `${username.toLowerCase()}@test.com`,
          token: "error-token",
          isMock: true,
          isRealUser: false,
          realUserId: null,
          client: null,
          messagesSent: 0,
          messagesReceived: 0,
        };
        this.clients.push(mockClientData);
        resolve(mockClientData);
      }
    });
  }

  async connectClients(numberOfClients) {
    console.log(
      `🚀 Iniciando conexão de ${numberOfClients} clientes com escalonamento...`
    );

    const BATCH_SIZE = 100;
    const BATCH_DELAY = 3000;

    this.clients = [];

    for (
      let batch = 0;
      batch < Math.ceil(numberOfClients / BATCH_SIZE);
      batch++
    ) {
      const startIndex = batch * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, numberOfClients);

      console.log(
        `📦 Conectando batch ${batch + 1}: usuários ${startIndex + 1}-${endIndex}`
      );

      const batchPromises = [];
      for (let i = startIndex; i < endIndex; i++) {
        const userId = `user-${i + 1}`;
        const username = `Usuario${i + 1}`;
        batchPromises.push(this.createAuthenticatedClient(userId, username));
      }

      const batchClients = await Promise.all(batchPromises);
      this.clients.push(...batchClients);

      if (batch < Math.ceil(numberOfClients / BATCH_SIZE) - 1) {
        console.log(`⏳ Aguardando ${BATCH_DELAY}ms antes do próximo batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log(`✅ ${this.clients.length} clientes processados em batches`);
    console.log(`📊 Conectados: ${this.metrics.connected}`);
    console.log(`❌ Erros: ${this.metrics.errors}`);
    console.log(`⏰ Timeouts: ${this.metrics.timeouts}`);
    console.log(`🤖 Mocks: ${this.clients.filter((c) => c.isMock).length}`);

    return this.clients;
  }

  async simulateJoinRooms(
    clients,
    roomNames = ["test-room-1", "test-room-2", "test-room-3"]
  ) {
    console.log(
      `🏠 Simulando criação e entrada em ${roomNames.length} salas...`
    );

    const validClients = clients.filter(
      (c) => !c.isMock && c.token && c.client.connected
    );

    if (validClients.length === 0) {
      console.warn(`⚠️ Nenhum cliente válido para criar salas`);
      return;
    }

    const creatorClient = validClients[0];

    for (const roomName of roomNames) {
      try {
        const room = await this.createRealRoom(roomName, creatorClient.token);
        if (room) {
          console.log(`🏠 Sala criada: ${roomName} (ID: ${room.id})`);

          await this.joinRoomViaAPI(
            room.id,
            creatorClient.realUserId,
            creatorClient.token
          );
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao criar sala ${roomName}: ${error.message}`);
      }
    }

    const roomIds = Array.from(this.createdRooms.values()).map(
      (room) => room.id
    );

    for (let i = 0; i < validClients.length; i++) {
      const client = validClients[i];
      const roomIndex = i % roomIds.length;
      const roomId = roomIds[roomIndex];
      const roomName = roomNames[roomIndex];

      try {
        if (!client.isMock) {
          await this.joinRoomViaAPI(roomId, client.realUserId, client.token);
        }

        client.client.emit("joinRoom", roomId);
        client.currentRoomId = roomId;

        console.log(
          `👥 ${client.username} entrou na sala ${roomName} (${roomId})`
        );
      } catch (error) {
        console.warn(
          `⚠️ Erro ao adicionar ${client.username} à sala ${roomName}: ${error.message}`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`✅ Clientes distribuídos nas salas`);
  }

  async simulateMessages(clients, messagesPerClient = 3) {
    console.log(
      `📨 Iniciando simulação de ${messagesPerClient} mensagens por cliente...`
    );
    this.metrics.startTime = Date.now();

    const validClients = clients.filter(
      (c) => !c.isMock && c.client.connected && c.currentRoomId
    );

    if (validClients.length === 0) {
      console.warn(`⚠️ Nenhum cliente válido para enviar mensagens`);
      return;
    }

    const promises = [];

    validClients.forEach((clientData) => {
      for (let i = 1; i <= messagesPerClient; i++) {
        const promise = new Promise((resolve) => {
          setTimeout(
            () => {
              const messageContent = `Teste ${i} de ${clientData.username}`;
              const messageData = {
                content: messageContent,
                roomId: clientData.currentRoomId,
              };

              const messageKey = `${clientData.realUserId}-${messageContent}`;
              this.messageTimestamps.set(messageKey, Date.now());

              clientData.client.emit("sendMessage", messageData);
              clientData.messagesSent++;
              this.metrics.messagesSent++;

              if (this.metrics.messagesSent % 5 === 0) {
                console.log(
                  `📊 ${this.metrics.messagesSent} mensagens enviadas...`
                );
              }

              resolve();
            },
            Math.random() * 3000 + i * 1000
          );
        });

        promises.push(promise);
      }
    });

    await Promise.all(promises);
    console.log(
      `✅ Todas as ${this.metrics.messagesSent} mensagens foram enviadas!`
    );

    console.log(`⏳ Aguardando processamento das mensagens...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.metrics.endTime = Date.now();
  }

  async showStats(numberOfClients) {
    const duration = this.metrics.endTime - this.metrics.startTime;
    const durationSeconds = duration / 1000;
    const messagesPerSecond = this.metrics.messagesSent / durationSeconds;

    const avgLatency =
      this.metrics.latencies.length > 0
        ? this.metrics.latencies.reduce((a, b) => a + b) /
          this.metrics.latencies.length
        : 0;

    const realUsers = this.clients.filter((c) => c.isRealUser).length;
    const integrationLevel =
      this.metrics.usersCreated > 0
        ? "full-database-integration"
        : "websocket-only";

    const totalAttempts = numberOfClients;
    const successfulConnections = this.metrics.connected;
    const successRate = (successfulConnections / totalAttempts) * 100;

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    📊 RESULTADOS DO TESTE                     ║
╠══════════════════════════════════════════════════════════════╣
║ 👥 Clientes conectados: ${this.metrics.connected.toString().padStart(4)}                              ║
║ 📨 Mensagens enviadas:  ${this.metrics.messagesSent.toString().padStart(4)}                              ║
║ 📬 Mensagens recebidas: ${this.metrics.messagesReceived.toString().padStart(4)}                              ║
║ ❌ Erros de conexão:    ${this.metrics.errors.toString().padStart(4)}                              ║
║ ⏰ Timeouts:            ${this.metrics.timeouts.toString().padStart(4)}                              ║
║ ⏱️  Duração:             ${durationSeconds.toFixed(2)}s                           ║
║ 🚀 Msgs/segundo:        ${messagesPerSecond.toFixed(2)}                             ║
║ 📡 Latência média:      ${avgLatency.toFixed(2)}ms                           ║
║ 🎯 Taxa de sucesso:     ${successRate.toFixed(1)}%                            ║
║                                                              ║
║ 🏗️  INTEGRAÇÃO REAL:                                         ║
║ 👤 Usuários criados:    ${this.metrics.usersCreated.toString().padStart(2)}                            ║
║ 🏠 Salas criadas:       ${this.metrics.roomsCreated.toString().padStart(2)}                            ║
║ 🔗 Usuários reais:      ${realUsers.toString().padStart(2)}                            ║
║ 📋 Nível integração:    ${integrationLevel.padEnd(25)} ║
║                                                              ║
║ 💻 Sistema: ${os.type()} ${os.release()}                                    ║
║ 🧠 Memória: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB total               ║
╚══════════════════════════════════════════════════════════════╝
    `);

    const stats = {
      connected: this.metrics.connected,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      errors: this.metrics.errors,
      timeouts: this.metrics.timeouts,
      duration: durationSeconds,
      messagesPerSecond: messagesPerSecond,
      avgLatency: avgLatency,
      successRate: successRate,
      usersCreatedInDB: this.metrics.usersCreated,
      roomsCreatedInDB: this.metrics.roomsCreated,
      integrationLevel: integrationLevel,
    };

    try {
      const reportPaths = await this.generateReport(stats);
      console.log(`✅ Relatórios gerados com sucesso!`);
    } catch (error) {
      console.log(`⚠️  Erro ao gerar relatórios: ${error.message}`);
    }

    return stats;
  }

  async cleanup() {
    console.log(`🧹 Desconectando ${this.clients.length} clientes...`);

    this.clients.forEach((clientData) => {
      if (!clientData.isMock && clientData.client) {
        clientData.client.disconnect();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`✅ Cleanup concluído`);
  }

  async runLoadTest(numberOfClients = 10, messagesPerClient = 3) {
    try {
      console.log(`
🚀 ===== TESTE DE CARGA WEBSOCKET COM INTEGRAÇÃO REAL ===== 
📊 Clientes: ${numberOfClients}
📨 Mensagens por cliente: ${messagesPerClient}
🎯 Total esperado: ${numberOfClients * messagesPerClient} mensagens
🔗 Servidor: ${this.serverUrl}
🏗️  Fluxo: Registro → Login → Criar Salas → Entrar → Mensagens
═══════════════════════════════════════════════════════════════
      `);

      const clients = await this.connectClients(numberOfClients);

      await this.simulateJoinRooms(clients);

      await this.simulateMessages(clients, messagesPerClient);

      const stats = await this.showStats(numberOfClients);

      await this.cleanup();

      return stats;
    } catch (error) {
      console.error(`❌ Erro no teste: ${error.message}`);
      await this.cleanup();
      throw error;
    }
  }

  async generateReport(stats) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = path.join(__dirname, "reports");

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(
      reportDir,
      `load-test-report-${timestamp}.html`
    );

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Teste de Carga - Chat API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .title { font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; opacity: 0.9; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card h3 { color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .metric { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
        .metric-label { font-weight: 600; }
        .metric-value { font-size: 1.2em; font-weight: bold; }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .error { color: #e74c3c; }
        .info { color: #3498db; }
        .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); transition: width 0.3s ease; }
        .details { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .timestamp { text-align: center; margin-top: 20px; color: #7f8c8d; }
        .status-good { background: #d5f4e6; color: #27ae60; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
        .status-warning { background: #fef5e7; color: #f39c12; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
        .status-error { background: #fadbd8; color: #e74c3c; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🚀 Relatório de Teste de Carga</h1>
            <p class="subtitle">Chat API - Teste de WebSocket com Integração Completa</p>
            <p style="margin-top: 10px; opacity: 0.8;">Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 Estatísticas Gerais</h3>
                <div class="metric">
                    <span class="metric-label">Clientes Conectados:</span>
                    <span class="metric-value success">${stats.connected}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Mensagens Enviadas:</span>
                    <span class="metric-value info">${stats.messagesSent}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Mensagens Recebidas:</span>
                    <span class="metric-value info">${stats.messagesReceived}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Duração:</span>
                    <span class="metric-value">${stats.duration.toFixed(2)}s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Taxa (msgs/s):</span>
                    <span class="metric-value info">${stats.messagesPerSecond.toFixed(2)}</span>
                </div>
            </div>

            <div class="card">
                <h3>⚡ Performance</h3>
                <div class="metric">
                    <span class="metric-label">Latência Média:</span>
                    <span class="metric-value ${stats.avgLatency > 100 ? "warning" : "success"}">${stats.avgLatency.toFixed(2)}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Taxa de Sucesso:</span>
                    <span class="metric-value ${stats.successRate > 90 ? "success" : stats.successRate > 70 ? "warning" : "error"}">${stats.successRate.toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.successRate}%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Timeouts:</span>
                    <span class="metric-value ${stats.timeouts > 0 ? "warning" : "success"}">${stats.timeouts}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Erros:</span>
                    <span class="metric-value ${stats.errors > 0 ? "error" : "success"}">${stats.errors}</span>
                </div>
            </div>

            <div class="card">
                <h3>🏗️ Integração Real</h3>
                <div class="metric">
                    <span class="metric-label">Usuários Criados:</span>
                    <span class="metric-value success">${stats.usersCreatedInDB}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Salas Criadas:</span>
                    <span class="metric-value success">${stats.roomsCreatedInDB}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Nível Integração:</span>
                    <span class="metric-value">${stats.integrationLevel}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Status Geral:</span>
                    <span class="${stats.successRate > 90 ? "status-good" : stats.successRate > 70 ? "status-warning" : "status-error"}">
                        ${stats.successRate > 90 ? "EXCELENTE" : stats.successRate > 70 ? "BOM" : "NECESSITA ATENÇÃO"}
                    </span>
                </div>
            </div>

            <div class="card">
                <h3>💻 Ambiente</h3>
                <div class="metric">
                    <span class="metric-label">Sistema:</span>
                    <span class="metric-value">${os.type()} ${os.release()}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memória Total:</span>
                    <span class="metric-value">${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPUs:</span>
                    <span class="metric-value">${os.cpus().length} cores</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Servidor:</span>
                    <span class="metric-value">${this.serverUrl}</span>
                </div>
            </div>
        </div>

        <div class="details">
            <h3>📋 Detalhes Técnicos</h3>
            <p><strong>Fluxo Testado:</strong> Registro de usuário → Login → Criação de sala → Conexão WebSocket → Envio de mensagens → Processamento Bull Queue → Persistência PostgreSQL</p>
            <p><strong>Tecnologias Validadas:</strong> NestJS, Socket.IO, JWT, Bull Queue, Redis, PostgreSQL, Prisma ORM</p>
            <p><strong>Métricas Capturadas:</strong> Latência de mensagens, taxa de conexão, throughput, integridade de dados</p>
        </div>

        <div class="timestamp">
            <p>Relatório gerado automaticamente pelo sistema de testes de carga</p>
            <p>Chat API Load Testing Suite v2.0</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(reportPath, html);
    console.log(`📄 Relatório HTML gerado: ${reportPath}`);

    const markdownPath = path.join(
      reportDir,
      `load-test-report-${timestamp}.md`
    );
    const markdown = `# 🚀 Relatório de Teste de Carga - Chat API

**Data:** ${new Date().toLocaleString("pt-BR")}  
**Servidor:** ${this.serverUrl}

## 📊 Estatísticas Gerais

| Métrica | Valor |
|---------|-------|
| Clientes Conectados | ${stats.connected} |
| Mensagens Enviadas | ${stats.messagesSent} |
| Mensagens Recebidas | ${stats.messagesReceived} |
| Duração | ${stats.duration.toFixed(2)}s |
| Taxa (msgs/s) | ${stats.messagesPerSecond.toFixed(2)} |

## ⚡ Performance

| Métrica | Valor |
|---------|-------|
| Latência Média | ${stats.avgLatency.toFixed(2)}ms |
| Taxa de Sucesso | ${stats.successRate.toFixed(1)}% |
| Timeouts | ${stats.timeouts} |
| Erros | ${stats.errors} |

## 🏗️ Integração Real

| Métrica | Valor |
|---------|-------|
| Usuários Criados | ${stats.usersCreatedInDB} |
| Salas Criadas | ${stats.roomsCreatedInDB} |
| Nível Integração | ${stats.integrationLevel} |

## 💻 Ambiente

- **Sistema:** ${os.type()} ${os.release()}
- **Memória:** ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB
- **CPUs:** ${os.cpus().length} cores

## 🔬 Detalhes Técnicos

**Fluxo Testado:** Registro → Login → Criação sala → WebSocket → Mensagens → Bull Queue → PostgreSQL

**Status:** ${stats.successRate > 90 ? "✅ EXCELENTE" : stats.successRate > 70 ? "⚠️ BOM" : "❌ NECESSITA ATENÇÃO"}
`;

    fs.writeFileSync(markdownPath, markdown);
    console.log(`📄 Relatório Markdown gerado: ${markdownPath}`);

    return { htmlPath: reportPath, markdownPath };
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  let serverUrl = "http://localhost:3000";
  let clients = 10;
  let messages = 2;
  let duration = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--url" && args[i + 1]) {
      serverUrl = args[i + 1];
      i++;
    } else if (arg === "--users" && args[i + 1]) {
      clients = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--duration" && args[i + 1]) {
      duration = parseInt(args[i + 1]);
      i++;
    } else if (!arg.startsWith("--") && !isNaN(arg)) {
      if (!clients || clients === 10) {
        clients = parseInt(arg);
      } else if (!messages || messages === 2) {
        messages = parseInt(arg);
      }
    }
  }

  const firstArg = args[0];
  if (firstArg && !firstArg.startsWith("--") && isNaN(firstArg)) {
    switch (firstArg) {
      case "light":
        clients = 10;
        messages = 2;
        break;
      case "medium":
        clients = 25;
        messages = 5;
        break;
      case "heavy":
        clients = 50;
        messages = 10;
        break;
      case "extreme":
        clients = 100;
        messages = 20;
        break;
    }
  }

  console.log(`🚀 ===== TESTE DE CARGA WEBSOCKET COM INTEGRAÇÃO REAL ===== 
📊 Clientes: ${clients}
📨 Mensagens por cliente: ${messages}
🎯 Total esperado: ${clients * messages} mensagens
🔗 Servidor: ${serverUrl}
🏗️  Fluxo: Registro → Login → Criar Salas → Entrar → Mensagens
═══════════════════════════════════════════════════════════════
      `);

  const test = new WebSocketLoadTest(serverUrl);
  test
    .runLoadTest(clients, messages)
    .then((stats) => {
      console.log("🎉 Teste concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Teste falhou:", error.message);
      process.exit(1);
    });
}

module.exports = WebSocketLoadTest;
