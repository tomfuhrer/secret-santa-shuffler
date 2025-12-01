import { component$, useSignal } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  Form,
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
import { Badge } from "~/components/ui/badge";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from "~/components/ui/modal";
import { MailIcon } from "~/components/icons";
import { useRequireAuth } from "../../layout";
import {
  findExchangeByIdForOrganizer,
  listParticipantsByExchange,
  countCompletedQuestionnaires,
  findQuestionnaireByParticipant,
  assignRecipient,
  updateExchange,
  findOrganizerById,
} from "~/lib/db";
import { createSecretSantaAssignments, validateAssignments } from "~/lib/shuffle/sattolo";
import { createEmailServiceFromEnv } from "~/lib/email";
import { nowUnix } from "~/lib/security";
import type { Env, Exchange, Participant, Questionnaire } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

/**
 * Shuffle page data
 */
interface ShuffleData {
  exchange: Exchange;
  participants: Participant[];
  completedCount: number;
  canShuffle: boolean;
  canSendSecrets: boolean;
  shuffleError?: string;
}

/**
 * Load exchange and participant data for shuffle page
 */
export const useShuffleData = routeLoader$(async (requestEvent) => {
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
    throw requestEvent.redirect(302, "/dashboard");
  }

  // Fetch participants and completion count
  const [participants, completedCount] = await Promise.all([
    listParticipantsByExchange(db, exchangeId),
    countCompletedQuestionnaires(db, exchangeId),
  ]);

  // Determine what actions are available
  const allComplete = participants.length > 0 && completedCount === participants.length;
  const hasEnoughParticipants = participants.length >= 2;
  const canShuffle =
    hasEnoughParticipants &&
    allComplete &&
    (exchange.status === "collecting" || exchange.status === "ready");
  const canSendSecrets = exchange.status === "shuffled" && exchange.secrets_sent_at === null;

  let shuffleError: string | undefined;
  if (!hasEnoughParticipants) {
    shuffleError = "You need at least 2 participants to shuffle.";
  } else if (!allComplete) {
    shuffleError = `Waiting for ${participants.length - completedCount} more questionnaire${participants.length - completedCount > 1 ? "s" : ""} to be completed.`;
  }

  return {
    exchange,
    participants,
    completedCount,
    canShuffle,
    canSendSecrets,
    shuffleError,
  } as ShuffleData;
});

/**
 * Server action to shuffle assignments
 */
export const useShuffleAction = routeAction$(async (_, requestEvent) => {
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

    // Check exchange is in valid state for shuffling
    if (exchange.status !== "collecting" && exchange.status !== "ready") {
      return {
        success: false,
        error: "Exchange has already been shuffled or is not ready.",
      };
    }

    // Get all participants
    const participants = await listParticipantsByExchange(db, exchangeId);

    if (participants.length < 2) {
      return { success: false, error: "Need at least 2 participants." };
    }

    // Verify all questionnaires are complete
    const completedCount = await countCompletedQuestionnaires(db, exchangeId);
    if (completedCount !== participants.length) {
      return {
        success: false,
        error: "All participants must complete their questionnaires first.",
      };
    }

    // Generate assignments using Sattolo's algorithm
    const participantIds = participants.map((p) => p.id);
    const assignments = createSecretSantaAssignments(participantIds);

    // Validate the assignments (single cycle, no self-assignments)
    const assignmentMap = new Map(assignments);
    const validation = validateAssignments(assignmentMap);

    if (!validation.valid) {
      console.error("[Shuffle] Validation failed:", validation.error);
      return {
        success: false,
        error: "Shuffle validation failed. Please try again.",
      };
    }

    // Save assignments to database
    for (const [santaId, recipientId] of assignments) {
      await assignRecipient(db, santaId, recipientId);
    }

    // Update exchange status to shuffled
    await updateExchange(db, exchangeId, {
      status: "shuffled",
      shuffled_at: nowUnix(),
    });

    return {
      success: true,
      message: "Assignments shuffled successfully!",
      assignmentCount: assignments.length,
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    logDbError("Shuffle", error);
    const { userMessage } = getDbErrorMessage(error);
    return { success: false, error: userMessage };
  }
});

/**
 * Server action to send Secret Santa assignment emails
 */
