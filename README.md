# http-vary-header-normalize-lib

Parses and normalizes HTTP `Vary` header field lists for cache key computation.

```js
import { parseVary, normalizeVary } from 'http-vary-header-normalize-lib';

parseVary('Accept-Encoding, User-Agent');
// => ['accept-encoding', 'user-agent']

normalizeVary('Accept-Encoding, User-Agent, accept-encoding');
// => 'accept-encoding, user-agent'

normalizeVary('Accept, *');
// => '*'
```

## Why this exists

A cache needs a stable key derived from the `Vary` header. The raw header is
not stable: it may appear more than once, it may contain arbitrary whitespace,
field names are case-insensitive, and duplicates are legal. Normalizing it
by hand in every proxy is easy to get subtly wrong.

This library makes one clear trade-off: a `*` anywhere in the list collapses
the whole result to `*`. RFC 7231 says a `Vary: *` response is uncacheable;
mixing `*` with specific names is not meaningful, so we do not try to preserve
the specific names alongside it. Callers who need the raw items can use
`parseVary`, which keeps `*` as a literal token and preserves duplicates.

## The awkward edge

The header may arrive as multiple values, not just one comma-separated string.
`parseVary` and `normalizeVary` both accept a string or an array of strings;
the array form is the one to use when your HTTP layer hands you repeated
headers. Deduplication happens after lowercasing, so `Accept` and `accept`
collapse to one entry.
