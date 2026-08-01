# hashttp Source

`src/hashttp.js` is the core serving engine for hashttp. It provides two
primary functions and several utilities.

## Exports

### `createServerFromRoutes(routes, options)`

Creates an HTTP server that resolves each request in three steps:

1. **Static file** — serves matching files from `publicDir` (path-traversal
   safe).
2. **Route match** — falls back to the route matcher (single file, composed
   chunks, or template).
3. **Fallback** — serves the fallback file (default: `404.html`) when nothing
   matches.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory for resolving file paths. |
| `publicDir` | `string` | `<baseDir>/public` | Directory for static files. |
| `port` | `number` | `7171` | Port to listen on. |
| `host` | `string` | `"localhost"` | Host to bind. |
| `fallback` | `string` | `"404.html"` | Fallback file when no route matches. |

### `createStaticFromRoutes(routes, paths, options)`

Generates static HTML files from route definitions without starting a server.

**Arguments:**

- `routes` — the route map object (same format as `createServerFromRoutes`).
- `paths` — array of URL paths to generate.
- `options` — `baseDir` (default `process.cwd()`), `outputDir` (default `"dist"`).

**How routes are resolved:**

- **String target** — file is read and written as-is.
- **Object with `target` and `model`** — template is rendered with model data.
- **Array (composed)** — all chunks are rendered and concatenated into one file.
- **Object with `stream` and `chunks`** — all chunks are rendered and concatenated
  (streaming is ignored during static generation).
- **Factory/callback** — invoked with a synthetic context (`{ params, query: {}, pathname }`).

**Output path mapping:**

| URL path | Output file |
|---|---|
| `/` | `dist/index.html` |
| `/articles` | `dist/articles.html` |
| `/articles/hello-world` | `dist/articles/hello-world.html` |

### `resolveModel(model, ctx)`

Resolves a model definition into a plain data object. A model may be a literal
object or a factory that receives the request context.

### `renderTemplate(content, data)`

Substitutes `{{ key }}` placeholders in `content` with values from `data`.
Missing keys render as an empty string.

### `renderEntry(entry, ctx, baseDir)`

Renders a single route entry (string path or `{ target, model }` object) to
an HTML string. File contents are memoized in an in-memory cache, so files
read once are not re-read from disk on subsequent calls.

## Architecture

hashttp follows a three-layer architecture:

1. **Matcher** (`libs/roution`) — resolves URL paths to route values using
   static lookup, dynamic segments (`:name`), and optional wildcard (`*`).
2. **Engine** (`src/hashttp.js`) — orchestrates request handling: static file
   serving, route matching, template rendering, and fallback.
3. **Templates** — uses `{{ key }}` placeholders with data from the `model`
   property (plain object or factory function).

## Design Principles

- **Zero dependencies** — only built-in Node.js APIs.
- **Minimal code** — small, readable, maintainable.
- **Modular** — the matcher is isolated and unit-tested independently.
- **Flat config** — routes are a simple, serializable object.
- **Auto content-type** — MIME type is detected from the file extension.
- **Static first** — existing files win; routing is the fallback.