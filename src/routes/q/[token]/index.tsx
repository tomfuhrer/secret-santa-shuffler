import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  routeAction$,
  zod$,
  z,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { Card, CardContent } from "~/components/ui/card";
import { GiftIcon } from "~/components/icons";
import { QuestionnaireForm } from "~/components/forms/questionnaire-form";
import {
  findParticipantByToken,
  findQuestionnaireByParticipant,
  findExchangeById,
  upsertQuestionnaire,
  markQuestionnaireCompleted,
  areAllQuestionnairesComplete,
  countParticipantsByExchange,
  findOrganizerById,
} from "~/lib/db";
import { generateId } from "~/lib/security";
import { createEmailServiceFromEnv } from "~/lib/email";
import type { Env, Exchange, Participant, Questionnaire } from "~/lib/db/types";
import { getDbUnavailableMessage, getDbErrorMessage, logDbError } from "~/lib/errors";

/**
 * Page data returned by the loader
 */
interface QuestionnairePageData {
  participant: Participant;
  exchange: Exchange;
  questionnaire: Questionnaire | null;
  alreadyShuffled: boolean;
}

/**
 * Error state returned when token is invalid
 */
interface QuestionnairePageError {
  error: string;
  notFound?: boolean;
}

type LoaderResult = QuestionnairePageData | QuestionnairePageError;

/**
 * Check if the result is an error
 */
function isError(result: LoaderResult): result is QuestionnairePageError {
  return "error" in result;
}

/**
 * Load participant data and existing questionnaire
 */
export const useQuestionnaireData = routeLoader$<LoaderResult>(
  async (requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const token = requestEvent.params.token;

    if (!db) {
      return { error: getDbUnavailableMessage() };
    }

    if (!token) {
      return { error: "Invalid questionnaire link.", notFound: true };
    }

    // Find participant by token
    const participant = await findParticipantByToken(db, token);

    if (!participant) {
      return {
        error: "This questionnaire link is invalid or has expired.",
        notFound: true,
      };
    }

    // Get the exchange
    const exchange = await findExchangeById(db, participant.exchange_id);

    if (!exchange) {
      return { error: "The exchange associated with this link no longer exists." };
    }

    // Check if exchange is already shuffled
    if (exchange.status === "shuffled" || exchange.status === "complete") {
      return {
        participant,
        exchange,
        questionnaire: null,
        alreadyShuffled: true,
      };
    }

    // Get existing questionnaire if any
    const questionnaire = await findQuestionnaireByParticipant(
      db,
      participant.id
    );

    return {
      participant,
      exchange,
      questionnaire,
      alreadyShuffled: false,
    };
  }
);

/**
 * Questionnaire submission validation schema
 */
const questionnaireSchema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name")
    .max(100, "Name must be 100 characters or less"),
  never_buy_myself: z
    .string()
    .max(1000, "Please keep this under 1000 characters")
    .optional(),
  please_no: z
    .string()
    .max(1000, "Please keep this under 1000 characters")
    .optional(),
  spare_time: z
    .string()
    .max(1000, "Please keep this under 1000 characters")
    .optional(),
  other_loves: z
    .string()
    .max(1000, "Please keep this under 1000 characters")
    .optional(),
  favorite_color: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_sports_team: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_pattern: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_supplies: z
    .string()
    .max(200, "Please keep this under 200 characters")
    .optional(),
  favorite_snacks: z
    .string()
    .max(200, "Please keep this under 200 characters")
    .optional(),
  favorite_beverages: z
    .string()
    .max(200, "Please keep this under 200 characters")
    .optional(),
  favorite_candy: z
    .string()
    .max(200, "Please keep this under 200 characters")
    .optional(),
  favorite_fragrances: z
    .string()
    .max(200, "Please keep this under 200 characters")
    .optional(),
  favorite_restaurant: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_store: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_christmas_movie: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
  favorite_christmas_song: z
    .string()
    .max(100, "Please keep this under 100 characters")
    .optional(),
});

/**
 * Server action to submit questionnaire
 */
export const useSubmitQuestionnaire = routeAction$(
  async (data, requestEvent) => {
    const env = requestEvent.platform?.env as Env | undefined;
    const db = env?.DB;
    const token = requestEvent.params.token;

    if (!db) {
      return { success: false, error: getDbUnavailableMessage() };
    }

    // Find participant
    const participant = await findParticipantByToken(db, token);

    if (!participant) {
      return { success: false, error: "Invalid questionnaire link." };
    }

    // Get exchange to check status
    const exchange = await findExchangeById(db, participant.exchange_id);

    if (!exchange) {
      return { success: false, error: "Exchange not found." };
    }

    // Can't submit if already shuffled
    if (exchange.status === "shuffled" || exchange.status === "complete") {
      return {
        success: false,
        error: "The gift exchange has already been shuffled. No changes allowed.",
      };
    }

    try {
      // Check if this is an update
      const existingQuestionnaire = await findQuestionnaireByParticipant(
        db,
        participant.id
      );
      const isUpdate = !!existingQuestionnaire;

      // Save questionnaire
      await upsertQuestionnaire(db, {
        id: existingQuestionnaire?.id ?? generateId(),
        participant_id: participant.id,
        name: data.name,
        never_buy_myself: data.never_buy_myself || null,
        please_no: data.please_no || null,
        spare_time: data.spare_time || null,
        other_loves: data.other_loves || null,
        favorite_color: data.favorite_color || null,
        favorite_sports_team: data.favorite_sports_team || null,
        favorite_pattern: data.favorite_pattern || null,
        favorite_supplies: data.favorite_supplies || null,
        favorite_snacks: data.favorite_snacks || null,
        favorite_beverages: data.favorite_beverages || null,
        favorite_candy: data.favorite_candy || null,
        favorite_fragrances: data.favorite_fragrances || null,
        favorite_restaurant: data.favorite_restaurant || null,
        favorite_store: data.favorite_store || null,
        favorite_christmas_movie: data.favorite_christmas_movie || null,
        favorite_christmas_song: data.favorite_christmas_song || null,
      });

      // Mark as completed if first time
      if (!isUpdate) {
        await markQuestionnaireCompleted(db, participant.id);

        // Check if all questionnaires are now complete
        const allComplete = await areAllQuestionnairesComplete(
          db,
          participant.exchange_id
        );

        if (allComplete) {
          // Send notification to organizer
          const organizer = await findOrganizerById(db, exchange.organizer_id);
          const participantCount = await countParticipantsByExchange(
            db,
            participant.exchange_id
          );

          if (organizer) {
            const emailService = createEmailServiceFromEnv(env, requestEvent.url);

            await emailService.sendAllCompleteNotification({
              organizerEmail: organizer.email,
              organizerName: organizer.name || undefined,
              eventId: exchange.id,
              eventTitle: exchange.title,
              participantCount,
            });
          }
        }
      }

      return {
        success: true,
        message: isUpdate
          ? "Your preferences have been updated!"
          : "Thank you! Your preferences have been saved. You'll receive your Secret Santa assignment once everyone has responded.",
      };
    } catch (error) {
      logDbError("SubmitQuestionnaire", error);
      const { userMessage } = getDbErrorMessage(error);
      return {
        success: false,
        error: userMessage,
      };
    }
  },
  zod$(questionnaireSchema)
);

