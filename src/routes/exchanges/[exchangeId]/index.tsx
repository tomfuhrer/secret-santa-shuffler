import { component$, useSignal, $ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  Form,
  zod$,
  z,
  type DocumentHead,
  Link,
} from "@builder.io/qwik-city";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { FestiveGnome } from "~/components/ui/festive-gnome";
import {
  UsersIcon,
  MailIcon,
  PlusIcon,
  ShuffleIcon,
  AlertCircleIcon,
  EditIcon,
} from "~/components/icons";
import { useRequireAuth } from "../layout";
import {
  findExchangeByIdForOrganizer,
  listParticipantsByExchange,
  countCompletedQuestionnaires,
  createParticipant,
  findParticipantByExchangeAndEmail,
  updateParticipantEmail,
  deleteParticipant,
  updateExchangeStatus,
  findOrganizerById,
} from "~/lib/db";
import { generateId, generateParticipantToken, normalizeEmail, isValidEmail } from "~/lib/security";
import { createEmailServiceFromEnv } from "~/lib/email";
import type { Env, Exchange, Participant } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

/**
 * Exchange data with participants
 */
interface ExchangeData {
  exchange: Exchange;
  participants: Participant[];
  completedCount: number;
  organizerName: string | null;
}

/**
 * Load exchange data for the current user
 */
export const useExchangeData = routeLoader$(async (requestEvent) => {
  const env = requestEvent.platform?.env as Env | undefined;
  const db = env?.DB;
  const exchangeId = requestEvent.params.exchangeId;

  if (!db) {
    throw requestEvent.redirect(302, "/dashboard");
  }

  // Get user from parent loader
  const user = await requestEvent.resolveValue(useRequireAuth);

  // Fetch exchange ensuring it belongs to this organizer
  const exchange = await findExchangeByIdForOrganizer(db, exchangeId, user.id);

  if (!exchange) {
    // Exchange not found or doesn't belong to user
    throw requestEvent.redirect(302, "/dashboard");
  }

  // Fetch participants and completion count
  const [participants, completedCount] = await Promise.all([
    listParticipantsByExchange(db, exchangeId),
    countCompletedQuestionnaires(db, exchangeId),
  ]);

  return {
    exchange,
    participants,
    completedCount,
    organizerName: user.name,
  } as ExchangeData;
});

/**
 * Add participant validation schema
 */
const addParticipantSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().max(100, "Name must be 100 characters or less").optional(),
});

/**
 * Server action to add a participant
 */
export const useAddParticipant = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const exchangeId = requestEvent.params.exchangeId;

    if (!db) {
      return { success: false, error: getDbUnavailableMessage() };
    }

    const { requireAuth } = await import("~/lib/security");
    
    try {
      const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
      
      // Verify exchange belongs to user
      const exchange = await findExchangeByIdForOrganizer(db, exchangeId, user.id);
      if (!exchange) {
        return { success: false, error: "Exchange not found." };
      }

      // Can only add participants in draft or collecting status
      if (exchange.status !== "draft" && exchange.status !== "collecting") {
        return { success: false, error: "Cannot add participants after shuffling." };
      }

      const email = normalizeEmail(data.email);

      // Check if participant already exists
      const existing = await findParticipantByExchangeAndEmail(db, exchangeId, email);
      if (existing) {
        return { success: false, error: "This email is already added to the exchange." };
      }

      // Create participant
      const participantId = generateId();
      const token = generateParticipantToken();

      await createParticipant(db, {
        id: participantId,
        exchange_id: exchangeId,
        email,
        name: data.name || null,
        token,
        is_organizer: email === user.email,
      });

      // Update exchange status to collecting if it was draft
      if (exchange.status === "draft") {
        await updateExchangeStatus(db, exchangeId, "collecting");
      }

      // Send questionnaire invite email
      const emailService = createEmailServiceFromEnv(env);
      const organizer = await findOrganizerById(db, user.id);
      
      await emailService.sendQuestionnaireInvite({
        email,
        token,
        participantName: data.name || undefined,
        eventTitle: exchange.title,
        organizerName: organizer?.name || undefined,
        budgetMin: exchange.budget_min || undefined,
        budgetMax: exchange.budget_max || undefined,
        exchangeDate: exchange.exchange_date || undefined,
      });

      return { success: true, message: "Participant added and invitation sent!" };
    } catch (error) {
      if (error instanceof Response) throw error;
      logDbError("AddParticipant", error);
      const { userMessage } = getDbErrorMessage(error);
      return { success: false, error: userMessage };
    }
  },
  zod$(addParticipantSchema)
);

