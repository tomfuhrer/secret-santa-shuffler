/**
 * Resend Email Provider
 *
 * Implementation of EmailProvider interface for Resend (https://resend.com)
 * Resend is a modern email API designed for developers.
 */

import type { EmailMessage, EmailProvider, EmailResult } from "../types";

/**
 * Resend API endpoint
 */
const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Resend provider configuration
 */
export interface ResendProviderConfig {
  apiKey: string;
}

/**
 * Resend API response shape
 */
interface ResendApiResponse {
  id?: string;
  error?: {
    message: string;
    name?: string;
  };
}

/**
 * Resend Email Provider
 *
 * Sends emails via the Resend API using fetch.
 * Does not require the Resend SDK - uses raw HTTP requests.
 */
export class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private apiKey: string;

  constructor(config: ResendProviderConfig) {
    if (!config.apiKey) {
      throw new Error("Resend API key is required");
    }
    this.apiKey = config.apiKey;
  }

  /**
   * Send an email via Resend API
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    try {
      // Format from/to addresses
      const from = this.formatAddress(message.from);
      const to = this.formatAddress(message.to);
      const replyTo = message.replyTo
        ? this.formatAddress(message.replyTo)
        : undefined;

      // Build request body
      const body: Record<string, unknown> = {
        from,
        to: [to],
        subject: message.subject,
        html: message.html,
      };

      if (message.text) {
        body.text = message.text;
      }

      if (replyTo) {
        body.reply_to = replyTo;
      }

      if (message.tags && Object.keys(message.tags).length > 0) {
        // Resend supports tags as an array of { name, value } objects
        body.tags = Object.entries(message.tags).map(([name, value]) => ({
          name,
          value,
        }));
      }

      // Make API request
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as ResendApiResponse;

      if (!response.ok || data.error) {
        const errorMessage =
          data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error("[Resend] Failed to send email:", errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log("[Resend] Email sent successfully:", data.id);
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[Resend] Error sending email:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Format an email address for the Resend API
   * Accepts either a string or an EmailAddress object
   */
  private formatAddress(
    address: string | { email: string; name?: string }
  ): string {
    if (typeof address === "string") {
      return address;
    }

    if (address.name) {
      // Format: "Name <email@example.com>"
      return `${address.name} <${address.email}>`;
    }

    return address.email;
  }
}

/**
 * Create a Resend provider instance
 */
export function createResendProvider(apiKey: string): ResendProvider {
  return new ResendProvider({ apiKey });
}