/**
 * Format budget for display
 */
function formatBudget(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
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
function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
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
  const data = useQuestionnaireData();
  const submitAction = useSubmitQuestionnaire();

  // Handle error states
  if (isError(data.value)) {
    return (
      <div class="container-narrow py-12">
        <Card variant="festive" class="text-center">
          <CardContent class="py-12">
            <div class="text-6xl mb-4">
              {data.value.notFound ? "🔍" : "⚠️"}
            </div>
            <h1 class="text-2xl font-bold text-christmas-red mb-4">
              {data.value.notFound ? "Link Not Found" : "Something Went Wrong"}
            </h1>
            <p class="text-gray-600 max-w-md mx-auto">{data.value.error}</p>
            <p class="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact the exchange
              organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { participant, exchange, questionnaire, alreadyShuffled } = data.value;
  const budget = formatBudget(exchange.budget_min, exchange.budget_max);
  const exchangeDate = formatDate(exchange.exchange_date);
  const hasCompleted = participant.questionnaire_completed_at !== null;

  // Handle already shuffled state
  if (alreadyShuffled) {
    return (
      <div class="container-narrow py-12">
        <Card variant="festive" class="text-center">
          <CardContent class="py-12">
            <div class="text-6xl mb-4">🎲</div>
            <h1 class="text-2xl font-bold text-forest-green mb-4">
              Assignments Are In!
            </h1>
            <p class="text-gray-600 max-w-md mx-auto">
              The Secret Santa assignments for <strong>"{exchange.title}"</strong>{" "}
              have already been shuffled. Check your email for your assignment!
            </p>
            <p class="text-sm text-gray-500 mt-4">
              Can't find the email? Check your spam folder or contact the exchange
              organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div class="container-narrow py-8 md:py-12">
      {/* Header */}
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl mb-2">{exchange.title}</h1>
        {exchange.description && (
          <p class="text-gray-600 mb-4">{exchange.description}</p>
        )}

        {/* Exchange details */}
        <div class="flex flex-wrap justify-center gap-4 text-sm">
          {budget && (
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-forest-green/10 text-forest-green rounded-full">
              <span>💰</span> Budget: {budget}
            </span>
          )}
          {exchangeDate && (
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-christmas-red/10 text-christmas-red rounded-full">
              <span>📅</span> {exchangeDate}
            </span>
          )}
        </div>
      </div>

      {/* Status banner */}
      {hasCompleted && !submitAction.value?.success && (
        <div class="mb-6 p-4 bg-forest-green/10 border border-forest-green/30 rounded-lg text-center">
          <p class="text-forest-green font-medium">
            ✓ You've already submitted your preferences! Feel free to update
            them below.
          </p>
        </div>
      )}

      {/* Introduction for new submissions */}
      {!hasCompleted && !submitAction.value?.success && (
        <Card class="mb-8">
          <CardContent class="py-6 text-center">
            <GiftIcon size={40} class="mx-auto mb-2 text-christmas-red" />
            <h2 class="text-xl font-bold text-christmas-red mb-2">
              Help Your Secret Santa!
            </h2>
            <p class="text-gray-600 max-w-lg mx-auto">
              Fill out this questionnaire to help your Secret Santa find the
              perfect gift for you. The more details you provide, the better!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success state - show thank you message */}
      {submitAction.value?.success && !hasCompleted && (
        <Card variant="festive" class="mb-8">
          <CardContent class="py-8 text-center">
            <div class="text-6xl mb-4">🎉</div>
            <h2 class="text-2xl font-bold text-forest-green mb-2">
              You're All Set!
            </h2>
            <p class="text-gray-600 max-w-lg mx-auto">
              {submitAction.value.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire form */}
      <QuestionnaireForm
        action={submitAction}
        existingData={questionnaire}
        participantName={participant.name}
      />
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useQuestionnaireData);

  if (isError(data)) {
    return {
      title: "Questionnaire - Secret Santa Shuffler",
    };
  }

  return {
    title: `${data.exchange.title} - Gift Questionnaire`,
    meta: [
      {
        name: "description",
        content: `Fill out your gift preferences for ${data.exchange.title}`,
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  };
};
