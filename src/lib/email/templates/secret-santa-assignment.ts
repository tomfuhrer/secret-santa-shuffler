/**
 * Secret Santa Assignment Email Template
 *
 * Sent to each participant after the shuffle, revealing their recipient
 * and including the recipient's completed questionnaire to help with gift selection.
 */

import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createSmallText,
  createDivider,
  escapeHtml,
  EMAIL_COLORS,
  type RenderedEmail,
} from "./base";

/**
 * Questionnaire data included in the assignment email
 */
export interface QuestionnaireData {
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
}

/**
 * Secret Santa assignment email data
 */
export interface SecretSantaAssignmentTemplateData {
  santaName?: string;
  recipientName: string;
  eventTitle: string;
  organizerName?: string;
  budgetMin?: number;
  budgetMax?: number;
  exchangeDate?: string;
  questionnaire: QuestionnaireData;
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
 * Create a questionnaire field row for the email
 */
function createQuestionnaireRow(
  label: string,
  value: string | undefined,
  emoji: string
): string {
  if (!value || value.trim() === "") return "";

  return `
    <tr>
      <td style="padding: 12px 15px; background-color: ${EMAIL_COLORS.white}; border-bottom: 1px solid ${EMAIL_COLORS.creamDark};">
        <p style="margin: 0 0 5px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px;">
          ${emoji} ${escapeHtml(label)}
        </p>
        <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 15px; line-height: 1.5;">
          ${escapeHtml(value)}
        </p>
      </td>
    </tr>
  `;
}

/**
 * Create a section header for questionnaire groups
 */
function createSectionHeader(title: string, emoji: string): string {
  return `
    <tr>
      <td style="padding: 15px; background-color: ${EMAIL_COLORS.cream}; border-bottom: 2px solid ${EMAIL_COLORS.forestGreen};">
        <p style="margin: 0; color: ${EMAIL_COLORS.forestGreen}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          ${emoji} ${escapeHtml(title)}
        </p>
      </td>
    </tr>
  `;
}

/**
 * Renders the Secret Santa assignment email
 */
export function renderSecretSantaAssignmentEmail(
  data: SecretSantaAssignmentTemplateData
): RenderedEmail {
  const greeting = data.santaName
    ? `Ho ho ho, ${escapeHtml(data.santaName)}!`
    : "Ho ho ho!";

  const subject = `🎅 Your Secret Santa Assignment for "${data.eventTitle}"!`;

  const budget = formatBudget(data.budgetMin, data.budgetMax);
  const exchangeDate = formatDate(data.exchangeDate);

  // Build event details
  let eventDetailsHtml = "";
  if (budget || exchangeDate) {
    const items: string[] = [];
    if (exchangeDate) {
      items.push(`<span style="margin-right: 20px;">📅 <strong>Date:</strong> ${escapeHtml(exchangeDate)}</span>`);
    }
    if (budget) {
      items.push(`<span>💰 <strong>Budget:</strong> ${escapeHtml(budget)}</span>`);
    }
    eventDetailsHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 15px 20px; background-color: ${EMAIL_COLORS.cream}; border-radius: 12px; text-align: center;">
            <p style="margin: 0; color: ${EMAIL_COLORS.textDark}; font-size: 14px;">
              ${items.join("")}
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  // Build questionnaire sections
  const q = data.questionnaire;

  // Important notes section (things to know/avoid)
  const importantRows = [
    createQuestionnaireRow("Things I'd never buy myself", q.neverBuyMyself, "🎁"),
    createQuestionnaireRow("Please, no...", q.pleaseNo, "🚫"),
  ].join("");

  // About me section
  const aboutRows = [
    createQuestionnaireRow("In my spare time I like to", q.spareTime, "⏰"),
    createQuestionnaireRow("Other things I love", q.otherLoves, "❤️"),
  ].join("");

  // Favorites section
  const favoritesRows = [
    createQuestionnaireRow("Favorite color", q.favoriteColor, "🎨"),
    createQuestionnaireRow("Favorite sports team", q.favoriteSportsTeam, "🏈"),
    createQuestionnaireRow("Favorite pattern", q.favoritePattern, "🔷"),
    createQuestionnaireRow("Favorite supplies", q.favoriteSupplies, "📦"),
  ].join("");

  // Food & drink section
  const foodRows = [
    createQuestionnaireRow("Favorite snacks", q.favoriteSnacks, "🍿"),
    createQuestionnaireRow("Favorite beverages", q.favoriteBeverages, "☕"),
    createQuestionnaireRow("Favorite candy", q.favoriteCandy, "🍬"),
    createQuestionnaireRow("Favorite fragrances", q.favoriteFragrances, "🌸"),
  ].join("");

  // Places section
  const placesRows = [
    createQuestionnaireRow("Favorite restaurant", q.favoriteRestaurant, "🍽️"),
    createQuestionnaireRow("Favorite store", q.favoriteStore, "🛍️"),
  ].join("");

  // Holiday favorites section
  const holidayRows = [
    createQuestionnaireRow("Favorite Christmas movie", q.favoriteChristmasMovie, "🎬"),
    createQuestionnaireRow("Favorite Christmas song", q.favoriteChristmasSong, "🎵"),
  ].join("");

  // Build questionnaire HTML
  const questionnaireHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      ${importantRows ? createSectionHeader("Gift Ideas & No-Gos", "🎯") + importantRows : ""}
      ${aboutRows ? createSectionHeader("About Me", "👤") + aboutRows : ""}
      ${favoritesRows ? createSectionHeader("Favorites", "⭐") + favoritesRows : ""}
      ${foodRows ? createSectionHeader("Food & Drink", "🍪") + foodRows : ""}
      ${placesRows ? createSectionHeader("Favorite Places", "📍") + placesRows : ""}
      ${holidayRows ? createSectionHeader("Holiday Favorites", "🎄") + holidayRows : ""}
    </table>
  `;

  const content = `
    ${createHeading("Your Assignment Is In! 🎅")}
    
    ${createParagraph(greeting, { centered: true })}
    
    ${createParagraph(
      `The elves have been busy, and your Secret Santa assignment for <strong>"${escapeHtml(data.eventTitle)}"</strong> is ready!`,
      { centered: true }
    )}
    
    <!-- Big reveal box -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
      <tr>
        <td style="padding: 30px; background: linear-gradient(135deg, ${EMAIL_COLORS.christmasRed} 0%, ${EMAIL_COLORS.christmasRedDark} 100%); border-radius: 16px; text-align: center;">
          <p style="margin: 0 0 10px 0; color: ${EMAIL_COLORS.white}; font-size: 16px; opacity: 0.9;">
            🎁 You are the Secret Santa for...
          </p>
          <p style="margin: 0; color: ${EMAIL_COLORS.white}; font-size: 36px; font-weight: 700; font-family: Georgia, serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
            ${escapeHtml(data.recipientName)}
          </p>
        </td>
      </tr>
    </table>
    
    ${eventDetailsHtml}
    
    ${createDivider()}
    
    ${createParagraph(
      `<strong>${escapeHtml(data.recipientName)}'s Gift Preferences</strong>`,
      { centered: true }
    )}
    
    ${createParagraph(
      "Here's what they shared to help you find the perfect gift:",
      { centered: true, muted: true }
    )}
    
    ${questionnaireHtml}
    
    ${createDivider()}
    
    ${createSmallText(
      "🤫 Remember: Keep it secret! Don't reveal who you're buying for until the gift exchange."
    )}
  `;

  const html = wrapInBaseTemplate(content, {
    preheader: `Your Secret Santa assignment is in! You're buying a gift for ${data.recipientName}`,
  });

