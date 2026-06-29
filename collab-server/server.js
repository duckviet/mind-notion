const http = require("http");
const Y = require("yjs");
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

    const connectionOptions = {
      connectionString: config.databaseUrl,
    };

    if (config.databaseUrl && !config.databaseUrl.includes("localhost") && !config.databaseUrl.includes("127.0.0.1") && !config.databaseUrl.includes("sslmode=disable")) {
      connectionOptions.ssl = {
        rejectUnauthorized: false,
      };
    }

    // Initialize persistence
    const persistence = await PostgresqlPersistence.build(
      connectionOptions,
      { tableName: config.tableName },
    );
    logger.info(
      `PostgreSQL persistence initialized with table: ${config.tableName}`,
    );

    // Wire persistence into y-websocket so Yjs docs are:
    //   1. Persisted to PostgreSQL (updates stored incrementally)
    //   2. Destroyed from memory when all connections close
    // Without this, the module-level persistence stays null, in-memory
    // Yjs docs live forever, and stale doc state overrides fresh
    // note content after UpdateContentWithVersion clears yjs_updates.
    const yUtils = require("y-websocket/bin/utils");
    global.loadingDocs = new Map();
    yUtils.setPersistence({
      bindState: (docName, ydoc) => {
        const promise = (async () => {
          const persistedYdoc = await persistence.getYDoc(docName);
          const newUpdates = Y.encodeStateAsUpdate(ydoc);
          await persistence.storeUpdate(docName, newUpdates);
          Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
          ydoc.on("update", async (update) => {
            await persistence.storeUpdate(docName, update);
          });
        })();
        global.loadingDocs.set(docName, promise);
        promise.finally(() => {
          global.loadingDocs.delete(docName);
        });
        return promise;
      },
      writeState: async () => {
        // Updates are stored incrementally via the on("update") handler
        // in bindState — no explicit flush needed on disconnect.
      },
    });

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
      handleConnection(conn, req, connectionManager);
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
