import { component$ } from "@builder.io/qwik";
import {
  routeAction$,
  Form,
  zod$,
  z,
  type DocumentHead,
  Link,
} from "@builder.io/qwik-city";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { TreeIcon } from "~/components/icons";
import { useRequireAuth } from "../layout";
import { generateId } from "~/lib/security";
import { createExchange } from "~/lib/db";
import type { Env } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

/**
 * Form validation schema for creating an exchange
 */
const createExchangeSchema = z.object({
  title: z
    .string()
    .min(1, "Exchange title is required")
    .max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  budget_min: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : null))
    .refine((val) => val === null || val >= 0, "Budget must be positive"),
  budget_max: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : null))
    .refine((val) => val === null || val >= 0, "Budget must be positive"),
  exchange_date: z
    .string()
    .optional()
    .transform((val) => val || null),
}).refine(
  (data) => {
    if (data.budget_min !== null && data.budget_max !== null) {
      return data.budget_min <= data.budget_max;
    }
    return true;
  },
  {
    message: "Minimum budget cannot be greater than maximum",
    path: ["budget_min"],
  }
);

/**
 * Server action to create a new exchange
 */
export const useCreateExchange = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      return {
        success: false,
        error: getDbUnavailableMessage(),
      };
    }

    // Get authenticated user from session cookie
    const { requireAuth } = await import("~/lib/security");
    
    try {
      const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
      
      // Generate unique exchange ID
      const exchangeId = generateId();

      // Create the exchange
      await createExchange(db, {
        id: exchangeId,
        organizer_id: user.id,
        title: data.title,
        description: data.description || null,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        exchange_date: data.exchange_date,
        status: "draft",
      });

      // Redirect to the new exchange's detail page
      throw requestEvent.redirect(302, `/exchanges/${exchangeId}`);
    } catch (error) {
      // Re-throw redirects
      if (error instanceof Response) {
        throw error;
      }

      logDbError("CreateExchange", error);
      const { userMessage } = getDbErrorMessage(error);
      return {
        success: false,
        error: userMessage,
      };
    }
  },
  zod$(createExchangeSchema)
);

export default component$(() => {
  const action = useCreateExchange();
  useRequireAuth(); // Ensure user is authenticated

  const isSubmitting = action.isRunning;
  const errorMessage = action.value?.success === false ? action.value.error : null;

  return (
    <div class="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        class="inline-flex items-center text-gray-600 hover:text-forest-green mb-6 transition-colors"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div class="text-center mb-8">
        <TreeIcon size={48} class="mx-auto mb-4 text-forest-green" />
        <h1 class="text-3xl md:text-4xl mb-2">Create a New Exchange</h1>
        <p class="text-gray-600">
          Set up your Secret Santa gift exchange in just a few steps
        </p>
      </div>

      <Card variant="festive">
        <CardHeader>
          <CardTitle class="text-xl">Exchange Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form action={action} class="space-y-6">
            {/* Exchange Title */}
            <Input
              id="title"
              name="title"
              type="text"
              label="Exchange Title"
              placeholder="e.g., Smith Family Christmas 2024"
              required
              error={action.value?.fieldErrors?.title?.[0]}
            />

            {/* Description */}
            <Textarea
              id="description"
              name="description"
              label="Description (optional)"
              placeholder="Add any notes or details for participants..."
              rows={3}
              maxlength={500}
              error={action.value?.fieldErrors?.description?.[0]}
            />

            {/* Budget Range */}
            <div>
              <label class="input-label">Budget Range (optional)</label>
              <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    id="budget_min"
                    name="budget_min"
                    type="number"
                    min="0"
                    placeholder="Min"
                    class={[
                      "w-full pl-7 pr-4 py-2 rounded-lg border-2 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-forest-green/20",
                      action.value?.fieldErrors?.budget_min
                        ? "border-christmas-red focus:border-christmas-red"
                        : "border-gray-200 focus:border-forest-green",
                    ].join(" ")}
                  />
                </div>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    id="budget_max"
                    name="budget_max"
                    type="number"
                    min="0"
                    placeholder="Max"
                    class={[
                      "w-full pl-7 pr-4 py-2 rounded-lg border-2 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-forest-green/20",
                      action.value?.fieldErrors?.budget_max
                        ? "border-christmas-red focus:border-christmas-red"
                        : "border-gray-200 focus:border-forest-green",
                    ].join(" ")}
                  />
                </div>
              </div>
              {action.value?.fieldErrors?.budget_min && (
                <p class="input-error mt-1">{action.value.fieldErrors.budget_min[0]}</p>
              )}
              {action.value?.fieldErrors?.budget_max && (
                <p class="input-error mt-1">{action.value.fieldErrors.budget_max[0]}</p>
              )}
              <p class="text-sm text-gray-500 mt-1">
                Suggest a spending range for gifts
              </p>
            </div>

            {/* Exchange Date */}
            <Input
              id="exchange_date"
              name="exchange_date"
              type="date"
              label="Gift Exchange Date (optional)"
              error={action.value?.fieldErrors?.exchange_date?.[0]}
            />

            {/* Form error message */}
            {errorMessage && (
              <div class="bg-christmas-red/10 text-christmas-red rounded-lg p-3 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <div class="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                class="flex-1"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Exchange"}
              </Button>
              <Link href="/dashboard" class="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  class="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Help text */}
      <p class="text-center text-sm text-gray-500 mt-6">
        After creating your exchange, you'll be able to add participants and send invitations.
      </p>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Create Exchange - Secret Santa Shuffler",
  meta: [
    {
      name: "description",
      content: "Create a new Secret Santa gift exchange.",
    },
  ],
};