  // Generate plain text version
  const plainTextQuestionnaire = Object.entries({
    "Things I'd never buy myself": q.neverBuyMyself,
    "Please, no...": q.pleaseNo,
    "In my spare time I like to": q.spareTime,
    "Other things I love": q.otherLoves,
    "Favorite color": q.favoriteColor,
    "Favorite sports team": q.favoriteSportsTeam,
    "Favorite pattern": q.favoritePattern,
    "Favorite supplies": q.favoriteSupplies,
    "Favorite snacks": q.favoriteSnacks,
    "Favorite beverages": q.favoriteBeverages,
    "Favorite candy": q.favoriteCandy,
    "Favorite fragrances": q.favoriteFragrances,
    "Favorite restaurant": q.favoriteRestaurant,
    "Favorite store": q.favoriteStore,
    "Favorite Christmas movie": q.favoriteChristmasMovie,
    "Favorite Christmas song": q.favoriteChristmasSong,
  })
    .filter(([, value]) => value && value.trim() !== "")
    .map(([label, value]) => `• ${label}: ${value}`)
    .join("\n");

  const budgetText = budget ? `Gift Budget: ${budget}` : "";
  const dateText = exchangeDate ? `Exchange Date: ${exchangeDate}` : "";
  const detailsText = [budgetText, dateText].filter(Boolean).join("\n");

  const plainTextContent = `
Secret Santa Shuffler - Your Assignment Is In!
==============================================

${greeting}

The elves have been busy, and your Secret Santa assignment for "${data.eventTitle}" is ready!

🎁 YOU ARE THE SECRET SANTA FOR: ${data.recipientName}

${detailsText ? `---\n\n${detailsText}\n` : ""}
---

${data.recipientName}'s Gift Preferences:

${plainTextQuestionnaire}

---

🤫 Remember: Keep it secret! Don't reveal who you're buying for until the gift exchange.

🎄 Spreading holiday cheer, one gift at a time! 🎄
Secret Santa Shuffler • Making gift exchanges magical
  `.trim();

  return {
    subject,
    html,
    text: plainTextContent,
  };
}