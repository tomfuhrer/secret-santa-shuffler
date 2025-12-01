/**
 * Sattolo's Algorithm for Cyclic Permutations
 *
 * This algorithm generates a random cyclic permutation in O(n) time.
 * Unlike Fisher-Yates, which can produce any permutation (including fixed points),
 * Sattolo's algorithm guarantees:
 *
 * 1. No self-assignments (fixed points) - mathematically impossible
 * 2. Single unbroken cycle - everyone forms one chain
 * 3. Uniform distribution over all possible cycles of length n
 *
 * The key difference from Fisher-Yates is that we swap with a random element
 * BEFORE the current index (j in [0, i-1]), never with the current index itself.
 *
 * This is perfect for Secret Santa because the resulting permutation directly
 * represents the gift-giving chain: person[i] gives to person[shuffled[i]].
 */

/**
 * Secure random number generator using crypto API
 * Falls back to Math.random() in environments without crypto
 */
function secureRandomInt(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Use crypto for secure randomness
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Convert to a value in [0, max)
    return array[0] % max;
  }
  // Fallback to Math.random (less secure but works everywhere)
  return Math.floor(Math.random() * max);
}

/**
 * Performs Sattolo's shuffle on an array in-place
 *
 * @param array - The array to shuffle (will be modified)
 * @returns The same array, shuffled into a cyclic permutation
 */
export function sattoloShuffleInPlace<T>(array: T[]): T[] {
  const n = array.length;

  if (n < 2) {
    return array;
  }

  // Sattolo's algorithm: swap with random element BEFORE current index
  for (let i = n - 1; i > 0; i--) {
    // j is in [0, i-1], never equal to i
    const j = secureRandomInt(i);
    // Swap elements
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Creates a cyclic permutation of the input array without modifying the original
 *
 * @param array - The array to shuffle
 * @returns A new array with elements in a cyclic permutation order
 */
export function sattoloShuffle<T>(array: readonly T[]): T[] {
  const copy = [...array];
  return sattoloShuffleInPlace(copy);
}

/**
 * Creates Secret Santa assignments from a list of participant IDs
 *
 * @param participantIds - Array of participant IDs
 * @returns A Map where key = santa, value = recipient
 *
 * @example
 * const ids = ['alice', 'bob', 'charlie', 'diana'];
 * const assignments = createSecretSantaChain(ids);
 * // Possible result: Map { 'alice' => 'charlie', 'bob' => 'diana', 'charlie' => 'bob', 'diana' => 'alice' }
 * // Forms chain: alice → charlie → bob → diana → alice
 */
export function createSecretSantaChain(
  participantIds: readonly string[]
): Map<string, string> {
  if (participantIds.length < 2) {
    throw new Error("Secret Santa requires at least 2 participants");
  }

  // Create shuffled copy using Sattolo's algorithm
  const shuffled = sattoloShuffle(participantIds);

  // Build assignment map: original[i] gives to shuffled[i]
  const assignments = new Map<string, string>();

  for (let i = 0; i < participantIds.length; i++) {
    assignments.set(participantIds[i], shuffled[i]);
  }

  return assignments;
}

/**
 * Creates Secret Santa assignments and returns as an array of pairs
 *
 * @param participantIds - Array of participant IDs
 * @returns Array of [santa, recipient] pairs
 */
export function createSecretSantaAssignments(
  participantIds: readonly string[]
): Array<[string, string]> {
  const chain = createSecretSantaChain(participantIds);
  return Array.from(chain.entries());
}

/**
 * Creates Secret Santa assignments from names (for quick shuffle feature)
 *
 * @param names - Array of participant names
 * @returns Array of { santa, recipient } objects for easy display
 */
export function createQuickShuffleAssignments(
  names: readonly string[]
): Array<{ santa: string; recipient: string }> {
  if (names.length < 2) {
    throw new Error("Need at least 2 names to shuffle");
  }

  const shuffled = sattoloShuffle(names);

  return names.map((santa, i) => ({
    santa,
    recipient: shuffled[i],
  }));
}

/**
 * Validates that an assignment map forms a valid single cycle
 * (useful for testing and verification)
 *
 * @param assignments - Map of santa -> recipient
 * @returns true if assignments form a single cycle with no self-assignments
 */
export function validateAssignments(
  assignments: Map<string, string>
): { valid: boolean; error?: string } {
  const santas = new Set(assignments.keys());
  const recipients = new Set(assignments.values());

  // Check everyone is both a santa and recipient
  if (santas.size !== recipients.size) {
    return { valid: false, error: "Mismatched number of santas and recipients" };
  }

  for (const recipient of recipients) {
    if (!santas.has(recipient)) {
      return { valid: false, error: `Recipient ${recipient} is not a santa` };
    }
  }

  // Check for self-assignments
  for (const [santa, recipient] of assignments) {
    if (santa === recipient) {
      return { valid: false, error: `Self-assignment detected: ${santa}` };
    }
  }

  // Check for single cycle by traversing
  const visited = new Set<string>();
  let current = assignments.keys().next().value;
  const start = current;

  while (current && !visited.has(current)) {
    visited.add(current);
    current = assignments.get(current);
  }

  // Should have visited everyone and ended up back at start
  if (visited.size !== assignments.size) {
    return {
      valid: false,
      error: `Multiple cycles detected. Only ${visited.size} of ${assignments.size} participants in main cycle`,
    };
  }

  if (current !== start) {
    return { valid: false, error: "Cycle does not close properly" };
  }

  return { valid: true };
}

/**
 * Encodes assignments to a URL-safe base64 string for sharing
 *
 * @param assignments - Array of { santa, recipient } objects
 * @returns Base64-encoded string
 */
export function encodeAssignmentsForUrl(
  assignments: Array<{ santa: string; recipient: string }>
): string {
  const json = JSON.stringify(assignments);
  // Use base64url encoding (URL-safe)
  if (typeof btoa !== "undefined") {
    return btoa(json)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Node.js fallback
  return Buffer.from(json).toString("base64url");
}

/**
 * Decodes assignments from a URL-safe base64 string
 *
 * @param encoded - Base64-encoded string
 * @returns Array of { santa, recipient } objects, or null if invalid
 */
export function decodeAssignmentsFromUrl(
  encoded: string
): Array<{ santa: string; recipient: string }> | null {
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let json: string;
    if (typeof atob !== "undefined") {
      json = atob(base64);
    } else {
      // Node.js fallback
      json = Buffer.from(base64, "base64").toString("utf-8");
    }

    const parsed = JSON.parse(json);

    // Validate structure
    if (!Array.isArray(parsed)) {
      return null;
    }

    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        typeof item.santa !== "string" ||
        typeof item.recipient !== "string"
      ) {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}