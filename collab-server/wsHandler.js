const { setupWSConnection } = require("y-websocket/bin/utils");
const { getNoteIdFromRequest, getTokenFromRequest } = require("./utils");
const { verifyToken } = require("./auth");
const config = require("./config");
const logger = require("./logger");

/**
 * Handles new WebSocket connections
 * @param {WebSocket} conn - The WebSocket connection
 * @param {http.IncomingMessage} req - The HTTP request
 * @param {ConnectionManager} connectionManager - The connection manager instance
 * @param {PostgresqlPersistence} persistence - The persistence instance
 */
function handleConnection(conn, req, connectionManager, persistence) {
  const noteId = getNoteIdFromRequest(req);

  // Validate note ID
  if (!noteId) {
    logger.warn("Connection rejected: Missing note ID");
    conn.close(1008, "missing_note_id");
    return;
  }

  // Validate token
  const token = getTokenFromRequest(req);
  if (!token) {
    logger.warn(`Connection rejected for note ${noteId}: Missing token`);
    conn.close(1008, "missing_token");
    return;
  }

  // Verify token
  try {
    verifyToken(token, noteId);
  } catch (err) {
    logger.warn(`Connection rejected for note ${noteId}: Invalid token`);
    conn.close(1008, "invalid_token");
    return;
  }

  // Check connection limit
  const currentConnections = connectionManager.increment(noteId);
  if (currentConnections > config.maxConnectionsPerNote) {
    connectionManager.decrement(noteId);
    logger.warn(
      `Connection rejected for note ${noteId}: Connection limit reached (${config.maxConnectionsPerNote})`,
    );
    conn.close(1013, "connection_limit");
    return;
  }

  logger.info(
    `Client connected to note ${noteId} (${currentConnections}/${config.maxConnectionsPerNote})`,
  );

  // Setup Yjs WebSocket connection
  setupWSConnection(conn, req, {
    persistence,
    docName: noteId,
  });

  // Handle disconnection
  conn.on("close", () => {
    connectionManager.decrement(noteId);
    logger.info(`Client disconnected from note ${noteId}`);
  });
}

module.exports = { handleConnection };
