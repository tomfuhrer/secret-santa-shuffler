import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { requireAuth } from "~/lib/security";
import type { Env } from "~/lib/db/types";

/**
 * Protected layout for dashboard routes
 * 
 * This layout acts as an auth guard - it validates the user's session
 * and redirects to the login page if they're not authenticated.
 * 
 * All routes under /dashboard will require authentication.
 */

// Auth guard loader - runs before the page renders
export const useRequireAuth = routeLoader$(async (requestEvent) => {
  // In development mode, platform.env may not be available
  const env = requestEvent.platform?.env as Env | undefined;
  const db = env?.DB;

  // If database is not available, redirect to login
  if (!db) {
    console.warn("[Dashboard] Database not available - redirecting to login");
    throw requestEvent.redirect(302, "/auth/login");
  }

  try {
    // requireAuth will throw a redirect if not authenticated
    const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    // Re-throw redirects
    if (error instanceof Response) {
      throw error;
    }
    
    // For any other error, redirect to login
    console.error("[Dashboard] Auth error:", error);
    throw requestEvent.redirect(302, "/auth/login");
  }
});

export default component$(() => {
  // The loader has already validated auth - if we're here, user is authenticated
  // The loader runs and validates, but we don't need the user data in the layout
  useRequireAuth();

  return (
    <div class="min-h-[calc(100vh-180px)]">
      {/* Dashboard content wrapper */}
      <div class="max-w-6xl mx-auto px-4 py-8">
        <Slot />
      </div>
    </div>
  );
});