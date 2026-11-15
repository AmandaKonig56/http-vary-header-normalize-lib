// Core parsing and normalization logic for HTTP Vary header field lists.
//
// RFC 7231 section 7.1.4 defines Vary as a comma-separated list of header
// field names. The header may appear multiple times in a message; the
// combined field value is the concatenation of all instances separated by
// commas. Field names are case-insensitive (RFC 7230 section 3.2).
//
// Normalization decisions, stated plainly:
//
// * A wildcard ("*") anywhere in the combined list collapses the entire
//   list to the single token "*". RFC 7231 says a Vary value of "*" means
//   the response is uncacheable; mixing "*" with specific names is
//   nonsensical, so we treat the whole list as a wildcard. This is the
//   interpretation the tests exercise.
// * Field names are lowercased for comparison, because HTTP field names are
//   case-insensitive.
// * Duplicate names are removed, preserving first-seen order. Order is kept
//   stable so that callers can produce deterministic cache keys.
// * Empty items (from trailing commas, doubled commas, or an empty header)
//   are ignored.
// * Whitespace around items is trimmed. Whitespace inside a field name is
//   not valid HTTP, so we do not attempt to repair it; an item containing
//   internal whitespace is kept verbatim after trimming (minus case folding)
//   rather than silently dropped.

/**
 * Split a combined Vary header value into raw field-name items.
 *
 * We do not use `String.prototype.split(',')` alone because it cannot
 * distinguish a wildcard from a field name and it leaves empty items in
 * place. A small manual scan keeps the behaviour explicit and avoids
 * surprises with unusual inputs.
 *
 * @param {string} value
 * @returns {string[]}
 */
function splitItems(value) {
  const items = [];
  let current = '';
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === ',') {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  items.push(current);
  return items;
}

/**
 * Parse one or more Vary header values into an ordered list of field names.
 *
 * Accepts either a single string (the common case) or an array of strings
 * (for messages where the header appeared more than once). Each string is
 * split on commas; surrounding whitespace is trimmed; empty items are
 * discarded. A wildcard is reported as the literal token "*".
 *
 * The returned names are lowercased. The result is a plain array so callers
 * can iterate or serialize it without depending on this library further.
 *
 * @param {string|string[]} value
 * @returns {string[]}
 */
export function parseVary(value) {
  if (value == null) {
    return [];
  }
  const parts = Array.isArray(value) ? value : [value];
  const result = [];
  for (const part of parts) {
    if (typeof part !== 'string') {
      continue;
    }
    for (const raw of splitItems(part)) {
      const item = raw.trim();
      if (item === '') {
        continue;
      }
      if (item === '*') {
        result.push('*');
      } else {
        result.push(item.toLowerCase());
      }
    }
  }
  return result;
}

/**
 * Normalize one or more Vary header values into a canonical string.
 *
 * The output is suitable for use as part of a cache key: names are
 * lowercased, deduplicated, and joined with ", ". A wildcard anywhere in the
 * input collapses the result to "*". An empty or absent header normalizes
 * to the empty string.
 *
 * @param {string|string[]} value
 * @returns {string}
 */
export function normalizeVary(value) {
  const parsed = parseVary(value);
  if (parsed.includes('*')) {
    return '*';
  }
  const seen = new Set();
  const unique = [];
  for (const name of parsed) {
    if (!seen.has(name)) {
      seen.add(name);
      unique.push(name);
    }
  }
  return unique.join(', ');
}