export const useSendSecretsAction = routeAction$(async (_, requestEvent) => {
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

    // Check exchange is in shuffled state
    if (exchange.status !== "shuffled") {
      return {
        success: false,
        error: "Exchange must be shuffled before sending secrets.",
      };
    }

    // Check secrets haven't already been sent
    if (exchange.secrets_sent_at !== null) {
      return { success: false, error: "Secrets have already been sent." };
    }

    // Get all participants with their assignments
    const participants = await listParticipantsByExchange(db, exchangeId);

    // Build a map for quick lookup
    const participantMap = new Map(participants.map((p) => [p.id, p]));

    // Get organizer info
    const organizer = await findOrganizerById(db, user.id);

    // Create email service
    const emailService = createEmailServiceFromEnv(env);

    // Send email to each participant
    let sentCount = 0;
    const errors: string[] = [];

    for (const santa of participants) {
      if (!santa.assigned_recipient_id) {
        errors.push(`${santa.email}: No assignment found`);
        continue;
      }

      const recipient = participantMap.get(santa.assigned_recipient_id);
      if (!recipient) {
        errors.push(`${santa.email}: Recipient not found`);
        continue;
      }

      // Get recipient's questionnaire
      const questionnaire = await findQuestionnaireByParticipant(
        db,
        recipient.id
      );
      if (!questionnaire) {
        errors.push(`${santa.email}: Recipient questionnaire not found`);
        continue;
      }

      // Send the assignment email
      const result = await emailService.sendSecretSantaAssignment({
        santaEmail: santa.email,
        santaName: santa.name || undefined,
        recipientName: questionnaire.name,
        eventTitle: exchange.title,
        organizerName: organizer?.name || undefined,
        budgetMin: exchange.budget_min || undefined,
        budgetMax: exchange.budget_max || undefined,
        exchangeDate: exchange.exchange_date || undefined,
        questionnaire: mapQuestionnaireToEmailData(questionnaire),
      });

      if (result.success) {
        sentCount++;
      } else {
        errors.push(`${santa.email}: ${result.error || "Send failed"}`);
      }
    }

    // Update exchange status if all emails sent successfully
    if (sentCount === participants.length) {
      await updateExchange(db, exchangeId, {
        status: "complete",
        secrets_sent_at: nowUnix(),
      });

      return {
        success: true,
        message: `All ${sentCount} Secret Santa assignments sent!`,
        sentCount,
      };
    } else if (sentCount > 0) {
      // Partial success - still mark secrets_sent_at but leave status as shuffled
      await updateExchange(db, exchangeId, {
        secrets_sent_at: nowUnix(),
      });

      return {
        success: true,
        message: `Sent ${sentCount} of ${participants.length} emails. Some failed.`,
        sentCount,
        errors,
      };
    } else {
      return {
        success: false,
        error: "Failed to send any emails.",
        errors,
      };
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    logDbError("SendSecrets", error);
    const { userMessage } = getDbErrorMessage(error);
    return { success: false, error: userMessage };
  }
});

/**
 * Map database questionnaire to email data format
 */
function mapQuestionnaireToEmailData(q: Questionnaire) {
  return {
    name: q.name,
    neverBuyMyself: q.never_buy_myself || undefined,
    pleaseNo: q.please_no || undefined,
    spareTime: q.spare_time || undefined,
    otherLoves: q.other_loves || undefined,
    favoriteColor: q.favorite_color || undefined,
    favoriteSportsTeam: q.favorite_sports_team || undefined,
    favoritePattern: q.favorite_pattern || undefined,
    favoriteSupplies: q.favorite_supplies || undefined,
    favoriteSnacks: q.favorite_snacks || undefined,
    favoriteBeverages: q.favorite_beverages || undefined,
    favoriteCandy: q.favorite_candy || undefined,
    favoriteFragrances: q.favorite_fragrances || undefined,
    favoriteRestaurant: q.favorite_restaurant || undefined,
    favoriteStore: q.favorite_store || undefined,
    favoriteChristmasMovie: q.favorite_christmas_movie || undefined,
    favoriteChristmasSong: q.favorite_christmas_song || undefined,
  };
}

/**
 * Map database status to badge config
 */
function getStatusBadge(status: Exchange["status"]) {
  const config: Record<
    Exchange["status"],
    { label: string; variant: "default" | "info" | "warning" | "success" | "festive" }
  > = {
    draft: { label: "Draft", variant: "default" },
    collecting: { label: "Collecting Responses", variant: "info" },
    ready: { label: "Ready to Shuffle", variant: "warning" },
    shuffled: { label: "Shuffled", variant: "success" },
    complete: { label: "Complete", variant: "festive" },
  };
  return config[status];
}

