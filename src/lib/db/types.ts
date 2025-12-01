/**
 * Database Type Definitions
 *
 * TypeScript types matching the D1 database schema.
 * All timestamps are stored as Unix timestamps (seconds).
 */

/**
 * Organizer - authenticated user who creates exchanges
 */
export interface Organizer {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating a new organizer
 */
export interface CreateOrganizerInput {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * Magic Link - passwordless authentication token
 */
export interface MagicLink {
  id: string;
  organizer_id: string | null;
  email: string;
  token: string;
  expires_at: number;
  used_at: number | null;
  created_at: number;
}

/**
 * Input for creating a new magic link
 */
export interface CreateMagicLinkInput {
  id: string;
  organizer_id?: string | null;
  email: string;
  token: string;
  expires_at: number;
}

/**
 * Exchange status values
 */
export type ExchangeStatus = "draft" | "collecting" | "ready" | "shuffled" | "complete";

/**
 * Exchange - a gift exchange
 */
export interface Exchange {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  budget_min: number | null;
  budget_max: number | null;
  exchange_date: string | null;
  status: ExchangeStatus;
  shuffled_at: number | null;
  secrets_sent_at: number | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating a new exchange
 */
export interface CreateExchangeInput {
  id: string;
  organizer_id: string;
  title: string;
  description?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  exchange_date?: string | null;
  status?: ExchangeStatus;
}

/**
 * Input for updating an exchange
 */
export interface UpdateExchangeInput {
  title?: string;
  description?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  exchange_date?: string | null;
  status?: ExchangeStatus;
  shuffled_at?: number | null;
  secrets_sent_at?: number | null;
}

/**
 * Participant - a person in an exchange
 */
export interface Participant {
  id: string;
  exchange_id: string;
  email: string;
  name: string | null;
  token: string;
  is_organizer: number; // SQLite stores booleans as 0/1
  questionnaire_completed_at: number | null;
  assigned_recipient_id: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating a new participant
 */
export interface CreateParticipantInput {
  id: string;
  exchange_id: string;
  email: string;
  name?: string | null;
  token: string;
  is_organizer?: boolean;
}

/**
 * Questionnaire - participant's gift preferences
 */
export interface Questionnaire {
  id: string;
  participant_id: string;
  name: string;
  never_buy_myself: string | null;
  please_no: string | null;
  spare_time: string | null;
  other_loves: string | null;
  favorite_color: string | null;
  favorite_sports_team: string | null;
  favorite_pattern: string | null;
  favorite_supplies: string | null;
  favorite_snacks: string | null;
  favorite_beverages: string | null;
  favorite_candy: string | null;
  favorite_fragrances: string | null;
  favorite_restaurant: string | null;
  favorite_store: string | null;
  favorite_christmas_movie: string | null;
  favorite_christmas_song: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Input for creating/updating a questionnaire
 */
export interface QuestionnaireInput {
  id: string;
  participant_id: string;
  name: string;
  never_buy_myself?: string | null;
  please_no?: string | null;
  spare_time?: string | null;
  other_loves?: string | null;
  favorite_color?: string | null;
  favorite_sports_team?: string | null;
  favorite_pattern?: string | null;
  favorite_supplies?: string | null;
  favorite_snacks?: string | null;
  favorite_beverages?: string | null;
  favorite_candy?: string | null;
  favorite_fragrances?: string | null;
  favorite_restaurant?: string | null;
  favorite_store?: string | null;
  favorite_christmas_movie?: string | null;
  favorite_christmas_song?: string | null;
}

/**
 * Session - organizer authentication session
 */
export interface Session {
  id: string;
  organizer_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

/**
 * Input for creating a new session
 */
export interface CreateSessionInput {
  id: string;
  organizer_id: string;
  token: string;
  expires_at: number;
}

/**
 * D1 Database binding type
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
    served_by: string;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Cloudflare environment bindings
 */
export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  BASE_URL?: string;
}
