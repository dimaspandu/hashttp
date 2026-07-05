# Hashttp

Hashttp — minimal, dependency-free routing engine for mapping routes to files/static resources.
Perfect for SEO-friendly SPAs or vanilla websites with dynamic routes.

## Features

- Point routes to files or folders (publish folder contents)
- Flat routes object (hashtable-like) as input
- Auto content-type detection based on file extension
- Route pointer can be string path or object `{ "target": ..., "headers": {...}, "folder": true, "data": {...} }`
- Support dynamic routes (placeholders) and folder prefix routes
- Fallback route support with `*`
- Smart matching engine: hash/regex/trie (auto-selected based on route count)
- Built-in template engine with `{{placeholder}}` syntax and dot-notation for nested values
- Page composition: combine multiple templates/files via array target (`["header.html", "main.html"]`)

## Route Examples

```json
{
  "/": "public/index.html",
  "/articles": "public/articles.html",
  "/articles/:slug": "public/articles/[slug].html",
  "/docs": { "target": "public/docs", "folder": true },
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

- **String**: pointer to file or folder using an explicit target path.
- **Object**: use `{ "target": string, "headers": { ... } }` to override headers/content-type.
- **Folder route**: use `{ "target": string, "folder": true }` for prefix-based folder serving.
- **`*`**: fallback for unmatched requests.
- **Dynamic param**: uses `:name` syntax (e.g., `:slug`) — simple and explicit.

## API

- `hashttp(routesObject)` — main function accepts a flat route map.
  - `routesObject`: flat object mapping routes to files/targets.
  - Returns instance with methods: `match(path)`, `resolve(pointer)`, and `info()`.
  - `match(path)` returns `{ routeKey, pointer, params }` or `null`.
  - `resolve(pointer)` now returns `{ target, headers, contentType, status, folder }`.

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

Start the demo server which serves `demo/public` first. If a requested file exists there, it is served directly; otherwise the router is used for dynamic routes and the fallback `*` route.

```bash
npm run demo
# or
node demo/server.js
```

Note: the demo now attempts a `.html` fallback for extensionless requests. For example, requesting `/articles` will try to serve `public/articles.html` before falling back to the router or returning 404.

## API Reference

### `hashttp(routesObject)`

Create a router instance.

**Parameters:**
- `routesObject` (Object): Flat object mapping route paths to targets

**Returns:** Router instance with methods:
- `match(path)` - Match a request path to a route
- `resolve(pointer)` - Resolve pointer to target info
- `render(content, data)` - Render template content with data
- `info()` - Get router statistics

**resolve(pointer) returns:**
- `{ target, headers, contentType, status, folder, data }` - Route target info with optional data

### Template Engine

Hashttp includes a built-in template engine for injecting data into HTML templates.

**Using `data` property in routes:**
```javascript
"/welcome": {
  "target": "welcome.html",
  "data": { "title": "Welcome", "user": { "name": "John" } }
}
```

**Template syntax in HTML:**
```html
<html>
  <head><title>{{title}}</title></head>
  <body>
    <h1>Hello, {{user.name}}!</h1>
  </body>
</html>
```

Rendered output:
```html
<html>
  <head><title>Welcome</title></head>
  <body>
    <h1>Hello, John!</h1>
  </body>
</html>
```

- `{{key}}` - Simple value replacement
- `{{user.name}}` - Nested object access with dot notation
- Missing keys render as empty string
- Route params are automatically available as template data

### Page Composition

Combine multiple templates/files into a single response:

```javascript
"/page": {
  "target": ["public/header.html", "public/main.html", "public/footer.html"],
  "data": { "title": "Page Title" }
}
```

Or with inline templates and custom data per chunk:

```javascript
"/page": {
  "target": [
    "public/header.html",
    { "target": "public/main.html", "data": { "content": "Custom content" } },
    "public/footer.html"
  ]
}
```

All files are rendered with shared data context, with chunk-specific data overriding where provided.

### Route Pointer Formats

**String (simple file/folder reference):**
```javascript
"/style.css": "assets/css/style.css"
```

**Object (with explicit headers and data):**
```javascript
"/api": {
  "target": "api.handler",
  "headers": { "Content-Type": "application/json" }
}
"/welcome": {
  "target": "welcome.html",
  "data": { "title": "Welcome", "user": { "name": "John" } }
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
│   ├── template.js           # Template engine
│   ├── compose.js            # Page composition utility
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

