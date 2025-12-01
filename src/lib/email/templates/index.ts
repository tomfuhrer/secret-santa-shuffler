// Email Templates - HTML/text rendering for all email types

export { renderMagicLinkEmail } from "./magic-link";
export type { MagicLinkTemplateData } from "./magic-link";

export { renderQuestionnaireInviteEmail } from "./questionnaire-invite";
export type { QuestionnaireInviteTemplateData } from "./questionnaire-invite";

export { renderAllCompleteEmail } from "./all-complete";
export type { AllCompleteTemplateData } from "./all-complete";

export { renderSecretSantaAssignmentEmail } from "./secret-santa-assignment";
export type {
  SecretSantaAssignmentTemplateData,
  QuestionnaireData,
} from "./secret-santa-assignment";

// Base template utilities (for custom emails if needed)
export {
  wrapInBaseTemplate,
  createButton,
  createSecondaryButton,
  createHeading,
  createParagraph,
  createDivider,
  createInfoBox,
  createWarningBox,
  createSmallText,
  createLink,
  escapeHtml,
  htmlToPlainText,
  EMAIL_COLORS,
} from "./base";
export type { RenderedEmail, BaseTemplateOptions } from "./base";