export default component$(() => {
  const shuffleData = useShuffleData();
  const shuffleAction = useShuffleAction();
  const sendSecretsAction = useSendSecretsAction();

  const { exchange, participants, completedCount, canShuffle, canSendSecrets, shuffleError } =
    shuffleData.value;
  const statusConfig = getStatusBadge(exchange.status);

  // Modal states
  const showShuffleConfirm = useSignal(false);
  const showSendConfirm = useSignal(false);

  // Success/error message
  const actionMessage = useSignal<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/exchanges/${exchange.id}`}
        class="inline-flex items-center text-gray-600 hover:text-forest-green mb-6 transition-colors"
      >
        ← Back to Exchange
      </Link>

      {/* Header */}
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h1 class="text-3xl md:text-4xl mb-2">Shuffle & Send</h1>
            <p class="text-gray-600">{exchange.title}</p>
          </div>
          <Badge variant={statusConfig.variant} size="lg" class="shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Action message */}
      {actionMessage.value && (
        <div
          class={[
            "mb-6 p-4 rounded-lg",
            actionMessage.value.type === "success"
              ? "bg-forest-green/10 text-forest-green"
              : "bg-christmas-red/10 text-christmas-red",
          ].join(" ")}
        >
          {actionMessage.value.text}
        </div>
      )}

      {/* Success message from shuffle action */}
      {shuffleAction.value?.success && (
        <div class="mb-6 p-4 rounded-lg bg-forest-green/10 text-forest-green">
          {shuffleAction.value.message}
        </div>
      )}

      {/* Success message from send secrets action */}
      {sendSecretsAction.value?.success && (
        <div class="mb-6 p-4 rounded-lg bg-forest-green/10 text-forest-green">
          {sendSecretsAction.value.message}
        </div>
      )}

      {/* Error messages */}
      {shuffleAction.value?.error && (
        <div class="mb-6 p-4 rounded-lg bg-christmas-red/10 text-christmas-red">
          {shuffleAction.value.error}
        </div>
      )}
      {sendSecretsAction.value?.error && (
        <div class="mb-6 p-4 rounded-lg bg-christmas-red/10 text-christmas-red">
          {sendSecretsAction.value.error}
        </div>
      )}

      {/* Step 1: Shuffle */}
      <Card class="mb-6">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class={[
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                exchange.status === "shuffled" || exchange.status === "complete"
                  ? "bg-forest-green"
                  : "bg-christmas-red",
              ].join(" ")}
            >
              {exchange.status === "shuffled" || exchange.status === "complete" ? "✓" : "1"}
            </div>
            <div>
              <CardTitle>Shuffle Assignments</CardTitle>
              <CardDescription>
                Randomly assign each person their Secret Santa recipient
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress info */}
          <div class="bg-cream rounded-lg p-4 mb-4">
            <div class="grid grid-cols-2 gap-4 text-center">
              <div>
                <p class="text-3xl font-bold text-christmas-red">{participants.length}</p>
                <p class="text-sm text-gray-600">Participants</p>
              </div>
              <div>
                <p class="text-3xl font-bold text-forest-green">{completedCount}</p>
                <p class="text-sm text-gray-600">Questionnaires Complete</p>
              </div>
            </div>
          </div>

          {/* Status message */}
          {exchange.status === "shuffled" || exchange.status === "complete" ? (
            <div class="text-center py-4">
              <div class="text-4xl mb-2">🎲</div>
              <p class="text-forest-green font-semibold">
                Assignments have been shuffled!
              </p>
              <p class="text-sm text-gray-600 mt-1">
                Shuffled on{" "}
                {exchange.shuffled_at
                  ? new Date(exchange.shuffled_at * 1000).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          ) : shuffleError ? (
            <div class="text-center py-4">
              <div class="text-4xl mb-2">⏳</div>
              <p class="text-amber-600">{shuffleError}</p>
            </div>
          ) : (
            <div class="text-center py-4">
              <div class="text-4xl mb-2">🎉</div>
              <p class="text-forest-green font-semibold">Ready to shuffle!</p>
              <p class="text-sm text-gray-600 mt-1">
                All {participants.length} participants have completed their questionnaires.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter class="border-t border-gray-100 pt-4">
          {canShuffle && (
            <Button
              variant="secondary"
              size="lg"
              onClick$={() => {
                showShuffleConfirm.value = true;
              }}
              disabled={shuffleAction.isRunning}
            >
              🎲 Shuffle Assignments
            </Button>
          )}
          {(exchange.status === "shuffled" || exchange.status === "complete") && (
            <p class="text-sm text-gray-500">
              Assignments are locked. Each person will give a gift to one other person in an unbroken chain.
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Step 2: Send Secrets */}
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div
              class={[
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                exchange.status === "complete"
                  ? "bg-forest-green"
                  : exchange.status === "shuffled"
                    ? "bg-christmas-red"
                    : "bg-gray-300",
              ].join(" ")}
            >
              {exchange.status === "complete" ? "✓" : "2"}
            </div>
            <div>
              <CardTitle>Send Secret Assignments</CardTitle>
              <CardDescription>
                Email each participant their Secret Santa recipient with gift preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exchange.status === "complete" ? (
            <div class="text-center py-4">
              <div class="text-4xl mb-2">📬</div>
              <p class="text-forest-green font-semibold">All secrets have been sent!</p>
              <p class="text-sm text-gray-600 mt-1">
                Sent on{" "}
                {exchange.secrets_sent_at
                  ? new Date(exchange.secrets_sent_at * 1000).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          ) : exchange.status === "shuffled" ? (
            <div class="text-center py-4">
              <MailIcon size={40} class="mx-auto mb-2 text-forest-green" />
              <p class="text-forest-green font-semibold">Ready to send!</p>
              <p class="text-sm text-gray-600 mt-1">
                Each participant will receive an email with their assignment and the recipient's preferences.
              </p>
            </div>
          ) : (
            <div class="text-center py-4">
              <div class="text-4xl mb-2">🔒</div>
              <p class="text-gray-500">Complete Step 1 first to unlock this step.</p>
            </div>
          )}
        </CardContent>
        <CardFooter class="border-t border-gray-100 pt-4">
          {canSendSecrets && (
            <Button
              variant="primary"
              size="lg"
              onClick$={() => {
                showSendConfirm.value = true;
              }}
              disabled={sendSecretsAction.isRunning}
            >
              📬 Send Secret Assignments
            </Button>
          )}
          {exchange.status === "complete" && (
            <p class="text-sm text-gray-500">
              Everyone has received their assignment. Happy gift giving!
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Shuffle Confirmation Modal */}
      <Modal
        open={showShuffleConfirm.value}
        onClose$={() => {
          showShuffleConfirm.value = false;
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Confirm Shuffle</ModalTitle>
          <ModalDescription>
            This will randomly assign Secret Santa pairs. This action cannot be undone.
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p class="text-amber-800 text-sm">
              <strong>Important:</strong> Once shuffled, you cannot add or remove participants.
              Make sure everyone you want included has been added.
            </p>
          </div>
          <div class="mt-4 text-center">
            <p class="text-gray-600">
              <strong>{participants.length}</strong> participants will be assigned.
            </p>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick$={() => {
              showShuffleConfirm.value = false;
            }}
          >
            Cancel
          </Button>
          <Form
            action={shuffleAction}
            onSubmitCompleted$={() => {
              showShuffleConfirm.value = false;
            }}
          >
            <Button type="submit" variant="secondary" loading={shuffleAction.isRunning}>
              🎲 Shuffle Now
            </Button>
          </Form>
        </ModalFooter>
      </Modal>

      {/* Send Secrets Confirmation Modal */}
      <Modal
        open={showSendConfirm.value}
        onClose$={() => {
          showSendConfirm.value = false;
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Send Secret Assignments</ModalTitle>
          <ModalDescription>
            Each participant will receive an email revealing who they're buying a gift for.
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div class="bg-cream rounded-lg p-4 text-center">
            <MailIcon size={32} class="mx-auto mb-2 text-forest-green" />
            <p class="text-gray-700">
              <strong>{participants.length}</strong> emails will be sent
            </p>
          </div>
          <div class="mt-4 text-sm text-gray-600">
            <p>Each email will include:</p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>Their Secret Santa recipient's name</li>
              <li>The recipient's gift preferences from their questionnaire</li>
              <li>Exchange details (budget, exchange date)</li>
            </ul>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick$={() => {
              showSendConfirm.value = false;
            }}
          >
            Cancel
          </Button>
          <Form
            action={sendSecretsAction}
            onSubmitCompleted$={() => {
              showSendConfirm.value = false;
            }}
          >
            <Button type="submit" variant="primary" loading={sendSecretsAction.isRunning}>
              📬 Send Emails
            </Button>
          </Form>
        </ModalFooter>
      </Modal>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const shuffleData = resolveValue(useShuffleData);
  return {
    title: `Shuffle - ${shuffleData.exchange.title} - Secret Santa Shuffler`,
    meta: [
      {
        name: "description",
        content: `Shuffle Secret Santa assignments for ${shuffleData.exchange.title}`,
      },
    ],
  };
};
