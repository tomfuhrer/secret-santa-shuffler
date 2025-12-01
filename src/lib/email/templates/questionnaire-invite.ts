/**
 * Questionnaire Invite Email Template
 *
 * Sent to participants when they're added to a Secret Santa event.
 * Contains a link to fill out their gift preferences questionnaire.
 */

import {
  wrapInBaseTemplate,
  createButton,
  createHeading,
  createParagraph,
  createSmallText,
  createDivider,
  createInfoBox,
  htmlToPlainText,
  escapeHtml,
  EMAIL_COLORS,
  type RenderedEmail,
} from "./base";

/**
 * Questionnaire invite email data
 */
export interface QuestionnaireInviteTemplateData {
  questionnaireUrl: string;
  participantName?: string;
  eventTitle: string;
  organizerName?: string;
  budgetMin?: number;
  budgetMax?: number;
  exchangeDate?: string;
}

/**
 * Format budget range for display
 */
function formatBudget(min?: number, max?: number): string | null {
  if (min && max) {
    return `$${min} - $${max}`;
  }
  if (min) {
    return `$${min}+`;
  }
  if (max) {
    return `Up to $${max}`;
  }
  return null;
}

/**
 * Format date for display
 */
function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Renders the questionnaire invite email
 */
export function renderQuestionnaireInviteEmail(
  data: QuestionnaireInviteTemplateData
): RenderedEmail {
  const greeting = data.participantName
    ? `Hello ${escapeHtml(data.participantName)}!`
    : "Hello!";

  const organizerText = data.organizerName
    ? `<strong>${escapeHtml(data.organizerName)}</strong> has`
    : "You've been";

  const subject = `🎁 You're Invited! Join "${data.eventTitle}" Secret Santa`;

  const budget = formatBudget(data.budgetMin, data.budgetMax);
  const exchangeDate = formatDate(data.exchangeDate);

  // Build event details section
  let eventDetails = "";
  if (budget || exchangeDate) {
    const detailItems: string[] = [];

    if (exchangeDate) {
      detailItems.push(`
        <tr>
          <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">📅 Exchange Date:</td>
          <td style="padding: 8px 0 8px 15px; color: ${EMAIL_COLORS.textDark}; font-size: 14px; font-weight: 600;">${escapeHtml(exchangeDate)}</td>
        </tr>
      `);
    }

    if (budget) {
      detailItems.push(`
        <tr>
          <td style="padding: 8px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">💰 Gift Budget:</td>
          <td style="padding: 8px 0 8px 15px; color: ${EMAIL_COLORS.textDark}; font-size: 14px; font-weight: 600;">${escapeHtml(budget)}</td>
        </tr>
      `);
    }

    eventDetails = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 20px; background-color: ${EMAIL_COLORS.cream}; border-radius: 12px;">
            <p style="margin: 0 0 15px 0; color: ${EMAIL_COLORS.christmasRed}; font-size: 16px; font-weight: 600;">
              📋 Event Details
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              ${detailItems.join("")}
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  const content = `
    ${createHeading("You're Invited! 🎉")}
    
    ${createParagraph(greeting, { centered: true })}
    
    ${createParagraph(
      `${organizerText} invited you to participate in <strong>"${escapeHtml(data.eventTitle)}"</strong> - a Secret Santa gift exchange!`,
      { centered: true }
    )}
    
    ${createParagraph(
      "To help your Secret Santa find the perfect gift for you, please fill out a quick questionnaire about your preferences and favorites.",
      { centered: true }
    )}
    
    ${createButton("📝 Fill Out My Questionnaire", data.questionnaireUrl)}
    
    ${eventDetails}
    
    ${createDivider()}
    
    ${createInfoBox(`
      <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
        ✨ How It Works
      </p>
      <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
        <li>Fill out the questionnaire with your gift preferences</li>
        <li>Wait for all participants to complete their questionnaires</li>
        <li>Once everyone's ready, you'll receive your Secret Santa assignment!</li>
      </ol>
    `)}
    
    ${createSmallText(
      "Your questionnaire link is unique to you - please don't share it with others."
    )}
  `;

  const html = wrapInBaseTemplate(content, {
    preheader: `You've been invited to "${data.eventTitle}" Secret Santa! Fill out your questionnaire.`,
  });

  // Generate plain text version
  const budgetText = budget ? `Gift Budget: ${budget}` : "";
  const dateText = exchangeDate ? `Exchange Date: ${exchangeDate}` : "";
  const detailsText = [budgetText, dateText].filter(Boolean).join("\n");

  const plainTextContent = `
Secret Santa Shuffler - You're Invited!
=======================================

${greeting}

${data.organizerName ? `${data.organizerName} has` : "You've been"} invited you to participate in "${data.eventTitle}" - a Secret Santa gift exchange!

To help your Secret Santa find the perfect gift for you, please fill out a quick questionnaire about your preferences and favorites.

Fill Out Your Questionnaire: ${data.questionnaireUrl}

${detailsText ? `---\n\nEvent Details:\n${detailsText}\n` : ""}
---

✨ How It Works:
1. Fill out the questionnaire with your gift preferences
2. Wait for all participants to complete their questionnaires
3. Once everyone's ready, you'll receive your Secret Santa assignment!

---

Note: Your questionnaire link is unique to you - please don't share it with others.

🎄 Spreading holiday cheer, one gift at a time! 🎄
Secret Santa Shuffler • Making gift exchanges magical
  `.trim();

  return {
    subject,
    html,
    text: plainTextContent,
  };
}