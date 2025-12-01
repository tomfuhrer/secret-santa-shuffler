/**
 * All Questionnaires Complete Email Template
 *
 * Sent to the organizer when all participants have completed their questionnaires.
 * Includes a link to the event page where they can trigger the shuffle.
 */

import {
  wrapInBaseTemplate,
  createButton,
  createHeading,
  createParagraph,
  createSmallText,
  createDivider,
  createInfoBox,
  escapeHtml,
  EMAIL_COLORS,
  type RenderedEmail,
} from "./base";

/**
 * All complete notification email data
 */
export interface AllCompleteTemplateData {
  eventUrl: string;
  eventTitle: string;
  organizerName?: string;
  participantCount: number;
}

/**
 * Renders the all questionnaires complete notification email
 */
export function renderAllCompleteEmail(
  data: AllCompleteTemplateData
): RenderedEmail {
  const greeting = data.organizerName
    ? `Great news, ${escapeHtml(data.organizerName)}!`
    : "Great news!";

  const subject = `🎉 All Ready! "${data.eventTitle}" - Time to Shuffle!`;

  const content = `
    ${createHeading("Everyone's Ready! 🎊")}
    
    ${createParagraph(greeting, { centered: true })}
    
    ${createParagraph(
      `All <strong>${data.participantCount} participants</strong> in <strong>"${escapeHtml(data.eventTitle)}"</strong> have completed their questionnaires!`,
      { centered: true }
    )}
    
    ${createParagraph(
      "It's time for the magical moment - you can now shuffle the assignments and send everyone their Secret Santa match!",
      { centered: true }
    )}
    
    ${createButton("🎲 Shuffle & Send Assignments", data.eventUrl)}
    
    ${createDivider()}
    
    ${createInfoBox(`
      <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
        🎁 What Happens Next
      </p>
      <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
        <li>Click the button above to visit your event page</li>
        <li>Review that everyone's accounted for</li>
        <li>Click "Shuffle" to randomly assign Secret Santas</li>
        <li>Each participant will receive an email with their assignment!</li>
      </ol>
    `)}
    
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
      <tr>
        <td align="center" style="padding: 20px; background-color: ${EMAIL_COLORS.cream}; border-radius: 12px;">
          <p style="margin: 0; color: ${EMAIL_COLORS.forestGreen}; font-size: 48px;">
            ✨🎅✨
          </p>
          <p style="margin: 10px 0 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px; font-style: italic;">
            The holiday magic is ready to begin!
          </p>
        </td>
      </tr>
    </table>
    
    ${createSmallText(
      "Once you shuffle and send assignments, participants will be able to see their recipient's questionnaire and start planning the perfect gift."
    )}
  `;

  const html = wrapInBaseTemplate(content, {
    preheader: `All ${data.participantCount} participants are ready! Time to shuffle "${data.eventTitle}"`,
  });

  // Generate plain text version
  const plainTextContent = `
Secret Santa Shuffler - Everyone's Ready!
=========================================

${greeting}

All ${data.participantCount} participants in "${data.eventTitle}" have completed their questionnaires!

It's time for the magical moment - you can now shuffle the assignments and send everyone their Secret Santa match!

Shuffle & Send Assignments: ${data.eventUrl}

---

🎁 What Happens Next:
1. Click the link above to visit your event page
2. Review that everyone's accounted for
3. Click "Shuffle" to randomly assign Secret Santas
4. Each participant will receive an email with their assignment!

---

✨🎅✨
The holiday magic is ready to begin!

Once you shuffle and send assignments, participants will be able to see their recipient's questionnaire and start planning the perfect gift.

🎄 Spreading holiday cheer, one gift at a time! 🎄
Secret Santa Shuffler • Making gift exchanges magical
  `.trim();

  return {
    subject,
    html,
    text: plainTextContent,
  };
}