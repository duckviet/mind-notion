const jwt = require("jsonwebtoken");
const config = require("./config");
const logger = require("./logger");

/**
 * Verifies JWT token and validates note ID claim
 * @param {string} token - The JWT token to verify
 * @param {string} noteId - The expected note ID
 * @returns {object} The decoded token claims
 * @throws {Error} If token is invalid or note ID doesn't match
 */
function verifyToken(token, noteId) {
  try {
    const claims = jwt.verify(token, config.tokenSecret);

    if (!claims?.note_id) {
      throw new Error("Token missing note_id claim");
    }

    if (claims.note_id !== noteId) {
      throw new Error("Note ID mismatch");
    }

    return claims;
  } catch (err) {
    logger.warn(`Token verification failed: ${err.message}`);
    throw err;
  }
}

/**
 * Validates required environment variables
 * @throws {Error} If any required variable is missing
 */
function validateEnvironment() {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  if (config.tokenSecret === "your-collab-token-secret") {
    logger.warn(
      "Using default token secret. Set COLLAB_TOKEN_SECRET in production!",
    );
  }
}

module.exports = {
  verifyToken,
  validateEnvironment,
};
