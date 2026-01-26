require("dotenv").config();

/**
 * Application configuration loaded from environment variables
 */
const config = {
  // Heroku requires binding to $PORT; fallback to custom COLLAB_PORT then 1234
  port: Number(process.env.PORT || process.env.COLLAB_PORT || 1234),
  host: process.env.COLLAB_HOST || "0.0.0.0",
  tokenSecret: process.env.COLLAB_TOKEN_SECRET || "your-collab-token-secret",
  maxConnectionsPerNote:
    Number(process.env.COLLAB_MAX_CONNECTIONS_PER_NOTE || 25) || 25,
  databaseUrl: process.env.DATABASE_URL,
  tableName: "yjs_updates",
};

module.exports = config;
