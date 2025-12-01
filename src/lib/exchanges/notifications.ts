/**
 * Exchange Notification Utilities
 *
 * Handles sending notifications related to exchange status changes,
 * such as when all questionnaires are complete.
 */

import type { D1Database, Env } from "../db/types";
import {
  findExchangeById,
  findOrganizerById,
  areAllQuestionnairesComplete,
  countParticipantsByExchange,
  updateExchangeStatus,
} from "../db";
import { createEmailServiceFromEnv } from "../email";

/**
 * Check if all questionnaires are complete and send notification to organizer
 * 
 * This function should be called after a participant submits their questionnaire.
 * It will:
 * 1. Check if all participants have completed their questionnaires
 * 2. If so, update the exchange status to "ready"
 * 3. Send an email notification to the organizer
 * 
 * @param db - D1 database instance
 * @param env - Environment bindings for email service
 * @param exchangeId - The exchange to check
 * @returns Whether the notification was sent
 */
export async function checkAndNotifyAllComplete(
  db: D1Database,
  env: Env,
  exchangeId: string
): Promise<{ notified: boolean; error?: string }> {
  try {
    // Check if all questionnaires are complete
    const allComplete = await areAllQuestionnairesComplete(db, exchangeId);
    
    if (!allComplete) {
      return { notified: false };
    }

    // Get the exchange
    const exchange = await findExchangeById(db, exchangeId);
    if (!exchange) {
      return { notified: false, error: "Exchange not found" };
    }

    // Only send notification if exchange is in "collecting" status
    // (don't re-notify if already "ready", "shuffled", or "complete")
    if (exchange.status !== "collecting") {
      return { notified: false };
    }

    // Update exchange status to "ready"
    await updateExchangeStatus(db, exchangeId, "ready");

    // Get the organizer
    const organizer = await findOrganizerById(db, exchange.organizer_id);
    if (!organizer) {
      return { notified: false, error: "Organizer not found" };
    }

    // Get participant count
    const participantCount = await countParticipantsByExchange(db, exchangeId);

    // Send notification email
    const emailService = createEmailServiceFromEnv(env);
    const result = await emailService.sendAllCompleteNotification({
      organizerEmail: organizer.email,
      organizerName: organizer.name || undefined,
      eventId: exchange.id,
      eventTitle: exchange.title,
      participantCount,
    });

    if (!result.success) {
      console.error("[AllComplete] Failed to send notification:", result.error);
      return { notified: false, error: "Failed to send email" };
    }

    console.log(`[AllComplete] Notification sent to ${organizer.email} for exchange "${exchange.title}"`);
    return { notified: true };
  } catch (error) {
    console.error("[AllComplete] Error:", error);
    return { notified: false, error: "Internal error" };
  }
}
