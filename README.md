# Hashttp

Hashttp is a minimal, dependency-free routing engine that maps request paths to
files and templates. It is well suited for SEO-friendly static sites, vanilla
websites with dynamic routes, and small SPAs. The matching core is
[`roution`](helpers/roution/README.md), a tiny route-resolution engine with zero
runtime dependencies.

This repository contains two parts:

- `helpers/roution` — the reusable route matcher (`createMatcher`).
- `demo/` — a runnable, zero-dependency HTTP server that shows how the matcher
  is wired to file serving, page composition, and templating.

## How a request is resolved

The demo server (`demo/server.js`) resolves each request in three steps:

1. **Static file** — If a matching file exists under `demo/public` and stays
   within that directory (path-traversal safe), it is streamed directly with a
   `Content-Type` derived from its extension (`.html`, `.css`, `.json`, ...).
2. **Route match** — Otherwise the request path is matched against the route
   table. A match is served in one of three shapes:
   - a single file (string target),
   - a composed page (array of chunks), or
   - a template (object with `target` and `struct`).
3. **Fallback** — If nothing matches, `demo/public/404.html` is served with a
   `404` status.

## Route definitions

Routes are a flat object of patterns to values. The matcher values used by the
demo server come in three shapes:

### String (single file)

```javascript
"/": "public/index.html"
```

### Array (page composition)

Each entry is either a file path or an object with its own `struct`. Chunks are
rendered in order and concatenated into one response.

```javascript
"/composed": [
  { "target": "public/header.html", "struct": { "title": "Hello, World!" } },
  "public/greetings.html",
  { "target": "public/footer.html", "struct": { "year": new Date().getFullYear() } }
]
```

### Object with `struct` (templating)

```javascript
"/articles": {
  "target": "public/articles/index.html",
  "struct": { "title": "Articles" }
}
```

`struct` may be a plain object or a factory that receives the matched route
params, which makes it easy to derive values from dynamic segments:

```javascript
"/articles/:slug": {
  "target": "public/articles/[slug].html",
  "struct": (params) => ({
    "slug": params.slug,
    "title": params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  })
}
```

## Dynamic routes

Use `:name` placeholders (for example `:slug`). Captured values are available as
`match.params` and can be passed into a `struct` factory.

## Template syntax

Templates use `{{ key }}` placeholders. Missing keys render as an empty string.

```html
<title>{{title}}</title>
<h1>{{title}}</h1>
<p>Slug: {{slug}}</p>
```

## Project structure

```text
hashttp/
├── helpers/
│   └── roution/            # route matcher engine (createMatcher)
│       ├── src/            # matcher implementation
│       ├── tests/          # node:test unit tests
│       └── README.md       # matcher API and usage
├── demo/
│   ├── server.js           # demo HTTP server
│   └── public/             # files served by the demo
│       ├── index.html      # route "/"
│       ├── 404.html        # fallback page
│       ├── style.css       # static asset
│       ├── data.json       # static JSON
│       ├── header.html     # composed chunk ({{title}})
│       ├── footer.html     # composed chunk ({{year}})
│       ├── greetings.html  # composed chunk
│       └── articles/
│           ├── index.html  # route "/articles" ({{title}})
│           └── [slug].html # route "/articles/:slug" ({{slug}}, {{title}})
├── package.json
├── README.md
├── LICENSE.md
└── CHANGELOG.md
```

## Running the demo

The demo serves `demo/public` first, then falls back to the route table, and
finally to `404.html`.

```bash
npm run demo
# or
node demo/server.js
```

Then open <http://localhost:7171/>. Try these paths:

- `/` — static home page
- `/articles` — route rendered with a `struct`
- `/articles/hello-world` — dynamic route rendered from `[slug].html`
- `/composed` — page composed from header + greetings + footer chunks
- `/data.json` — static JSON file
- `/missing-route` — fallback `404.html`

## The roution matcher

The demo server depends only on `createMatcher` from
`helpers/roution/src/roution.js`. The matcher is framework agnostic and runtime
independent, and supports static lookup, dynamic segments, query parsing, and an
optional `*` wildcard. See [`helpers/roution/README.md`](helpers/roution/README.md)
for the full API.

```javascript
import { createMatcher } from "./helpers/roution/src/roution.js";

const matcher = createMatcher({
  "/": "public/index.html",
  "/articles/:slug": "public/articles/[slug].html",
  "*": "public/404.html"
});

matcher.match("/articles/javascript?page=1");
// { found: true, pathname: "/articles/javascript", route: "/articles/:slug",
//   params: { slug: "javascript" }, query: { page: "1" },
//   value: "public/articles/[slug].html" }
```

## Design principles

- **Zero dependencies** — only built-in Node.js APIs.
- **Minimal code** — small, readable, maintainable.
- **Modular** — the matcher is isolated and unit-tested on its own.
- **Flat config** — routes are a simple, serializable object.
- **Auto content-type** — MIME type is detected from the file extension.
- **Static first** — existing files win; routing is the fallback.
