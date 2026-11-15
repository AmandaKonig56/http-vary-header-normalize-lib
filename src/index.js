// Public entry point for the Vary header normalization library.
//
// The library is intentionally tiny: one parsing function and one
// normalization function. Keeping them separate lets callers inspect the
// parsed representation (for logging or debugging) without committing to the
// normalized form.

export { parseVary, normalizeVary } from './core.js';
