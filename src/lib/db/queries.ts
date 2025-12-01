/**
 * Database Query Functions
 *
 * Provides typed database access for authentication and core entities.
 * All queries use prepared statements for security and performance.
 */

import type {
  D1Database,
  Organizer,
  CreateOrganizerInput,
  MagicLink,
  CreateMagicLinkInput,
  Session,
  CreateSessionInput,
  Exchange,
  CreateExchangeInput,
  UpdateExchangeInput,
  ExchangeStatus,
  Participant,
  CreateParticipantInput,
  Questionnaire,
  QuestionnaireInput,
} from "./types";
import { nowUnix } from "../security/tokens";

// ============================================================================
// Organizer Queries
// ============================================================================

/**
 * Find an organizer by email address
 */
export async function findOrganizerByEmail(
  db: D1Database,
  email: string
): Promise<Organizer | null> {
  return db
    .prepare("SELECT * FROM organizers WHERE email = ?")
    .bind(email)
    .first<Organizer>();
}

/**
 * Find an organizer by ID
 */
export async function findOrganizerById(
  db: D1Database,
  id: string
): Promise<Organizer | null> {
  return db
    .prepare("SELECT * FROM organizers WHERE id = ?")
    .bind(id)
    .first<Organizer>();
}

/**
 * Create a new organizer
 */