/**
 * Server action to resend questionnaire invite
 */
export const useResendInvite = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const exchangeId = requestEvent.params.exchangeId;

    if (!db) {
      return { success: false, error: getDbUnavailableMessage() };
    }

    const { requireAuth } = await import("~/lib/security");
    const { findParticipantById } = await import("~/lib/db");
    
    try {
      const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
      
      // Verify exchange belongs to user
      const exchange = await findExchangeByIdForOrganizer(db, exchangeId, user.id);
      if (!exchange) {
        return { success: false, error: "Exchange not found." };
      }

      // Find participant
      const participant = await findParticipantById(db, data.participantId);
      if (!participant || participant.exchange_id !== exchangeId) {
        return { success: false, error: "Participant not found." };
      }

      // Can't resend if already completed
      if (participant.questionnaire_completed_at) {
        return { success: false, error: "Questionnaire already completed." };
      }

      // Send questionnaire invite email
      const emailService = createEmailServiceFromEnv(env);
      const organizer = await findOrganizerById(db, user.id);
      
      await emailService.sendQuestionnaireInvite({
        email: participant.email,
        token: participant.token,
        participantName: participant.name || undefined,
        eventTitle: exchange.title,
        organizerName: organizer?.name || undefined,
        budgetMin: exchange.budget_min || undefined,
        budgetMax: exchange.budget_max || undefined,
        exchangeDate: exchange.exchange_date || undefined,
      });

      return { success: true, message: "Invitation resent!" };
    } catch (error) {
      if (error instanceof Response) throw error;
      logDbError("ResendInvite", error);
      const { userMessage } = getDbErrorMessage(error);
      return { success: false, error: userMessage };
    }
  },
  zod$(z.object({ participantId: z.string() }))
);

/**
 * Server action to update participant email
 */
export const useUpdateParticipantEmail = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const exchangeId = requestEvent.params.exchangeId;

    if (!db) {
      return { success: false, error: getDbUnavailableMessage() };
    }

    const { requireAuth } = await import("~/lib/security");
    const { findParticipantById } = await import("~/lib/db");
    
    try {
      const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
      
      // Verify exchange belongs to user
      const exchange = await findExchangeByIdForOrganizer(db, exchangeId, user.id);
      if (!exchange) {
        return { success: false, error: "Exchange not found." };
      }

      // Find participant
      const participant = await findParticipantById(db, data.participantId);
      if (!participant || participant.exchange_id !== exchangeId) {
        return { success: false, error: "Participant not found." };
      }

      const newEmail = normalizeEmail(data.email);
      if (!isValidEmail(newEmail)) {
        return { success: false, error: "Please enter a valid email address." };
      }

      // Check if new email already exists in exchange
      const existing = await findParticipantByExchangeAndEmail(db, exchangeId, newEmail);
      if (existing && existing.id !== participant.id) {
        return { success: false, error: "This email is already in the exchange." };
      }

      await updateParticipantEmail(db, data.participantId, newEmail);

      return { success: true, message: "Email updated!" };
    } catch (error) {
      if (error instanceof Response) throw error;
      logDbError("UpdateEmail", error);
      const { userMessage } = getDbErrorMessage(error);
      return { success: false, error: userMessage };
    }
  },
  zod$(z.object({
    participantId: z.string(),
    email: z.string().email("Please enter a valid email address"),
  }))
);

/**
 * Server action to remove a participant
 */
export const useRemoveParticipant = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const exchangeId = requestEvent.params.exchangeId;

    if (!db) {
      return { success: false, error: getDbUnavailableMessage() };
    }

    const { requireAuth } = await import("~/lib/security");
    const { findParticipantById } = await import("~/lib/db");
    
    try {
      const user = await requireAuth(db, requestEvent.cookie, "/auth/login");
      
      // Verify exchange belongs to user
      const exchange = await findExchangeByIdForOrganizer(db, exchangeId, user.id);
      if (!exchange) {
        return { success: false, error: "Exchange not found." };
      }

      // Can't remove after shuffling
      if (exchange.status === "shuffled" || exchange.status === "complete") {
        return { success: false, error: "Cannot remove participants after shuffling." };
      }

      // Find participant
      const participant = await findParticipantById(db, data.participantId);
      if (!participant || participant.exchange_id !== exchangeId) {
        return { success: false, error: "Participant not found." };
      }

      await deleteParticipant(db, data.participantId);

      return { success: true, message: "Participant removed." };
    } catch (error) {
      if (error instanceof Response) throw error;
      logDbError("RemoveParticipant", error);
      const { userMessage } = getDbErrorMessage(error);
      return { success: false, error: userMessage };
    }
  },
  zod$(z.object({ participantId: z.string() }))
);

