/**
 * Cookie utilities for secure cookie handling
 * Best practices from large-scale web applications
 */

export interface CookieOptions {
  maxAge?: number; // in seconds
  expires?: Date;
  httpOnly?: boolean; // Note: Cannot be set from client-side JavaScript
  secure?: boolean; // Only send over HTTPS
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  domain?: string;
}

/**
 * Set cookie from client-side (limited security)
 * For production, cookies should be set from server-side API routes
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const {
    maxAge,
    expires,
    secure = process.env.NODE_ENV === "production", // Secure in production
    sameSite = "Lax",
    path = "/",
    domain,
  } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}`;

  if (maxAge) {
    cookieString += `; Max-Age=${maxAge}`;
  }

  if (expires) {
    cookieString += `; Expires=${expires.toUTCString()}`;
  }

  if (path) {
    cookieString += `; Path=${path}`;
  }

  if (domain) {
    cookieString += `; Domain=${domain}`;
  }

  if (secure) {
    cookieString += `; Secure`;
  }

  cookieString += `; SameSite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const cookie = cookies.find((row) => row.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

/**
 * Remove cookie
 */
export function removeCookie(
  name: string,
  options: { path?: string; domain?: string } = {}
): void {
  if (typeof document === "undefined") return;

  const { path = "/", domain } = options;
  let cookieString = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=${path}`;

  if (domain) {
    cookieString += `; Domain=${domain}`;
  }

  document.cookie = cookieString;
}
