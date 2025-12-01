/**
 * Email Service Type Definitions
 *
 * Defines interfaces for the email abstraction layer,
 * allowing easy migration between providers (Resend, Cloudflare Email, etc.)
 */

/**
 * Email address with optional display name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Base email message structure
 */
export interface EmailMessage {
  to: string | EmailAddress;
  from: string | EmailAddress;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | EmailAddress;
  tags?: Record<string, string>;
}

/**
 * Result of sending an email
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email provider interface - implement this for each email service
 */
export interface EmailProvider {
  /**
   * Send a single email
   */
  send(message: EmailMessage): Promise<EmailResult>;

  /**
   * Provider name for logging/debugging
   */
  readonly name: string;
}

/**
 * Supported email provider types
 */
export type EmailProviderType = "resend" | "cloudflare" | "console";

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  provider: EmailProviderType;
  apiKey?: string;
  fromEmail: string;
  fromName?: string;
  baseUrl: string; // App base URL for generating links
}

/**
 * Magic link email data
 */
export interface MagicLinkEmailData {
  email: string;
  token: string;
  expiresInMinutes?: number;
}

/**
 * Questionnaire invite email data
 */
export interface QuestionnaireInviteEmailData {
  email: string;
  participantName?: string;
  eventTitle: string;
  organizerName?: string;
  token: string;
  budgetMin?: number;
  budgetMax?: number;
  exchangeDate?: string;
}

/**
 * All complete notification email data (sent to organizer)
 */
export interface AllCompleteEmailData {
  organizerEmail: string;
  organizerName?: string;
  eventTitle: string;
  eventId: string;
  participantCount: number;
}

/**
 * Secret Santa assignment email data
 */
export interface SecretSantaAssignmentEmailData {
  santaEmail: string;
  santaName?: string;
  recipientName: string;
  eventTitle: string;
  organizerName?: string;
  budgetMin?: number;
  budgetMax?: number;
  exchangeDate?: string;
  questionnaire: {
    name: string;
    neverBuyMyself?: string;
    pleaseNo?: string;
    spareTime?: string;
    otherLoves?: string;
    favoriteColor?: string;
    favoriteSportsTeam?: string;
    favoritePattern?: string;
    favoriteSupplies?: string;
    favoriteSnacks?: string;
    favoriteBeverages?: string;
    favoriteCandy?: string;
    favoriteFragrances?: string;
    favoriteRestaurant?: string;
    favoriteStore?: string;
    favoriteChristmasMovie?: string;
    favoriteChristmasSong?: string;
  };
}

/**
 * Email template types
 */
export type EmailTemplate =
  | "magic-link"
  | "questionnaire-invite"
  | "all-complete"
  | "secret-santa-assignment";