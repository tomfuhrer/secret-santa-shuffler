import { component$, Slot } from "@builder.io/qwik";
import { routeLoader$, type RequestHandler } from "@builder.io/qwik-city";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import { ToastProvider } from "~/components/ui/toast";
import { SnowfallCSS } from "~/components/ui/snowfall";
import { getAuthUser } from "~/lib/security";
import type { Env } from "~/lib/db/types";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce costs
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

// Loader to get current authenticated user
export const useAuthUser = routeLoader$(async (requestEvent) => {
  // In development mode, platform.env may not be available
  const env = requestEvent.platform?.env as Env | undefined;
  const db = env?.DB;

  // If database is not available (e.g., in dev mode without wrangler), return not logged in
  if (!db) {
    console.warn("[Layout] Database not available - running without auth");
    return {
      isLoggedIn: false,
      userId: null,
      email: null,
      name: null,
    };
  }

  try {
    const user = await getAuthUser(db, requestEvent.cookie);
    
    if (user) {
      return {
        isLoggedIn: true,
        userId: user.id,
        email: user.email,
        name: user.name,
      };
    }
  } catch (error) {
    // Log but don't fail - just treat as not logged in
    console.error("[Layout] Error getting auth user:", error);
  }

  return {
    isLoggedIn: false,
    userId: null,
    email: null,
    name: null,
  };
});

export default component$(() => {
  const authUser = useAuthUser();
  
  const isLoggedIn = authUser.value.isLoggedIn;
  const userName = authUser.value.name ?? undefined;

  return (
    <ToastProvider>
      <div class="flex flex-col min-h-screen bg-cream relative">
        {/* Snowfall background effect */}
        <SnowfallCSS />
        
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-christmas-red focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
        >
          Skip to main content
        </a>
        
        <Header isLoggedIn={isLoggedIn} userName={userName} />
        
        <main id="main-content" class="flex-1 relative z-10" role="main">
          <Slot />
        </main>
        
        <Footer />
      </div>
    </ToastProvider>
  );
});