export async function createOrganizer(
  db: D1Database,
  input: CreateOrganizerInput
): Promise<Organizer> {
  const now = nowUnix();

  await db
    .prepare(
      `INSERT INTO organizers (id, email, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(input.id, input.email, input.name ?? null, now, now)
    .run();

  const organizer = await findOrganizerById(db, input.id);
  if (!organizer) {
    throw new Error("Failed to create organizer");
  }

  return organizer;
}

/**
 * Update an organizer's name
 */
export async function updateOrganizerName(
  db: D1Database,
  id: string,
  name: string
): Promise<void> {
  await db
    .prepare("UPDATE organizers SET name = ?, updated_at = ? WHERE id = ?")
    .bind(name, nowUnix(), id)
    .run();
}

/**
 * Find or create an organizer by email
 * Returns the organizer and whether they were newly created
 */
export async function findOrCreateOrganizer(
  db: D1Database,
  input: CreateOrganizerInput
): Promise<{ organizer: Organizer; created: boolean }> {
  const existing = await findOrganizerByEmail(db, input.email);

  if (existing) {
    return { organizer: existing, created: false };
  }

  const organizer = await createOrganizer(db, input);
  return { organizer, created: true };
}

// ============================================================================
// Magic Link Queries
// ============================================================================

/**
 * Create a new magic link
 */
export async function createMagicLink(
  db: D1Database,
  input: CreateMagicLinkInput
): Promise<MagicLink> {
  const now = nowUnix();

  await db
    .prepare(
      `INSERT INTO magic_links (id, organizer_id, email, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.organizer_id ?? null,
      input.email,
      input.token,
      input.expires_at,
      now
    )
    .run();

  const magicLink = await findMagicLinkById(db, input.id);
  if (!magicLink) {
    throw new Error("Failed to create magic link");
  }

  return magicLink;
}

/**
 * Find a magic link by ID
 */
export async function findMagicLinkById(
  db: D1Database,
  id: string
): Promise<MagicLink | null> {
  return db
    .prepare("SELECT * FROM magic_links WHERE id = ?")
    .bind(id)
    .first<MagicLink>();
}

/**
 * Find a magic link by token
 */
export async function findMagicLinkByToken(
  db: D1Database,
  token: string
): Promise<MagicLink | null> {
  return db
    .prepare("SELECT * FROM magic_links WHERE token = ?")
    .bind(token)
    .first<MagicLink>();
}

/**
 * Find a valid (unused, not expired) magic link by token
 */
export async function findValidMagicLinkByToken(
  db: D1Database,
  token: string
): Promise<MagicLink | null> {
  const now = nowUnix();

  return db
    .prepare(
      `SELECT * FROM magic_links 
       WHERE token = ? AND used_at IS NULL AND expires_at > ?`
    )
    .bind(token, now)
    .first<MagicLink>();
}

/**
 * Mark a magic link as used
 */
export async function markMagicLinkAsUsed(
  db: D1Database,
  id: string
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare("UPDATE magic_links SET used_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
}

/**
 * Count recent magic links for an email (for rate limiting)
 * Returns count of magic links created in the last hour
 */
export async function countRecentMagicLinks(
  db: D1Database,
  email: string,
  windowSeconds: number = 3600
): Promise<number> {
  const cutoff = nowUnix() - windowSeconds;

  const result = await db
    .prepare(
      `SELECT COUNT(*) as count FROM magic_links 
       WHERE email = ? AND created_at > ?`
    )
    .bind(email, cutoff)
    .first<{ count: number }>();

  return result?.count ?? 0;
}

/**
 * Delete expired magic links (cleanup)
 */
export async function deleteExpiredMagicLinks(db: D1Database): Promise<number> {
  const now = nowUnix();

  const result = await db
    .prepare("DELETE FROM magic_links WHERE expires_at < ?")
    .bind(now)
    .run();

  return result.meta.changes;
}

// ============================================================================
// Session Queries
// ============================================================================

/**
 * Create a new session
 */
export async function createSession(
  db: D1Database,
  input: CreateSessionInput
): Promise<Session> {
  const now = nowUnix();

  await db
    .prepare(
      `INSERT INTO sessions (id, organizer_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(input.id, input.organizer_id, input.token, input.expires_at, now)
    .run();

  const session = await findSessionById(db, input.id);
  if (!session) {
    throw new Error("Failed to create session");
  }

  return session;
}

/**
 * Find a session by ID
 */
export async function findSessionById(
  db: D1Database,
  id: string
): Promise<Session | null> {
  return db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(id)
    .first<Session>();
}

/**
 * Find a session by token
 */
export async function findSessionByToken(
  db: D1Database,
  token: string
): Promise<Session | null> {
  return db
    .prepare("SELECT * FROM sessions WHERE token = ?")
    .bind(token)
    .first<Session>();
}

/**
 * Find a valid (not expired) session by token
 */
export async function findValidSessionByToken(
  db: D1Database,
  token: string
): Promise<Session | null> {
  const now = nowUnix();

  return db
    .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > ?")
    .bind(token, now)
    .first<Session>();
}

/**
 * Find a valid session with organizer data
 */
export async function findValidSessionWithOrganizer(
  db: D1Database,
  token: string
): Promise<{ session: Session; organizer: Organizer } | null> {
  const session = await findValidSessionByToken(db, token);
  if (!session) {
    return null;
  }

  const organizer = await findOrganizerById(db, session.organizer_id);
  if (!organizer) {
    return null;
  }

  return { session, organizer };
}

/**
 * Delete a session by ID
 */
export async function deleteSession(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

/**
 * Delete a session by token
 */
export async function deleteSessionByToken(
  db: D1Database,
  token: string
): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}

/**
 * Delete all sessions for an organizer
 */
export async function deleteOrganizerSessions(
  db: D1Database,
  organizerId: string
): Promise<number> {
  const result = await db
    .prepare("DELETE FROM sessions WHERE organizer_id = ?")
    .bind(organizerId)
    .run();

  return result.meta.changes;
}

/**
 * Delete expired sessions (cleanup)
 */
export async function deleteExpiredSessions(db: D1Database): Promise<number> {
  const now = nowUnix();

  const result = await db
    .prepare("DELETE FROM sessions WHERE expires_at < ?")
    .bind(now)
    .run();

  return result.meta.changes;
}

/**
 * Extend a session's expiration time
 */
export async function extendSession(
  db: D1Database,
  id: string,
  newExpiresAt: number
): Promise<void> {
  await db
    .prepare("UPDATE sessions SET expires_at = ? WHERE id = ?")
    .bind(newExpiresAt, id)
    .run();
}

// ============================================================================
// Exchange Queries
// ============================================================================

/**
 * Find an exchange by ID
 */
export async function findExchangeById(
  db: D1Database,
  id: string
): Promise<Exchange | null> {
  return db
    .prepare("SELECT * FROM exchanges WHERE id = ?")
    .bind(id)
    .first<Exchange>();
}

/**
 * Find an exchange by ID, ensuring it belongs to the given organizer
 */
export async function findExchangeByIdForOrganizer(
  db: D1Database,
  id: string,
  organizerId: string
): Promise<Exchange | null> {
  return db
    .prepare("SELECT * FROM exchanges WHERE id = ? AND organizer_id = ?")
    .bind(id, organizerId)
    .first<Exchange>();
}

/**
 * List all exchanges for an organizer, ordered by most recent first
 */
export async function listExchangesByOrganizer(
  db: D1Database,
  organizerId: string
): Promise<Exchange[]> {
  const result = await db
    .prepare(
      "SELECT * FROM exchanges WHERE organizer_id = ? ORDER BY created_at DESC"
    )
    .bind(organizerId)
    .all<Exchange>();

  return result.results;
}

/**
 * Create a new exchange
 */
export async function createExchange(
  db: D1Database,
  input: CreateExchangeInput
): Promise<Exchange> {
  const now = nowUnix();

  await db
    .prepare(
      `INSERT INTO exchanges (id, organizer_id, title, description, budget_min, budget_max, exchange_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.organizer_id,
      input.title,
      input.description ?? null,
      input.budget_min ?? null,
      input.budget_max ?? null,
      input.exchange_date ?? null,
      input.status ?? "draft",
      now,
      now
    )
    .run();

  const exchange = await findExchangeById(db, input.id);
  if (!exchange) {
    throw new Error("Failed to create exchange");
  }

  return exchange;
}

/**
 * Update an exchange
 */
export async function updateExchange(
  db: D1Database,
  id: string,
  input: UpdateExchangeInput
): Promise<Exchange> {
  const existing = await findExchangeById(db, id);
  if (!existing) {
    throw new Error("Exchange not found");
  }

  const now = nowUnix();

  await db
    .prepare(
      `UPDATE exchanges SET 
        title = ?, 
        description = ?, 
        budget_min = ?, 
        budget_max = ?, 
        exchange_date = ?, 
        status = ?,
        shuffled_at = ?,
        secrets_sent_at = ?,
        updated_at = ?
       WHERE id = ?`
    )
    .bind(
      input.title ?? existing.title,
      input.description !== undefined ? input.description : existing.description,
      input.budget_min !== undefined ? input.budget_min : existing.budget_min,
      input.budget_max !== undefined ? input.budget_max : existing.budget_max,
      input.exchange_date !== undefined ? input.exchange_date : existing.exchange_date,
      input.status ?? existing.status,
      input.shuffled_at !== undefined ? input.shuffled_at : existing.shuffled_at,
      input.secrets_sent_at !== undefined ? input.secrets_sent_at : existing.secrets_sent_at,
      now,
      id
    )
    .run();

  const updated = await findExchangeById(db, id);
  if (!updated) {
    throw new Error("Failed to update exchange");
  }

  return updated;
}

/**
 * Update exchange status
 */
export async function updateExchangeStatus(
  db: D1Database,
  id: string,
  status: ExchangeStatus
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare("UPDATE exchanges SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, now, id)
    .run();
}

/**
 * Delete an exchange and all associated data (cascades via FK)
 */
export async function deleteExchange(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM exchanges WHERE id = ?").bind(id).run();
}

// ============================================================================
// Participant Queries
// ============================================================================

/**
 * Find a participant by ID
 */
export async function findParticipantById(
  db: D1Database,
  id: string
): Promise<Participant | null> {
  return db
    .prepare("SELECT * FROM participants WHERE id = ?")
    .bind(id)
    .first<Participant>();
}

/**
 * Find a participant by token (for questionnaire access)
 */
export async function findParticipantByToken(
  db: D1Database,
  token: string
): Promise<Participant | null> {
  return db
    .prepare("SELECT * FROM participants WHERE token = ?")
    .bind(token)
    .first<Participant>();
}

/**
 * Find a participant by email within an exchange
 */
export async function findParticipantByExchangeAndEmail(
  db: D1Database,
  exchangeId: string,
  email: string
): Promise<Participant | null> {
  return db
    .prepare("SELECT * FROM participants WHERE exchange_id = ? AND email = ?")
    .bind(exchangeId, email)
    .first<Participant>();
}

/**
 * List all participants for an exchange
 */
export async function listParticipantsByExchange(
  db: D1Database,
  exchangeId: string
): Promise<Participant[]> {
  const result = await db
    .prepare(
      "SELECT * FROM participants WHERE exchange_id = ? ORDER BY created_at ASC"
    )
    .bind(exchangeId)
    .all<Participant>();

  return result.results;
}

/**
 * Count participants in an exchange
 */
export async function countParticipantsByExchange(
  db: D1Database,
  exchangeId: string
): Promise<number> {
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM participants WHERE exchange_id = ?")
    .bind(exchangeId)
    .first<{ count: number }>();

  return result?.count ?? 0;
}

/**
 * Count participants who have completed the questionnaire
 */
export async function countCompletedQuestionnaires(
  db: D1Database,
  exchangeId: string
): Promise<number> {
  const result = await db
    .prepare(
      "SELECT COUNT(*) as count FROM participants WHERE exchange_id = ? AND questionnaire_completed_at IS NOT NULL"
    )
    .bind(exchangeId)
    .first<{ count: number }>();

  return result?.count ?? 0;
}

/**
 * Check if all participants have completed their questionnaires
 */
export async function areAllQuestionnairesComplete(
  db: D1Database,
  exchangeId: string
): Promise<boolean> {
  const total = await countParticipantsByExchange(db, exchangeId);
  const completed = await countCompletedQuestionnaires(db, exchangeId);
  return total > 0 && total === completed;
}

/**
 * Create a new participant
 */
export async function createParticipant(
  db: D1Database,
  input: CreateParticipantInput
): Promise<Participant> {
  const now = nowUnix();

  await db
    .prepare(
      `INSERT INTO participants (id, exchange_id, email, name, token, is_organizer, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.id,
      input.exchange_id,
      input.email,
      input.name ?? null,
      input.token,
      input.is_organizer ? 1 : 0,
      now,
      now
    )
    .run();

  const participant = await findParticipantById(db, input.id);
  if (!participant) {
    throw new Error("Failed to create participant");
  }

  return participant;
}

/**
 * Update a participant's email
 */
export async function updateParticipantEmail(
  db: D1Database,
  id: string,
  email: string
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare("UPDATE participants SET email = ?, updated_at = ? WHERE id = ?")
    .bind(email, now, id)
    .run();
}

/**
 * Update a participant's name
 */
export async function updateParticipantName(
  db: D1Database,
  id: string,
  name: string
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare("UPDATE participants SET name = ?, updated_at = ? WHERE id = ?")
    .bind(name, now, id)
    .run();
}

/**
 * Mark a participant's questionnaire as completed
 */
export async function markQuestionnaireCompleted(
  db: D1Database,
  participantId: string
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare(
      "UPDATE participants SET questionnaire_completed_at = ?, updated_at = ? WHERE id = ?"
    )
    .bind(now, now, participantId)
    .run();
}

/**
 * Assign a recipient to a participant (Secret Santa assignment)
 */
export async function assignRecipient(
  db: D1Database,
  participantId: string,
  recipientId: string
): Promise<void> {
  const now = nowUnix();

  await db
    .prepare(
      "UPDATE participants SET assigned_recipient_id = ?, updated_at = ? WHERE id = ?"
    )
    .bind(recipientId, now, participantId)
    .run();
}

/**
 * Delete a participant
 */
export async function deleteParticipant(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare("DELETE FROM participants WHERE id = ?").bind(id).run();
}

// ============================================================================
// Questionnaire Queries
// ============================================================================

/**
 * Find a questionnaire by participant ID
 */
export async function findQuestionnaireByParticipant(
  db: D1Database,
  participantId: string
): Promise<Questionnaire | null> {
  return db
    .prepare("SELECT * FROM questionnaires WHERE participant_id = ?")
    .bind(participantId)
    .first<Questionnaire>();
}

/**
 * Create or update a questionnaire (upsert)
 */
export async function upsertQuestionnaire(
  db: D1Database,
  input: QuestionnaireInput
): Promise<Questionnaire> {
  const now = nowUnix();
  const existing = await findQuestionnaireByParticipant(db, input.participant_id);

  if (existing) {
    // Update existing questionnaire
    await db
      .prepare(
        `UPDATE questionnaires SET
          name = ?,
          never_buy_myself = ?,
          please_no = ?,
          spare_time = ?,
          other_loves = ?,
          favorite_color = ?,
          favorite_sports_team = ?,
          favorite_pattern = ?,
          favorite_supplies = ?,
          favorite_snacks = ?,
          favorite_beverages = ?,
          favorite_candy = ?,
          favorite_fragrances = ?,
          favorite_restaurant = ?,
          favorite_store = ?,
          favorite_christmas_movie = ?,
          favorite_christmas_song = ?,
          updated_at = ?
         WHERE participant_id = ?`
      )
      .bind(
        input.name,
        input.never_buy_myself ?? null,
        input.please_no ?? null,
        input.spare_time ?? null,
        input.other_loves ?? null,
        input.favorite_color ?? null,
        input.favorite_sports_team ?? null,
        input.favorite_pattern ?? null,
        input.favorite_supplies ?? null,
        input.favorite_snacks ?? null,
        input.favorite_beverages ?? null,
        input.favorite_candy ?? null,
        input.favorite_fragrances ?? null,
        input.favorite_restaurant ?? null,
        input.favorite_store ?? null,
        input.favorite_christmas_movie ?? null,
        input.favorite_christmas_song ?? null,
        now,
        input.participant_id
      )
      .run();
  } else {
    // Create new questionnaire
    await db
      .prepare(
        `INSERT INTO questionnaires (
          id, participant_id, name,
          never_buy_myself, please_no, spare_time, other_loves,
          favorite_color, favorite_sports_team, favorite_pattern, favorite_supplies,
          favorite_snacks, favorite_beverages, favorite_candy, favorite_fragrances,
          favorite_restaurant, favorite_store, favorite_christmas_movie, favorite_christmas_song,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        input.id,
        input.participant_id,
        input.name,
        input.never_buy_myself ?? null,
        input.please_no ?? null,
        input.spare_time ?? null,
        input.other_loves ?? null,
        input.favorite_color ?? null,
        input.favorite_sports_team ?? null,
        input.favorite_pattern ?? null,
        input.favorite_supplies ?? null,
        input.favorite_snacks ?? null,
        input.favorite_beverages ?? null,
        input.favorite_candy ?? null,
        input.favorite_fragrances ?? null,
        input.favorite_restaurant ?? null,
        input.favorite_store ?? null,
        input.favorite_christmas_movie ?? null,
        input.favorite_christmas_song ?? null,
        now,
        now
      )
      .run();
  }

  const questionnaire = await findQuestionnaireByParticipant(db, input.participant_id);
  if (!questionnaire) {
    throw new Error("Failed to save questionnaire");
  }

  return questionnaire;
}