/**
 * Map database status to badge config
 */
function getStatusBadge(status: Exchange["status"]) {
  const config: Record<Exchange["status"], { label: string; variant: "default" | "info" | "warning" | "success" | "festive" }> = {
    draft: { label: "Draft", variant: "default" },
    collecting: { label: "Collecting Responses", variant: "info" },
    ready: { label: "Ready to Shuffle", variant: "warning" },
    shuffled: { label: "Shuffled", variant: "success" },
    complete: { label: "Complete", variant: "festive" },
  };
  return config[status];
}

/**
 * Format budget for display
 */
function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return "No budget set";
  if (min !== null && max !== null) {
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  }
  if (min !== null) return `$${min}+`;
  return `Up to $${max}`;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default component$(() => {
  const user = useRequireAuth();
  const exchangeData = useExchangeData();
  const addParticipantAction = useAddParticipant();
  const resendInviteAction = useResendInvite();
  const updateEmailAction = useUpdateParticipantEmail();
  const removeParticipantAction = useRemoveParticipant();

  const { exchange, participants, completedCount } = exchangeData.value;
  const statusConfig = getStatusBadge(exchange.status);
  const progressPercent = participants.length > 0
    ? Math.round((completedCount / participants.length) * 100)
    : 0;
  const allComplete = participants.length > 0 && completedCount === participants.length;

  // UI state
  const showAddForm = useSignal(false);
  const editingParticipantId = useSignal<string | null>(null);
  const editEmail = useSignal("");
  const actionMessage = useSignal<{ type: "success" | "error"; text: string } | null>(null);

  // Handle add participant success/error
  const handleAddResult = $(() => {
    if (addParticipantAction.value?.success) {
      showAddForm.value = false;
      actionMessage.value = { type: "success", text: addParticipantAction.value.message || "Added!" };
      setTimeout(() => { actionMessage.value = null; }, 3000);
    } else if (addParticipantAction.value?.error) {
      actionMessage.value = { type: "error", text: addParticipantAction.value.error };
    }
  });

  // Handle resend success/error
  const handleResendResult = $(() => {
    if (resendInviteAction.value?.success) {
      actionMessage.value = { type: "success", text: resendInviteAction.value.message || "Sent!" };
      setTimeout(() => { actionMessage.value = null; }, 3000);
    } else if (resendInviteAction.value?.error) {
      actionMessage.value = { type: "error", text: resendInviteAction.value.error };
    }
  });

  // Handle update email success/error
  const handleUpdateResult = $(() => {
    if (updateEmailAction.value?.success) {
      editingParticipantId.value = null;
      actionMessage.value = { type: "success", text: updateEmailAction.value.message || "Updated!" };
      setTimeout(() => { actionMessage.value = null; }, 3000);
    } else if (updateEmailAction.value?.error) {
      actionMessage.value = { type: "error", text: updateEmailAction.value.error };
    }
  });

  // Handle remove success/error  
  const handleRemoveResult = $(() => {
    if (removeParticipantAction.value?.success) {
      actionMessage.value = { type: "success", text: removeParticipantAction.value.message || "Removed!" };
      setTimeout(() => { actionMessage.value = null; }, 3000);
    } else if (removeParticipantAction.value?.error) {
      actionMessage.value = { type: "error", text: removeParticipantAction.value.error };
    }
  });

  return (
    <div class="relative">
      {/* Back link */}
      <Link
        href="/dashboard"
        class="inline-flex items-center gap-1 text-gray-600 hover:text-forest-green mb-6 transition-colors group"
        aria-label="Back to Dashboard"
      >
        <span class="transform group-hover:-translate-x-1 transition-transform" aria-hidden="true">←</span>
        <span>Back to Dashboard</span>
      </Link>

      {/* Exchange Header */}
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 class="text-3xl md:text-4xl mb-2">{exchange.title}</h1>
            {exchange.description && (
              <p class="text-gray-600">{exchange.description}</p>
            )}
          </div>
          <div class="flex items-center gap-3 shrink-0">
            {(exchange.status === "draft" || exchange.status === "collecting") && (
              <Link href={`/exchanges/${exchange.id}/edit`}>
                <Button variant="ghost" size="sm">
                  <EditIcon size={16} aria-hidden="true" />
                  <span>Edit</span>
                </Button>
              </Link>
            )}
            <Badge variant={statusConfig.variant} size="lg">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Exchange details grid */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Participants</p>
            <p class="font-semibold text-lg">{participants.length}</p>
          </div>
          <div>
            <p class="text-gray-500">Questionnaires</p>
            <p class="font-semibold text-lg">
              {completedCount}/{participants.length}
            </p>
          </div>
          <div>
            <p class="text-gray-500">Budget</p>
            <p class="font-semibold">{formatBudget(exchange.budget_min, exchange.budget_max)}</p>
          </div>
          <div>
            <p class="text-gray-500">Exchange Date</p>
            <p class="font-semibold">{formatDate(exchange.exchange_date)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {participants.length > 0 && (
          <div class="mt-4" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Questionnaire completion progress">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600">Questionnaire Progress</span>
              <span class={allComplete ? "text-forest-green font-semibold" : "text-gray-600"}>
                {progressPercent}%
              </span>
            </div>
            <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                class={[
                  "h-full transition-all duration-500",
                  allComplete ? "bg-forest-green" : "bg-christmas-red",
                ].join(" ")}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Action message toast */}
      {actionMessage.value && (
        <div
          class={[
            "mb-4 p-3 rounded-lg text-sm",
            actionMessage.value.type === "success"
              ? "bg-forest-green/10 text-forest-green"
              : "bg-christmas-red/10 text-christmas-red",
          ].join(" ")}
        >
          {actionMessage.value.text}
        </div>
      )}

      {/* Ready to shuffle banner */}
      {allComplete && exchange.status === "collecting" && (
        <Card variant="festive" class="mb-6">
          <CardContent class="py-6 text-center">
            <FestiveGnome variant="holly" size="md" class="mb-3" />
            <h2 class="text-xl font-bold text-forest-green mb-2">
              All Questionnaires Complete!
            </h2>
            <p class="text-gray-600 mb-4">
              Everyone has filled out their preferences. Ready to shuffle?
            </p>
            <Link href={`/exchanges/${exchange.id}/shuffle`}>
              <Button variant="secondary" size="lg">
                <ShuffleIcon size={18} aria-hidden="true" />
                <span>Shuffle Assignments</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Shuffled - ready to send secrets banner */}
      {exchange.status === "shuffled" && (
        <Card variant="festive" class="mb-6">
          <CardContent class="py-6 text-center">
            <FestiveGnome variant="stripey" size="md" class="mb-3" />
            <h2 class="text-xl font-bold text-forest-green mb-2">
              Assignments Shuffled!
            </h2>
            <p class="text-gray-600 mb-4">
              Everyone has been assigned their Secret Santa recipient. Ready to send the emails?
            </p>
            <Link href={`/exchanges/${exchange.id}/shuffle`}>
              <Button variant="primary" size="lg">
                <MailIcon size={18} aria-hidden="true" />
                <span>Send Secret Assignments</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Complete banner */}
      {exchange.status === "complete" && (
        <Card variant="festive" class="mb-6">
          <CardContent class="py-6 text-center">
            <FestiveGnome variant="dotty" size="lg" class="mb-3" />
            <h2 class="text-xl font-bold text-forest-green mb-2">
              Gift Exchange Complete!
            </h2>
            <p class="text-gray-600 mb-4">
              All Secret Santa assignments have been sent. Happy gift giving!
            </p>
            <Link href={`/exchanges/${exchange.id}/shuffle`}>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Participants Section */}
      <section aria-labelledby="participants-heading">
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle id="participants-heading">
                  <span class="flex items-center gap-2">
                    <UsersIcon size={20} class="text-forest-green" aria-hidden="true" />
                    Participants
                  </span>
                </CardTitle>
                <CardDescription>
                  {participants.length === 0
                    ? "Add people to your gift exchange"
                    : `${participants.length} ${participants.length === 1 ? "person" : "people"} in this exchange`}
                </CardDescription>
              </div>
              {(exchange.status === "draft" || exchange.status === "collecting") && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick$={() => { showAddForm.value = !showAddForm.value; }}
                  aria-expanded={showAddForm.value}
                  aria-controls="add-participant-form"
                >
                  {showAddForm.value ? (
                    "Cancel"
                  ) : (
                    <>
                      <PlusIcon size={16} aria-hidden="true" />
                      <span>Add Participant</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>

        <CardContent>
          {/* Add participant form */}
          {showAddForm.value && (
            <div class="mb-6 p-4 bg-cream rounded-lg border-2 border-dashed border-christmas-red/30">
              <Form
                action={addParticipantAction}
                onSubmitCompleted$={handleAddResult}
                class="space-y-4"
              >
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="friend@example.com"
                    required
                    error={addParticipantAction.value?.fieldErrors?.email?.[0]}
                  />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    label="Name (optional)"
                    placeholder="Their name"
                    error={addParticipantAction.value?.fieldErrors?.name?.[0]}
                  />
                </div>
                <div class="flex gap-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    loading={addParticipantAction.isRunning}
                  >
                    Add & Send Invite
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick$={() => { showAddForm.value = false; }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </div>
          )}

          {/* Participants list */}
          {participants.length === 0 ? (
            <div class="text-center py-8">
              <FestiveGnome variant="classic" size="md" class="mb-3" />
              <p class="text-gray-600">No participants yet. Add some friends and family!</p>
            </div>
          ) : (
            <div class="space-y-3">
              {participants.map((participant) => {
                const isEditing = editingParticipantId.value === participant.id;
                const hasCompleted = participant.questionnaire_completed_at !== null;

                return (
                  <div
                    key={participant.id}
                    class="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Participant info */}
                    <div class="flex-1 min-w-0">
                      {isEditing ? (
                        <Form
                          action={updateEmailAction}
                          onSubmitCompleted$={handleUpdateResult}
                          class="flex gap-2"
                        >
                          <input type="hidden" name="participantId" value={participant.id} />
                          <Input
                            id={`email-${participant.id}`}
                            name="email"
                            type="email"
                            value={editEmail.value}
                            onInput$={(val) => { editEmail.value = val; }}
                            class="flex-1"
                          />
                          <Button type="submit" variant="secondary" size="sm" loading={updateEmailAction.isRunning}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick$={() => { editingParticipantId.value = null; }}
                          >
                            Cancel
                          </Button>
                        </Form>
                      ) : (
                        <div>
                          <div class="flex items-center gap-2">
                            <p class="font-medium truncate">
                              {participant.name || participant.email}
                            </p>
                            {participant.is_organizer === 1 && (
                              <Badge variant="default" size="sm">You</Badge>
                            )}
                          </div>
                          {participant.name && (
                            <p class="text-sm text-gray-500 truncate">{participant.email}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div class="flex items-center gap-2">
                      <Badge
                        variant={hasCompleted ? "success" : "warning"}
                        size="sm"
                      >
                        {hasCompleted ? "Completed" : "Pending"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    {!isEditing && (exchange.status === "draft" || exchange.status === "collecting") && (
                      <div class="flex items-center gap-2">
                        {!hasCompleted && (
                          <Form action={resendInviteAction} onSubmitCompleted$={handleResendResult}>
                            <input type="hidden" name="participantId" value={participant.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              loading={resendInviteAction.isRunning}
                            >
                              Resend
                            </Button>
                          </Form>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick$={() => {
                            editingParticipantId.value = participant.id;
                            editEmail.value = participant.email;
                          }}
                        >
                          Edit
                        </Button>
                        <Form action={removeParticipantAction} onSubmitCompleted$={handleRemoveResult}>
                          <input type="hidden" name="participantId" value={participant.id} />
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            loading={removeParticipantAction.isRunning}
                          >
                            Remove
                          </Button>
                        </Form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

          {/* Footer with minimum participants warning */}
          {participants.length > 0 && participants.length < 3 && (
            <CardFooter class="border-t border-gray-100 pt-4">
              <p class="text-sm text-amber-600 flex items-center gap-2">
                <AlertCircleIcon size={16} aria-hidden="true" />
                <span>You need at least 3 participants for a Secret Santa exchange.</span>
              </p>
            </CardFooter>
          )}
        </Card>
      </section>

      {/* Account info */}
      <footer class="mt-8 text-center text-sm text-gray-500">
        <p>
          Signed in as <strong>{user.value.email}</strong>
        </p>
      </footer>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const exchangeData = resolveValue(useExchangeData);
  return {
    title: `${exchangeData.exchange.title} - Secret Santa Shuffler`,
    meta: [
      {
        name: "description",
        content: `Manage participants for ${exchangeData.exchange.title}`,
      },
    ],
  };
};
