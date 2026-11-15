import test from 'node:test';
import assert from 'node:assert/strict';

import { parseVary, normalizeVary } from '../src/index.js';

test('parseVary splits comma-separated names and lowercases them', () => {
  assert.deepEqual(parseVary('Accept-Encoding, User-Agent'), [
    'accept-encoding',
    'user-agent',
  ]);
});

test('parseVary trims whitespace around items', () => {
  assert.deepEqual(parseVary('  Accept  ,\tUser-Agent\n'), [
    'accept',
    'user-agent',
  ]);
});

test('parseVary ignores empty items from trailing and doubled commas', () => {
  assert.deepEqual(parseVary('Accept,,User-Agent,'), [
    'accept',
    'user-agent',
  ]);
});

test('parseVary returns an empty array for null, undefined, and empty input', () => {
  assert.deepEqual(parseVary(null), []);
  assert.deepEqual(parseVary(undefined), []);
  assert.deepEqual(parseVary(''), []);
});

test('parseVary accepts an array of header values', () => {
  assert.deepEqual(parseVary(['Accept', 'User-Agent, Accept']), [
    'accept',
    'user-agent',
    'accept',
  ]);
});

test('parseVary reports a wildcard as the literal token *', () => {
  assert.deepEqual(parseVary('*'), ['*']);
});

test('normalizeVary lowercases, deduplicates, and joins with comma-space', () => {
  assert.equal(
    normalizeVary('Accept-Encoding, User-Agent, accept-encoding'),
    'accept-encoding, user-agent',
  );
});

test('normalizeVary preserves first-seen order after deduplication', () => {
  assert.equal(
    normalizeVary('User-Agent, Accept, user-agent, accept'),
    'user-agent, accept',
  );
});

test('normalizeVary collapses to * when a wildcard appears anywhere', () => {
  assert.equal(normalizeVary('Accept, *'), '*');
  assert.equal(normalizeVary('*, Accept'), '*');
  assert.equal(normalizeVary(['Accept', '*']), '*');
});

test('normalizeVary returns the empty string for empty input', () => {
  assert.equal(normalizeVary(''), '');
  assert.equal(normalizeVary(null), '');
  assert.equal(normalizeVary([]), '');
});

test('normalizeVary keeps internal whitespace out of the way by trimming only edges', () => {
  // We do not attempt to repair invalid field names; we just trim the edges.
  assert.equal(normalizeVary('  Accept  '), 'accept');
});
