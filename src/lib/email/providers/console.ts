/**
 * Console Email Provider
 *
 * Development/testing provider that logs emails to the console
 * instead of actually sending them. Useful for local development
 * and testing without needing API keys.
 */

import type { EmailMessage, EmailProvider, EmailResult } from "../types";

/**
 * Console Email Provider
 *
 * Logs email content to the console for development purposes.
 * Always returns success.
 */
export class ConsoleProvider implements EmailProvider {
  readonly name = "console";

  /**
   * Log an email to the console instead of sending it
   */
  async send(message: EmailMessage): Promise<EmailResult> {
    const timestamp = new Date().toISOString();
    const messageId = `console-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log("\n" + "=".repeat(60));
    console.log("📧 EMAIL (Console Provider - Not Actually Sent)");
    console.log("=".repeat(60));
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Message ID: ${messageId}`);
    console.log("-".repeat(60));
    console.log(`From: ${this.formatAddress(message.from)}`);
    console.log(`To: ${this.formatAddress(message.to)}`);
    if (message.replyTo) {
      console.log(`Reply-To: ${this.formatAddress(message.replyTo)}`);
    }
    console.log(`Subject: ${message.subject}`);
    if (message.tags && Object.keys(message.tags).length > 0) {
      console.log(`Tags: ${JSON.stringify(message.tags)}`);
    }
    console.log("-".repeat(60));
    console.log("HTML Content:");
    console.log(this.stripHtml(message.html));
    if (message.text) {
      console.log("-".repeat(60));
      console.log("Plain Text Content:");
      console.log(message.text);
    }
    console.log("=".repeat(60) + "\n");

    return {
      success: true,
      messageId,
    };
  }

  /**
   * Format an email address for display
   */
  private formatAddress(
    address: string | { email: string; name?: string }
  ): string {
    if (typeof address === "string") {
      return address;
    }

    if (address.name) {
      return `${address.name} <${address.email}>`;
    }

    return address.email;
  }

  /**
   * Strip HTML tags for console-friendly output
   */
  private stripHtml(html: string): string {
    return html
      // Replace common HTML elements with text equivalents
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<li>/gi, "  • ")
      .replace(/<\/li>/gi, "\n")
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up extra whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

/**
 * Create a console provider instance
 */
export function createConsoleProvider(): ConsoleProvider {
  return new ConsoleProvider();
}