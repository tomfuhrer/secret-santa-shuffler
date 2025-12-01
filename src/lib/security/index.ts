// Security module - token generation and session management

export {
  generateSecureHex,
  generateMagicLinkToken,
  generateSessionToken,
  generateParticipantToken,
  generateId,
  DURATIONS,
  DURATIONS_SECONDS,
  RATE_LIMITS,
  getMagicLinkExpiry,
  getSessionExpiry,
  isExpired,
  nowUnix,
  constantTimeCompare,
  SESSION_COOKIE_OPTIONS,
  isValidEmail,
  normalizeEmail,
} from "./tokens";

export {
  validateSession,
  getAuthUser,
  requireAuth,
  getSessionToken,
  clearSessionCookie,
  setSessionCookie,
  maybeExtendSession,
  isSessionValid,
  getSessionTimeRemaining,
  getSessionTimeRemainingHuman,
} from "./session";

export type { AuthUser, SessionResult } from "./session";