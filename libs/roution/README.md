# ROUTION (JavaScript)

The JavaScript implementation of ROUTION, a lightweight, runtime-independent
route resolution engine. This is the reference implementation; the other
language ports follow its specification and matching behavior.

ROUTION compiles route definitions into a reusable matcher that resolves
incoming pathnames and returns structured matching results. It is framework
agnostic, runtime independent, and has zero runtime dependencies.

For the full specification and cross-language overview, see the
[root README](../../README.md).

## Requirements

- Any JavaScript runtime that supports standard ECMAScript Modules (ESM):
  browsers, Node.js, Bun, Deno, Cloudflare Workers, edge runtimes, and more.
- No package manager or build step is required.

## Installation

Import the module directly from source. There are no dependencies to install.

```javascript
import { createMatcher } from "./src/roution.js";
```

## Quick Start

```javascript
import { createMatcher } from "./src/roution.js";

const routes = {
  "/": "public/index.html",
  "/articles": "public/articles/index.html",
  "/articles/:slug": "public/articles/[slug].html",
  "*": "public/404.html",
};

const matcher = createMatcher(routes);

const result = matcher.match("/articles/javascript?page=1");
```

`result`:

```javascript
{
  found: true,
  pathname: "/articles/javascript",
  route: "/articles/:slug",
  params: { slug: "javascript" },
  query: { page: "1" },
  value: "public/articles/[slug].html"
}
```

## API

### `createMatcher(routes, options?)`

Compiles route definitions into a reusable matcher. Compilation happens once;
the returned matcher can be reused for the lifetime of the application.

- `routes` (`object`): a map of pattern strings to opaque values. Throws
  `TypeError` if it is not a non-null plain object.
- `options` (`object`, optional):

| Option             | Type                          | Default  | Description                                                                              |
| ------------------ | ----------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `query`            | `boolean`                     | `true`   | When `true`, the result includes the parsed `query` object. When `false`, `query` is `{}`. |
| `strategy`         | `"auto" \| "regex" \| "trie"` | `"auto"` | `"auto"` selects an algorithm by route count; the others force a specific one.            |
| `dynamicThreshold` | `number`                      | `50`     | Dynamic route count at or above which `"auto"` selects the trie strategy.                 |

### `matcher.match(pathname)`

Resolves an incoming pathname. The pathname is normalized (query string and URL
fragment are stripped) before matching. Returns a match result:

| Property   | Description                                    |
| ---------- | ---------------------------------------------- |
| `found`    | Whether a route was matched.                   |
| `pathname` | The normalized pathname.                       |
| `route`    | The matched route pattern, or `null`.          |
| `params`   | Extracted route parameters.                    |
| `query`    | Parsed query string parameters.                |
| `value`    | The value associated with the matched route.   |

## Demo

The demo runs the same sample pathnames through two matchers, one without a
wildcard and one with a wildcard, so the difference is easy to observe.

```bash
node demo/index.js
```

Or via the npm script:

```bash
npm run demo
```

## Testing

Tests use the built-in Node.js test runner. No dependencies are installed.

```bash
npm test
```

## Project Structure

```text
js/
  src/
    normalize.js          # pathname normalization + query parsing
    pattern.js            # route pattern parsing
    compile.js            # one-time route compilation
    strategy.js           # automatic strategy selection
    strategies/
      regex.js            # regex-backed matching strategy
      trie.js             # trie-backed matching strategy
    roution.js            # public API entry point
  tests/                  # unit tests (node:test)
  demo/                   # runnable demo
  package.json
```

## License

MIT
