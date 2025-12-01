import { component$, useSignal, useTask$, $ } from "@builder.io/qwik";
import {
  routeAction$,
  Form,
  zod$,
  z,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FestiveGnome } from "~/components/ui/festive-gnome";
import { SparklesIcon, MailIcon } from "~/components/icons";
import {
  generateId,
  generateMagicLinkToken,
  getMagicLinkExpiry,
  normalizeEmail,
  isValidEmail,
  RATE_LIMITS,
  DURATIONS_SECONDS,
} from "~/lib/security";
import {
  findOrganizerByEmail,
  createMagicLink,
  countRecentMagicLinks,
} from "~/lib/db";
import { createEmailServiceFromEnv } from "~/lib/email";
import type { Env } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Server action to send magic link
export const useSendMagicLink = routeAction$(
  async (data, requestEvent) => {
    // In development mode, platform.env may not be available
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;

    // If database is not available, return an error
    if (!db) {
      console.warn("[Login] Database not available - cannot send magic link");
      return {
        success: false,
        error: getDbUnavailableMessage(),
      };
    }

    // Normalize and validate email
    const email = normalizeEmail(data.email);

    if (!isValidEmail(email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    try {
      // Check rate limit
      const recentCount = await countRecentMagicLinks(
        db,
        email,
        DURATIONS_SECONDS.RATE_LIMIT_WINDOW
      );

      if (recentCount >= RATE_LIMITS.MAX_MAGIC_LINKS_PER_HOUR) {
        return {
          success: false,
          error:
            "Too many sign-in attempts. Please wait a while before trying again.",
        };
      }

      // Check if organizer already exists (for logging/tracking purposes)
      const existingOrganizer = await findOrganizerByEmail(db, email);

      // Generate magic link token
      const token = generateMagicLinkToken();
      const expiresAt = getMagicLinkExpiry();

      // Create magic link in database
      await createMagicLink(db, {
        id: generateId(),
        organizer_id: existingOrganizer?.id ?? null,
        email,
        token,
        expires_at: expiresAt,
      });

      // Send magic link email
      const emailService = createEmailServiceFromEnv(env, requestEvent.url);
      const result = await emailService.sendMagicLink({
        email,
        token,
        expiresInMinutes: 15,
      });

      if (!result.success) {
        console.error("[Login] Failed to send magic link email:", result.error);
        return {
          success: false,
          error: "Failed to send sign-in email. Please try again.",
        };
      }

      console.log(`[Login] Magic link sent to ${email}`);

      return {
        success: true,
        email: email,
        message: "Check your email for a magic sign-in link!",
      };
    } catch (error) {
      logDbError("Login", error);
      const { userMessage } = getDbErrorMessage(error);
      return {
        success: false,
        error: userMessage,
      };
    }
  },
  zod$(loginSchema)
);

export default component$(() => {
  const action = useSendMagicLink();
  const emailValue = useSignal("");
  const showForm = useSignal(true);
  const sentToEmail = useSignal("");

  // Track when action completes successfully to show success UI
  useTask$(({ track }) => {
    const actionValue = track(() => action.value);
    if (actionValue?.success) {
      showForm.value = false;
      sentToEmail.value = (actionValue as { email?: string }).email ?? emailValue.value;
    }
  });

  const isSubmitting = action.isRunning;
  const errorMessage =
    action.value?.success === false ? action.value.error : null;

  const handleTryAgain = $(() => {
    showForm.value = true;
  });

  return (
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        {/* Header */}
        <div class="text-center mb-8">
          <FestiveGnome variant="classic" size="lg" class="mb-4" />
          <h1 class="text-3xl md:text-4xl mb-2">Welcome!</h1>
          <p class="text-gray-600">
            Sign in to manage your Secret Santa exchanges
          </p>
        </div>

        <Card variant="festive">
          <CardContent>
            {!showForm.value ? (
              /* Success State */
              <div class="text-center py-6">
                <SparklesIcon size={48} class="mx-auto mb-4 text-gold" />
                <h2 class="text-xl font-bold text-forest-green mb-2">
                  Check Your Email!
                </h2>
                <p class="text-gray-600 mb-4">
                  We've sent a magic sign-in link to{" "}
                  <strong class="text-gray-800">{sentToEmail.value}</strong>
                </p>
                <div class="bg-cream rounded-lg p-4 text-sm text-gray-600">
                  <p class="mb-2 flex items-center justify-center gap-2">
                    <MailIcon size={16} class="text-forest-green" />
                    The link will expire in <strong>15 minutes</strong>
                  </p>
                  <p>
                    Can't find it? Check your spam folder or{" "}
                    <button
                      type="button"
                      class="text-forest-green underline hover:text-forest-green-dark"
                      onClick$={handleTryAgain}
                    >
                      try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* Login Form */
              <Form action={action} class="space-y-6">
                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="santa@northpole.com"
                    required
                    autocomplete="email"
                    value={emailValue.value}
                    onInput$={(value) => {
                      emailValue.value = value;
                    }}
                    error={
                      action.value?.fieldErrors?.email?.[0] ?? undefined
                    }
                  />
                </div>

                {/* Server error message */}
                {errorMessage && (
                  <div class="bg-christmas-red/10 text-christmas-red rounded-lg p-3 text-sm">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  class="w-full"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Sending Magic Link..."
                  ) : (
                    <>
                      Send Magic Link
                      <SparklesIcon size={16} />
                    </>
                  )}
                </Button>

                <p class="text-center text-sm text-gray-500">
                  We'll send you a secure sign-in link.
                  <br />
                  No password needed!
                </p>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <p class="text-center text-sm text-gray-500 mt-6">
          New here? We'll create your account automatically.
        </p>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sign In - Secret Santa Shuffler",
  meta: [
    {
      name: "description",
      content:
        "Sign in to Secret Santa Shuffler to create and manage your gift exchange events.",
    },
  ],
};