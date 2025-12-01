/**
 * Email Service
 *
 * High-level abstraction layer for sending emails.
 * Provides methods for specific email types (magic links, invites, assignments)
 * and handles provider selection based on configuration.
 */

import type {
  EmailProvider,
  EmailProviderType,
  EmailResult,
  EmailServiceConfig,
  MagicLinkEmailData,
  QuestionnaireInviteEmailData,
  AllCompleteEmailData,
  SecretSantaAssignmentEmailData,
} from "./types";
import { createResendProvider } from "./providers/resend";
import { createConsoleProvider } from "./providers/console";
import {
  renderMagicLinkEmail,
  renderQuestionnaireInviteEmail,
  renderAllCompleteEmail,
  renderSecretSantaAssignmentEmail,
} from "./templates";

/**
 * Email Service
 *
 * Manages email sending through a configurable provider.
 * Provides type-safe methods for each email type used in the application.
 */
export class EmailService {
  private provider: EmailProvider;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }

  /**
   * Create the appropriate email provider based on configuration
   */
  private createProvider(config: EmailServiceConfig): EmailProvider {
    switch (config.provider) {
      case "resend":
        if (!config.apiKey) {
          throw new Error("Resend provider requires an API key");
        }
        return createResendProvider(config.apiKey);

      case "cloudflare":
        // TODO: Implement Cloudflare Email provider when available
        throw new Error("Cloudflare Email provider not yet implemented");

      case "console":
        return createConsoleProvider();

      default:
        throw new Error(`Unknown email provider: ${config.provider}`);
    }
  }

  /**
   * Get the default "from" address for this service
   */
  private getFromAddress(): { email: string; name?: string } {
    return {
      email: this.config.fromEmail,
      name: this.config.fromName,
    };
  }

  /**
   * Get the current provider name (for debugging/logging)
   */
  get providerName(): string {
    return this.provider.name;
  }

  /**
   * Send a magic link email for passwordless authentication
   */
  async sendMagicLink(data: MagicLinkEmailData): Promise<EmailResult> {
    const magicLinkUrl = `${this.config.baseUrl}/auth/verify?token=${data.token}`;

    const { subject, html, text } = renderMagicLinkEmail({
      magicLinkUrl,
      expiresInMinutes: data.expiresInMinutes ?? 15,
    });

    return this.provider.send({
      to: data.email,
      from: this.getFromAddress(),
      subject,
      html,
      text,
      tags: {
        type: "magic-link",
      },
    });
  }

  /**
   * Send a questionnaire invite email to a participant
   */
  async sendQuestionnaireInvite(
    data: QuestionnaireInviteEmailData
  ): Promise<EmailResult> {
    const questionnaireUrl = `${this.config.baseUrl}/q/${data.token}`;

    const { subject, html, text } = renderQuestionnaireInviteEmail({
      questionnaireUrl,
      participantName: data.participantName,
      eventTitle: data.eventTitle,
      organizerName: data.organizerName,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      exchangeDate: data.exchangeDate,
    });

    return this.provider.send({
      to: data.email,
      from: this.getFromAddress(),
      subject,
      html,
      text,
      tags: {
        type: "questionnaire-invite",
        event: data.eventTitle,
      },
    });
  }

  /**
   * Send notification to organizer that all questionnaires are complete
   */
  async sendAllCompleteNotification(
    data: AllCompleteEmailData
  ): Promise<EmailResult> {
    const eventUrl = `${this.config.baseUrl}/events/${data.eventId}`;

    const { subject, html, text } = renderAllCompleteEmail({
      eventUrl,
      eventTitle: data.eventTitle,
      organizerName: data.organizerName,
      participantCount: data.participantCount,
    });

    return this.provider.send({
      to: data.organizerEmail,
      from: this.getFromAddress(),
      subject,
      html,
      text,
      tags: {
        type: "all-complete",
        event: data.eventTitle,
      },
    });
  }

  /**
   * Send Secret Santa assignment email with recipient's questionnaire
   */
  async sendSecretSantaAssignment(
    data: SecretSantaAssignmentEmailData
  ): Promise<EmailResult> {
    const { subject, html, text } = renderSecretSantaAssignmentEmail({
      santaName: data.santaName,
      recipientName: data.recipientName,
      eventTitle: data.eventTitle,
      organizerName: data.organizerName,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      exchangeDate: data.exchangeDate,
      questionnaire: data.questionnaire,
    });

    return this.provider.send({
      to: data.santaEmail,
      from: this.getFromAddress(),
      subject,
      html,
      text,
      tags: {
        type: "secret-santa-assignment",
        event: data.eventTitle,
      },
    });
  }
}

/**
 * Create an EmailService instance from environment configuration
 */
export function createEmailService(options: {
  provider?: EmailProviderType;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
  baseUrl: string;
}): EmailService {
  const provider = options.provider ?? "console";
  const fromEmail = options.fromEmail ?? "santa@example.com";
  const fromName = options.fromName ?? "Secret Santa Shuffler";

  return new EmailService({
    provider,
    apiKey: options.apiKey,
    fromEmail,
    fromName,
    baseUrl: options.baseUrl,
  });
}

/**
 * Create an EmailService from Cloudflare environment bindings
 */
export function createEmailServiceFromEnv(env: {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  BASE_URL?: string;
}): EmailService {
  const hasResendKey = Boolean(env.RESEND_API_KEY);
  const provider: EmailProviderType = hasResendKey ? "resend" : "console";

  if (!hasResendKey) {
    console.warn(
      "[EmailService] RESEND_API_KEY not set, using console provider"
    );
  }

  return createEmailService({
    provider,
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.EMAIL_FROM ?? "santa@example.com",
    fromName: env.EMAIL_FROM_NAME ?? "Secret Santa Shuffler",
    baseUrl: env.BASE_URL ?? "http://localhost:5173",
  });
}