// Shuffle module - Sattolo's algorithm for Secret Santa assignments

export {
  sattoloShuffle,
  sattoloShuffleInPlace,
  createSecretSantaChain,
  createSecretSantaAssignments,
  createQuickShuffleAssignments,
  validateAssignments,
  encodeAssignmentsForUrl,
  decodeAssignmentsFromUrl,
} from "./sattolo";