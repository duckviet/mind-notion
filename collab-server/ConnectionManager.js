const logger = require("./logger");

/**
 * Manages WebSocket connections per note
 */
class ConnectionManager {
  constructor() {
    this.connectionsByNote = new Map();
  }

  /**
   * Increments connection count for a note
   * @param {string} noteId - The note identifier
   * @returns {number} New connection count
   */
  increment(noteId) {
    const count = (this.connectionsByNote.get(noteId) || 0) + 1;
    this.connectionsByNote.set(noteId, count);
    logger.debug(`Note ${noteId}: ${count} active connections`);
    return count;
  }

  /**
   * Decrements connection count for a note
   * @param {string} noteId - The note identifier
   */
  decrement(noteId) {
    const count = Math.max((this.connectionsByNote.get(noteId) || 1) - 1, 0);
    if (count === 0) {
      this.connectionsByNote.delete(noteId);
      logger.debug(`Note ${noteId}: No active connections`);
    } else {
      this.connectionsByNote.set(noteId, count);
      logger.debug(`Note ${noteId}: ${count} active connections`);
    }
  }

  /**
   * Gets current connection count for a note
   * @param {string} noteId - The note identifier
   * @returns {number} Current connection count
   */
  getCount(noteId) {
    return this.connectionsByNote.get(noteId) || 0;
  }
}

module.exports = ConnectionManager;
