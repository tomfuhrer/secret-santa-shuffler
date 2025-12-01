/**
 * Base Email Template
 *
 * Provides consistent Christmas-themed styling for all emails.
 * Uses inline styles and table-based layouts for maximum email client compatibility.
 */

/**
 * Christmas color palette for emails
 */
export const EMAIL_COLORS = {
  christmasRed: "#c41e3a",
  christmasRedDark: "#a01830",
  forestGreen: "#228b22",
  forestGreenDark: "#1a6b1a",
  cream: "#fef7f0",
  creamDark: "#f5ebe0",
  gold: "#ffd700",
  white: "#ffffff",
  textDark: "#1f2937",
  textMuted: "#6b7280",
} as const;

/**
 * Rendered email output
 */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base template options
 */
export interface BaseTemplateOptions {
  preheader?: string; // Hidden preview text shown in email clients
}

/**
 * Wraps email content in the base Christmas-themed layout
 */
export function wrapInBaseTemplate(
  content: string,
  options: BaseTemplateOptions = {}
): string {
  const preheader = options.preheader
    ? `<span style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(options.preheader)}</span>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Secret Santa Shuffler</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding: 20px !important; }
      .button { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.cream}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader}
  
  <!-- Main wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${EMAIL_COLORS.cream};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Container -->
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: ${EMAIL_COLORS.white}; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${EMAIL_COLORS.christmasRed} 0%, ${EMAIL_COLORS.christmasRedDark} 100%); padding: 30px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Gift emoji as logo substitute -->
                    <div style="font-size: 40px; margin-bottom: 10px;">🎁</div>
                    <h1 style="margin: 0; color: ${EMAIL_COLORS.white}; font-size: 28px; font-weight: 700; font-family: Georgia, serif;">
                      Secret Santa Shuffler
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Decorative line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${EMAIL_COLORS.christmasRed} 0%, ${EMAIL_COLORS.forestGreen} 50%, ${EMAIL_COLORS.christmasRed} 100%);"></td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: ${EMAIL_COLORS.creamDark}; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: ${EMAIL_COLORS.textMuted}; font-size: 14px;">
                🎄 Spreading holiday cheer, one gift at a time! 🎄
              </p>
              <p style="margin: 0; color: ${EMAIL_COLORS.textMuted}; font-size: 12px;">
                Secret Santa Shuffler &bull; Making gift exchanges magical
              </p>
            </td>
          </tr>
          
        </table>
        <!-- End Container -->
        
      </td>
    </tr>
  </table>
  <!-- End Main wrapper -->
  
</body>
</html>`;
}

/**
 * Creates a primary CTA button
 */
export function createButton(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <a href="${escapeHtml(url)}" 
         class="button"
         style="display: inline-block; padding: 16px 40px; background-color: ${EMAIL_COLORS.forestGreen}; color: ${EMAIL_COLORS.white}; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 50px; box-shadow: 0 4px 14px rgba(34, 139, 34, 0.4);">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Creates a secondary/outline button
 */
export function createSecondaryButton(text: string, url: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 15px 0;">
      <a href="${escapeHtml(url)}" 
         style="display: inline-block; padding: 12px 30px; background-color: transparent; color: ${EMAIL_COLORS.forestGreen}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; border: 2px solid ${EMAIL_COLORS.forestGreen};">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Creates a heading
 */
export function createHeading(text: string, level: 1 | 2 | 3 = 2): string {
  const sizes = { 1: "28px", 2: "24px", 3: "20px" };
  const margins = { 1: "0 0 20px 0", 2: "0 0 15px 0", 3: "0 0 10px 0" };

  return `<h${level} style="margin: ${margins[level]}; color: ${EMAIL_COLORS.christmasRed}; font-size: ${sizes[level]}; font-weight: 700; font-family: Georgia, serif; text-align: center;">${escapeHtml(text)}</h${level}>`;
}

/**
 * Creates a paragraph
 */
export function createParagraph(
  text: string,
  options: { centered?: boolean; muted?: boolean } = {}
): string {
  const color = options.muted ? EMAIL_COLORS.textMuted : EMAIL_COLORS.textDark;
  const align = options.centered ? "center" : "left";

  return `<p style="margin: 0 0 16px 0; color: ${color}; font-size: 16px; line-height: 1.6; text-align: ${align};">${text}</p>`;
}

/**
 * Creates a divider line
 */
export function createDivider(): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 20px 0;">
      <div style="height: 2px; background: linear-gradient(90deg, transparent, ${EMAIL_COLORS.christmasRed}, ${EMAIL_COLORS.forestGreen}, ${EMAIL_COLORS.christmasRed}, transparent);"></div>
    </td>
  </tr>
</table>`;
}

/**
 * Creates a highlighted info box
 */
export function createInfoBox(content: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 20px; background-color: ${EMAIL_COLORS.cream}; border-radius: 12px; border-left: 4px solid ${EMAIL_COLORS.forestGreen};">
      ${content}
    </td>
  </tr>
</table>`;
}

/**
 * Creates a warning/alert box
 */
export function createWarningBox(content: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td style="padding: 20px; background-color: #fef3cd; border-radius: 12px; border-left: 4px solid ${EMAIL_COLORS.gold};">
      ${content}
    </td>
  </tr>
</table>`;
}

/**
 * Creates a small text note
 */
export function createSmallText(text: string, centered = true): string {
  return `<p style="margin: 16px 0 0 0; color: ${EMAIL_COLORS.textMuted}; font-size: 13px; line-height: 1.5; text-align: ${centered ? "center" : "left"};">${text}</p>`;
}

/**
 * Creates a link
 */
export function createLink(text: string, url: string): string {
  return `<a href="${escapeHtml(url)}" style="color: ${EMAIL_COLORS.forestGreen}; text-decoration: underline;">${escapeHtml(text)}</a>`;
}

/**
 * Escape HTML entities to prevent XSS in emails
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Convert HTML to plain text for text-only email version
 */
export function htmlToPlainText(html: string): string {
  return html
    // Replace line breaks and block elements
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<li>/gi, "  • ")
    .replace(/<\/li>/gi, "\n")
    // Extract link URLs
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&bull;/g, "•")
    // Clean up whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}