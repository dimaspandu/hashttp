# Hashttp

Hashttp — minimal, dependency-free routing engine for mapping routes to files/static resources.
Perfect for SEO-friendly SPAs or vanilla websites with dynamic routes.

## Features

- Point routes to files or folders (publish folder contents)
- Flat routes object (hashtable-like) as input
- Auto content-type detection based on file extension
- Route pointer can be string path or object `{ "source": ..., "headers": {...} }`
- Support dynamic routes (placeholders) and fallback `*`
- Smart matching engine: hash/regex/trie (auto-selected based on route count)

## Route Examples

```json
{
  "/": "public/index.html",
  "/articles": "public/articles.html",
  "/articles/:slug": "public/articles/[slug].html",
  "/style.css": "public/style.css",
  "/data.json": {
    "target": "public/data.json",
    "headers": { "Content-Type": "application/json" }
  },
  "/storage/:file": "public/storage/[file]",
  "*": { "target": "public/404.html", "status": 404 }
}
```

## Route Notes

- **String**: pointer to file or folder using an explicit target path
- **Object**: `{ "target": string, "headers": { ... } }` to override headers/content-type
- **`*`**: fallback for unmatched requests
- **Dynamic param**: uses `:name` syntax (e.g., `:slug`) — simple and explicit

## API

- `hashttp(routesObject)` — main function accepts a flat route map.
  - `routesObject`: flat object mapping routes to files/targets
  - Returns instance with methods: `match(path)`, `resolve(pointer)`, and `info()`.
  - `match(path)` returns `{ routeKey, pointer, params }` or `null`.

## Architecture & Algorithms

- **Small route counts**: use hash + regex fallback for dynamic matching.
- **Large route counts**: use trie for prefix/dynamic performance.
- Matchers are separate modules for easy unit testing: `matcher/hash`, `matcher/regex`, `matcher/trie`.

## Testing

- Matcher modules are isolated so they can be unit-tested independently.
- `test/` folder contains tests for each algorithm and small integrations.

## Roadmap

- Scaffold `src/` and `test/`
- Implement basic matchers (hash + regex)
- Implement trie when routes > threshold
- Add content-type detection and header pointer handling
- Example usage in `demo/`

## Quick Start

### Installation

Clone and use directly (no npm install needed):

```bash
git clone <repo>
cd hashttp
```

### Usage (module)

```javascript
import hashttp from './src/index.js';

const router = hashttp({
  "/": "index.html",
  "/articles/:slug": "articles/[slug].html",
  "/api": {
    "target": "api.json",
    "headers": { "Content-Type": "application/json" }
  },
  "*": "404.html"
});

// Match a route
const match = router.match('/articles/hello-world');
console.log(match);

// Resolve pointer to file info
const resolved = router.resolve(match.pointer);
console.log(resolved);

// Get router stats
console.log(router.info());
```

### Running Tests

```bash
npm test
# or
node test/matcher.test.js
```

### Running Demo

Start the demo server which serves `demo/public` and shows static, dynamic and JSON routes:

```bash
npm run demo
# or
node demo/server.js
```

## API Reference

### `hashttp(routesObject)`

Create a router instance.

**Parameters:**
- `routesObject` (Object): Flat object mapping route paths to targets

**Returns:** Router instance with methods:
- `match(path)` - Match a request path to a route
- `resolve(pointer)` - Resolve pointer to target info
- `info()` - Get router statistics

### Route Pointer Formats

**String (simple file/folder reference):**
```javascript
"/style.css": "assets/css/style.css"
```

**Object (with explicit headers):**
```javascript
"/api": {
  "target": "api.handler",
  "headers": { "Content-Type": "application/json" }
}
```

### Dynamic Routes

Use `:paramName` placeholders:
```javascript
"/articles/:slug": "articles/[slug].html"
"/users/:id/posts/:postId": "users/[id]/posts/[postId].html"
```

Parameters are captured and returned in `match().params`.

### Fallback Route

Use `*` as a catch-all for unmatched routes:
```javascript
"*": "404.html"
```

## Algorithm Selection

- **< 20 routes**: Hash + Regex (fast exact match, then fallback to regex for params)
- **≥ 20 routes**: Trie (prefix-based for better performance with many routes)

The algorithm is selected automatically based on route count. View current strategy with `router.info()`.

## Project Structure

```
hashttp/
├── src/
│   ├── index.js              # Main entry point
│   ├── contentType.js        # MIME type detection
│   └── matcher/
│       ├── hash.js           # Exact match (O(1))
│       ├── regex.js          # Dynamic param matching
│       └── trie.js           # Prefix-based matching
├── test/
│   └── matcher.test.js       # Unit tests
├── demo/
│   ├── server.js             # Demo server
│   └── public/               # Demo public files (html, css, json)
├── package.json
├── README.md
├── LICENSE.md
└── CHANGELOG.md
```

## Design Principles

- **Zero dependencies**: No npm modules, only built-in Node.js APIs
- **Minimal code**: Small, readable, maintainable codebase
- **Modular**: Matchers are separated for easy testing and swapping
- **Flat config**: Routes object is simple and JSON-serializable
- **Auto content-type**: Detects MIME type from file extensions
- **Smart routing**: Automatic algorithm selection for performance

