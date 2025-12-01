import { type RequestHandler } from "@builder.io/qwik-city";
import { SESSION_COOKIE_OPTIONS } from "~/lib/security";
import { deleteSessionByToken } from "~/lib/db";
import type { Env } from "~/lib/db/types";

/**
 * Logout handler
 * 
 * POST only - GET requests redirect without logging out (prevents prefetch issues)
 * - Deletes the session from the database
 * - Clears the session cookie
 * - Redirects to the home page
 */
export const onGet: RequestHandler = async (requestEvent) => {
  // Don't logout on GET - just redirect to home
  // This prevents Qwik's prefetching from logging users out
  throw requestEvent.redirect(302, "/");
};

export const onPost: RequestHandler = async (requestEvent) => {
  await handleLogout(requestEvent);
};

async function handleLogout(requestEvent: Parameters<RequestHandler>[0]) {
  // In development mode, platform.env may not be available
  const env = requestEvent.platform?.env as Env | undefined;
  const db = env?.DB;

  // Get session token from cookie
  const sessionToken = requestEvent.cookie.get(SESSION_COOKIE_OPTIONS.name)?.value;

  if (sessionToken && db) {
    try {
      // Delete session from database
      await deleteSessionByToken(db, sessionToken);
      console.log("[Logout] Session deleted from database");
    } catch (error) {
      // Log but don't fail - we still want to clear the cookie
      console.error("[Logout] Error deleting session:", error);
    }
  } else if (sessionToken && !db) {
    console.warn("[Logout] Database not available - session not deleted from DB");
  }

  // Clear the session cookie
  requestEvent.cookie.delete(SESSION_COOKIE_OPTIONS.name, {
    path: SESSION_COOKIE_OPTIONS.path,
  });

  console.log("[Logout] Session cookie cleared");

  // Redirect to home page
  throw requestEvent.redirect(302, "/");
}