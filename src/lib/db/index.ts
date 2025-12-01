// Database module - D1 database access layer

// Types
export type {
  Organizer,
  CreateOrganizerInput,
  MagicLink,
  CreateMagicLinkInput,
  Exchange,
  ExchangeStatus,
  CreateExchangeInput,
  UpdateExchangeInput,
  Participant,
  CreateParticipantInput,
  Questionnaire,
  QuestionnaireInput,
  Session,
  CreateSessionInput,
  D1Database,
  D1PreparedStatement,
  D1Result,
  D1ExecResult,
  Env,
} from "./types";

// Organizer queries
export {
  findOrganizerByEmail,
  findOrganizerById,
  createOrganizer,
  updateOrganizerName,
  findOrCreateOrganizer,
} from "./queries";

// Magic link queries
export {
  createMagicLink,
  findMagicLinkById,
  findMagicLinkByToken,
  findValidMagicLinkByToken,
  markMagicLinkAsUsed,
  countRecentMagicLinks,
  deleteExpiredMagicLinks,
} from "./queries";

// Session queries
export {
  createSession,
  findSessionById,
  findSessionByToken,
  findValidSessionByToken,
  findValidSessionWithOrganizer,
  deleteSession,
  deleteSessionByToken,
  deleteOrganizerSessions,
  deleteExpiredSessions,
  extendSession,
} from "./queries";

// Exchange queries
export {
  findExchangeById,
  findExchangeByIdForOrganizer,
  listExchangesByOrganizer,
  createExchange,
  updateExchange,
  updateExchangeStatus,
  deleteExchange,
} from "./queries";

// Participant queries
export {
  findParticipantById,
  findParticipantByToken,
  findParticipantByExchangeAndEmail,
  listParticipantsByExchange,
  countParticipantsByExchange,
  countCompletedQuestionnaires,
  areAllQuestionnairesComplete,
  createParticipant,
  updateParticipantEmail,
  updateParticipantName,
  markQuestionnaireCompleted,
  assignRecipient,
  deleteParticipant,
} from "./queries";

// Questionnaire queries
export {
  findQuestionnaireByParticipant,
  upsertQuestionnaire,
} from "./queries";
