/**
 * Duplicate submission prevention utility.
 *
 * Tracks in-flight mutation requests by a generated key (method + URL + body hash)
 * and rejects duplicates while the original is still pending.
 *
 * Requirement 26.6: Prevent duplicate form submissions.
 */

const inflightRequests = new Map<string, AbortController>()

/**
 * Generates a deduplication key from request properties.
 * Only mutation methods (POST, PUT, PATCH, DELETE) are tracked.
 */
export function getDeduplicationKey(
  method: string,
  url: string,
  data?: unknown
): string | null {
  const upperMethod = method.toUpperCase()
  // Only deduplicate mutation requests, not GETs
  if (upperMethod === 'GET' || upperMethod === 'HEAD' || upperMethod === 'OPTIONS') {
    return null
  }

  const bodyHash = data ? simpleHash(JSON.stringify(data)) : 'empty'
  return `${upperMethod}:${url}:${bodyHash}`
}

/**
 * Checks if a request with the given key is already in flight.
 */
export function isRequestInflight(key: string): boolean {
  return inflightRequests.has(key)
}

/**
 * Marks a request as in-flight. Returns an AbortController for the request.
 */
export function markRequestInflight(key: string): AbortController {
  const controller = new AbortController()
  inflightRequests.set(key, controller)
  return controller
}

/**
 * Removes a request from the in-flight tracker (on completion or failure).
 */
export function clearInflightRequest(key: string): void {
  inflightRequests.delete(key)
}

/**
 * Simple string hash for deduplication purposes (not cryptographic).
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}
