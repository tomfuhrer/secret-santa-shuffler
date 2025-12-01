// Email module - service abstraction and providers

// Types
export type {
  EmailAddress,
  EmailMessage,
  EmailResult,
  EmailProvider,
  EmailProviderType,
  EmailServiceConfig,
  MagicLinkEmailData,
  QuestionnaireInviteEmailData,
  AllCompleteEmailData,
  SecretSantaAssignmentEmailData,
  EmailTemplate,
} from "./types";

// Email Service
export {
  EmailService,
  createEmailService,
  createEmailServiceFromEnv,
} from "./email-service";

// Providers
export {
  ResendProvider,
  createResendProvider,
  ConsoleProvider,
  createConsoleProvider,
} from "./providers";

// Templates
export {
  renderMagicLinkEmail,
  renderQuestionnaireInviteEmail,
  renderAllCompleteEmail,
  renderSecretSantaAssignmentEmail,
} from "./templates";