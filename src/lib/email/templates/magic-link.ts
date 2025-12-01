/**
 * Magic Link Email Template
 *
 * Sent to users requesting passwordless authentication.
 * Contains a secure link that expires after a short time.
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
  type RenderedEmail,
} from "./base";

/**
 * Magic link email data
 */
export interface MagicLinkTemplateData {
  magicLinkUrl: string;
  expiresInMinutes: number;
}

/**
 * Renders the magic link email
 */
export function renderMagicLinkEmail(
  data: MagicLinkTemplateData
): RenderedEmail {
  const subject = "🎅 Your Magic Sign-In Link - Secret Santa Shuffler";

  const content = `
    ${createHeading("Welcome Back!")}
    
    ${createParagraph(
      "Someone requested a magic sign-in link for your Secret Santa Shuffler account. If this was you, click the button below to sign in instantly!",
      { centered: true }
    )}
    
    ${createButton("✨ Sign In to Secret Santa", data.magicLinkUrl)}
    
    ${createSmallText(
      `This link will expire in <strong>${data.expiresInMinutes} minutes</strong> for your security.`
    )}
    
    ${createDivider()}
    
    ${createInfoBox(`
      <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600;">
        🔒 Security Note
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
        If you didn't request this sign-in link, you can safely ignore this email. 
        Your account is secure and no action is needed.
      </p>
    `)}
    
    ${createSmallText(
      "Having trouble with the button? Copy and paste this link into your browser:"
    )}
    <p style="margin: 8px 0 0 0; word-break: break-all; font-size: 12px; color: #6b7280; text-align: center; background-color: #f3f4f6; padding: 12px; border-radius: 8px;">
      ${escapeHtml(data.magicLinkUrl)}
    </p>
  `;

  const html = wrapInBaseTemplate(content, {
    preheader: `Sign in to Secret Santa Shuffler - link expires in ${data.expiresInMinutes} minutes`,
  });

  // Generate plain text version
  const plainTextContent = `
Secret Santa Shuffler - Magic Sign-In Link
==========================================

Welcome Back!

Someone requested a magic sign-in link for your Secret Santa Shuffler account. 
If this was you, click the link below to sign in instantly!

Sign In Link: ${data.magicLinkUrl}

⚠️  This link will expire in ${data.expiresInMinutes} minutes for your security.

---

🔒 Security Note:
If you didn't request this sign-in link, you can safely ignore this email. 
Your account is secure and no action is needed.

---

🎄 Spreading holiday cheer, one gift at a time! 🎄
Secret Santa Shuffler • Making gift exchanges magical
  `.trim();

  return {
    subject,
    html,
    text: plainTextContent,
  };
}