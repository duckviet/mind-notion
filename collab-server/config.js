require("dotenv").config();

/**
 * Application configuration loaded from environment variables
 */
const config = {
  port: Number(process.env.COLLAB_PORT || 1234),
  host: process.env.COLLAB_HOST || "0.0.0.0",
  tokenSecret: process.env.COLLAB_TOKEN_SECRET || "your-collab-token-secret",
  maxConnectionsPerNote:
    Number(process.env.COLLAB_MAX_CONNECTIONS_PER_NOTE || 25) || 25,
  databaseUrl: process.env.DATABASE_URL,
  tableName: "yjs_updates",
};

module.exports = config;
