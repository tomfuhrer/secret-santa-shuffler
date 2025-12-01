/**
 * Token Generation Utilities
 *
 * Provides cryptographically secure token generation for:
 * - Magic links (passwordless authentication)
 * - Session tokens
 * - Participant questionnaire tokens
 * - Generic secure IDs
 */

/**
 * Generates a cryptographically secure random hex string
 *
 * @param bytes - Number of random bytes (output will be 2x this length in hex)
 * @returns Hex-encoded random string
 */
export function generateSecureHex(bytes: number = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a secure token for magic links (64 characters / 32 bytes)
 *
 * @returns 64-character hex string
 */
export function generateMagicLinkToken(): string {
  return generateSecureHex(32);
}

/**
 * Generates a secure session token (64 characters / 32 bytes)
 *
 * @returns 64-character hex string
 */
export function generateSessionToken(): string {
  return generateSecureHex(32);
}

/**
 * Generates a secure token for participant questionnaire access (32 characters / 16 bytes)
 *
 * @returns 32-character hex string
 */
export function generateParticipantToken(): string {
  return generateSecureHex(16);
}

/**
 * Generates a secure unique ID for database records
 * Uses a combination of timestamp and randomness for sortability
 *
 * @returns 24-character ID (8 hex timestamp + 16 hex random)
 */
export function generateId(): string {
  const timestamp = Date.now().toString(16).padStart(12, "0");
  const random = generateSecureHex(6);
  return timestamp + random;
}

/**
 * Duration constants in milliseconds
 */
export const DURATIONS = {
  MAGIC_LINK_EXPIRY: 15 * 60 * 1000, // 15 minutes
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  RATE_LIMIT_WINDOW: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Duration constants in seconds (for database storage)
 */
export const DURATIONS_SECONDS = {
  MAGIC_LINK_EXPIRY: 15 * 60, // 15 minutes
  SESSION_EXPIRY: 7 * 24 * 60 * 60, // 7 days
  RATE_LIMIT_WINDOW: 60 * 60, // 1 hour
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  MAX_MAGIC_LINKS_PER_HOUR: 5,
} as const;

/**
 * Calculates expiration timestamp for magic links
 *
 * @returns Unix timestamp (seconds) when the magic link expires
 */
export function getMagicLinkExpiry(): number {
  return Math.floor(Date.now() / 1000) + DURATIONS_SECONDS.MAGIC_LINK_EXPIRY;
}

/**
 * Calculates expiration timestamp for sessions
 *
 * @returns Unix timestamp (seconds) when the session expires
 */
export function getSessionExpiry(): number {
  return Math.floor(Date.now() / 1000) + DURATIONS_SECONDS.SESSION_EXPIRY;
}

/**
 * Checks if a timestamp has expired
 *
 * @param expiresAt - Unix timestamp (seconds)
 * @returns true if the timestamp is in the past
 */
export function isExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt <= now;
}

/**
 * Gets the current Unix timestamp in seconds
 *
 * @returns Current Unix timestamp (seconds)
 */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Compares two strings in constant time to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Session cookie configuration
 */
export const SESSION_COOKIE_OPTIONS = {
  name: "santa_session",
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: DURATIONS_SECONDS.SESSION_EXPIRY,
};

/**
 * Validates email format
 *
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
export function isValidEmail(email: string): boolean {
  // Basic email regex - not overly strict
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Normalizes email address (lowercase, trim)
 *
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}