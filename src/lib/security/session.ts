/**
 * Session Management Utilities
 *
 * Provides functions for validating and managing user sessions.
 * Sessions are stored as HTTP-only cookies and validated against the database.
 */

import type { Cookie } from "@builder.io/qwik-city";
import type { D1Database, Organizer, Session } from "../db/types";
import {
  findValidSessionByToken,
  findOrganizerById,
  deleteSessionByToken,
  extendSession,
} from "../db/queries";
import {
  SESSION_COOKIE_OPTIONS,
  getSessionExpiry,
  isExpired,
  DURATIONS_SECONDS,
} from "./tokens";

/**
 * Authenticated user data returned from session validation
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  sessionId: string;
}

/**
 * Result of session validation
 */
export type SessionResult =
  | { authenticated: true; user: AuthUser }
  | { authenticated: false; user: null };

/**
 * Get the session token from cookies
 */
export function getSessionToken(cookie: Cookie): string | null {
  const sessionCookie = cookie.get(SESSION_COOKIE_OPTIONS.name);
  return sessionCookie?.value ?? null;
}

/**
 * Validate a session and get the authenticated user
 *
 * @param db - D1 database instance
 * @param cookie - Cookie accessor from request event
 * @returns SessionResult with user data if authenticated
 */
export async function validateSession(
  db: D1Database,
  cookie: Cookie
): Promise<SessionResult> {
  const token = getSessionToken(cookie);

  if (!token) {
    return { authenticated: false, user: null };
  }

  try {
    const session = await findValidSessionByToken(db, token);

    if (!session) {
      return { authenticated: false, user: null };
    }

    const organizer = await findOrganizerById(db, session.organizer_id);

    if (!organizer) {
      // Session exists but organizer doesn't - clean up
      await deleteSessionByToken(db, token);
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: {
        id: organizer.id,
        email: organizer.email,
        name: organizer.name,
        sessionId: session.id,
      },
    };
  } catch (error) {
    console.error("[Session] Error validating session:", error);
    return { authenticated: false, user: null };
  }
}

/**
 * Get the authenticated user from session, or null if not authenticated
 *
 * @param db - D1 database instance
 * @param cookie - Cookie accessor from request event
 * @returns AuthUser if authenticated, null otherwise
 */
export async function getAuthUser(
  db: D1Database,
  cookie: Cookie
): Promise<AuthUser | null> {
  const result = await validateSession(db, cookie);
  return result.authenticated ? result.user : null;
}

/**
 * Require authentication - throws redirect if not authenticated
 *
 * @param db - D1 database instance
 * @param cookie - Cookie accessor from request event
 * @param redirectTo - URL to redirect to if not authenticated
 * @returns AuthUser if authenticated
 * @throws Response redirect if not authenticated
 */
export async function requireAuth(
  db: D1Database,
  cookie: Cookie,
  redirectTo: string = "/auth/login"
): Promise<AuthUser> {
  const user = await getAuthUser(db, cookie);

  if (!user) {
    throw new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
      },
    });
  }

  return user;
}

/**
 * Clear the session cookie
 *
 * @param cookie - Cookie accessor from request event
 */
export function clearSessionCookie(cookie: Cookie): void {
  cookie.delete(SESSION_COOKIE_OPTIONS.name, {
    path: SESSION_COOKIE_OPTIONS.path,
  });
}

/**
 * Set the session cookie with a token
 *
 * @param cookie - Cookie accessor from request event
 * @param token - Session token to set
 * @param secure - Whether to set the secure flag (true for HTTPS)
 */
export function setSessionCookie(
  cookie: Cookie,
  token: string,
  secure: boolean = true
): void {
  cookie.set(SESSION_COOKIE_OPTIONS.name, token, {
    httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
    secure,
    sameSite: SESSION_COOKIE_OPTIONS.sameSite,
    path: SESSION_COOKIE_OPTIONS.path,
    maxAge: SESSION_COOKIE_OPTIONS.maxAge,
  });
}

/**
 * Extend a session's expiration if it's approaching expiry
 * This provides a "rolling session" that stays active while user is active
 *
 * @param db - D1 database instance
 * @param session - Current session
 * @param cookie - Cookie accessor from request event
 * @param secure - Whether to set the secure flag
 * @param thresholdDays - Days before expiry to trigger extension (default: 1)
 */
export async function maybeExtendSession(
  db: D1Database,
  session: Session,
  cookie: Cookie,
  secure: boolean = true,
  thresholdDays: number = 1
): Promise<void> {
  const thresholdSeconds = thresholdDays * 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = session.expires_at - now;

  // Only extend if session will expire within threshold
  if (timeUntilExpiry < thresholdSeconds) {
    const newExpiry = getSessionExpiry();

    await extendSession(db, session.id, newExpiry);

    // Update cookie with new expiry
    setSessionCookie(cookie, session.token, secure);

    console.log(`[Session] Extended session ${session.id}`);
  }
}

/**
 * Check if a session is still valid (not expired)
 */
export function isSessionValid(session: Session): boolean {
  return !isExpired(session.expires_at);
}

/**
 * Get remaining session time in seconds
 */
export function getSessionTimeRemaining(session: Session): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, session.expires_at - now);
}

/**
 * Get remaining session time as a human-readable string
 */
export function getSessionTimeRemainingHuman(session: Session): string {
  const seconds = getSessionTimeRemaining(session);

  if (seconds === 0) {
    return "Expired";
  }

  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}