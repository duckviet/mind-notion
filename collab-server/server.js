const http = require("http");
const { WebSocketServer } = require("ws");
const { PostgresqlPersistence } = require("y-postgresql");

const config = require("./config");
const logger = require("./logger");
const ConnectionManager = require("./ConnectionManager");
const { validateEnvironment } = require("./auth");
const { handleConnection } = require("./wsHandler");

// ==================== Server Initialization ====================
/**
 * Initializes and starts the collaboration server
 */
async function startServer() {
  try {
    // Validate environment
    validateEnvironment();

    // Initialize persistence
    const persistence = new PostgresqlPersistence(config.databaseUrl, {
      tableName: config.tableName,
    });
    logger.info(
      `PostgreSQL persistence initialized with table: ${config.tableName}`,
    );

    // Initialize connection manager
    const connectionManager = new ConnectionManager();

    // Create HTTP server
    const server = http.createServer((request, response) => {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("Collab Server is running");
    });

    // Create WebSocket server
    const wss = new WebSocketServer({ server });

    // Handle WebSocket connections
    wss.on("connection", (conn, req) => {
      handleConnection(conn, req, connectionManager, persistence);
    });

    // Start listening
    server.listen(config.port, config.host, () => {
      logger.info(
        `Collab server listening on ws://${config.host}:${config.port}`,
      );
      logger.info(`Max connections per note: ${config.maxConnectionsPerNote}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");

      wss.clients.forEach((client) => {
        client.close(1001, "server_shutdown");
      });

      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// ==================== Start Server ====================
startServer();
