/**
 * Centralized logging utility with different log levels
 */
const logger = {
  /**
   * Log info level message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments
   */
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),

  /**
   * Log error level message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments
   */
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),

  /**
   * Log warning level message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments
   */
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),

  /**
   * Log debug level message
   * @param {string} message - The message to log
   * @param  {...any} args - Additional arguments
   */
  debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args),
};

module.exports = logger;
