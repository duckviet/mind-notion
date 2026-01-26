const url = require("url");

/**
 * Extracts note ID from request URL
 * @param {http.IncomingMessage} req - The HTTP request
 * @returns {string} The note ID or empty string
 */
function getNoteIdFromRequest(req) {
  const { pathname } = url.parse(req.url || "", true);
  if (!pathname) return "";
  return decodeURIComponent(pathname.replace(/^\/+/, ""));
}

/**
 * Extracts authentication token from request query
 * @param {http.IncomingMessage} req - The HTTP request
 * @returns {string} The token or empty string
 */
function getTokenFromRequest(req) {
  const { query } = url.parse(req.url || "", true);
  return query?.token || "";
}

module.exports = {
  getNoteIdFromRequest,
  getTokenFromRequest,
};
