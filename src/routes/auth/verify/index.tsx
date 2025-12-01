import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  generateId,
  generateSessionToken,
  getSessionExpiry,
  SESSION_COOKIE_OPTIONS,
} from "~/lib/security";
import {
  findValidMagicLinkByToken,
  markMagicLinkAsUsed,
  findOrCreateOrganizer,
  createSession,
} from "~/lib/db";
import type { Env } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

// Verification result type
interface VerificationResult {
  success: boolean;
  error?: string;
  organizerName?: string | null;
  isNewUser?: boolean;
}

// Server loader to verify magic link and create session
export const useVerifyMagicLink = routeLoader$<VerificationResult>(
  async (requestEvent) => {
    // In development mode, platform.env may not be available
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;

    // If database is not available, return an error
    if (!db) {
      console.warn("[Verify] Database not available - cannot verify magic link");
      return {
        success: false,
        error: getDbUnavailableMessage(),
      };
    }

    // Get token from query string
    const token = requestEvent.url.searchParams.get("token");

    if (!token) {
      return {
        success: false,
        error: "Missing verification token. Please request a new sign-in link.",
      };
    }

    try {
      // Find valid (unused, not expired) magic link
      const magicLink = await findValidMagicLinkByToken(db, token);

      if (!magicLink) {
        return {
          success: false,
          error:
            "This sign-in link is invalid or has expired. Please request a new one.",
        };
      }

      // Mark magic link as used (single-use)
      await markMagicLinkAsUsed(db, magicLink.id);

      // Find or create organizer
      const { organizer, created } = await findOrCreateOrganizer(db, {
        id: generateId(),
        email: magicLink.email,
        name: null,
      });

      // Create session
      const sessionToken = generateSessionToken();
      const sessionExpiry = getSessionExpiry();

      await createSession(db, {
        id: generateId(),
        organizer_id: organizer.id,
        token: sessionToken,
        expires_at: sessionExpiry,
      });

      // Set session cookie
      requestEvent.cookie.set(
        SESSION_COOKIE_OPTIONS.name,
        sessionToken,
        {
          httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
          secure: requestEvent.url.protocol === "https:",
          sameSite: SESSION_COOKIE_OPTIONS.sameSite,
          path: SESSION_COOKIE_OPTIONS.path,
          maxAge: SESSION_COOKIE_OPTIONS.maxAge,
        }
      );

      console.log(
        `[Verify] Session created for ${organizer.email} (${created ? "new user" : "existing user"})`
      );

      // Redirect to dashboard
      throw requestEvent.redirect(302, "/dashboard/");

    } catch (error) {
      // Re-throw redirects
      if (error instanceof Response) {
        throw error;
      }

      logDbError("Verify", error);
      const { userMessage } = getDbErrorMessage(error);
      return {
        success: false,
        error: userMessage,
      };
    }
  }
);

export default component$(() => {
  const verificationResult = useVerifyMagicLink();
  const { success, error } = verificationResult.value;

  // If successful, the loader redirects to dashboard
  // This component only renders on error
  return (
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <Card variant="festive">
          <CardContent>
            {success ? (
              /* Success state (shouldn't normally render due to redirect) */
              <div class="text-center py-6">
                <div class="text-5xl mb-4">✅</div>
                <h2 class="text-xl font-bold text-forest-green mb-2">
                  You're Signed In!
                </h2>
                <p class="text-gray-600 mb-6">
                  Redirecting you to your dashboard...
                </p>
                <Link href="/dashboard">
                  <Button variant="secondary">Go to Dashboard</Button>
                </Link>
              </div>
            ) : (
              /* Error state */
              <div class="text-center py-6">
                <div class="text-5xl mb-4">😔</div>
                <h2 class="text-xl font-bold text-christmas-red mb-2">
                  Sign-In Failed
                </h2>
                <p class="text-gray-600 mb-6">{error}</p>

                <div class="space-y-3">
                  <Link href="/auth/login" class="block">
                    <Button variant="secondary" class="w-full">
                      Request New Sign-In Link
                    </Button>
                  </Link>
                  <Link href="/" class="block">
                    <Button variant="ghost" class="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>

                {/* Help text */}
                <div class="mt-6 bg-cream rounded-lg p-4 text-sm text-gray-600">
                  <p class="font-medium mb-2">💡 Troubleshooting Tips</p>
                  <ul class="text-left space-y-1">
                    <li>• Magic links expire after 15 minutes</li>
                    <li>• Each link can only be used once</li>
                    <li>• Make sure to use the most recent link</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Verifying Sign-In - Secret Santa Shuffler",
  meta: [
    {
      name: "description",
      content: "Verifying your magic sign-in link for Secret Santa Shuffler.",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};