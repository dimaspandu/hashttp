# hashttp Demo

This folder contains a minimal demo that showcases **hashttp** — a
dependency-free HTTP serving engine that maps request paths to files and
templates.

## Quick start

```bash
npm run demo
# or
node demo/server.js
```

Then open <http://localhost:7171/>.

## Generate static HTML

To generate static HTML files from the routes, run:

```bash
npm run build
# or
node demo/build.js
```

This creates a `demo/dist/` folder with one `.html` file per path:

```text
demo/dist/
├── index.html
├── articles.html
├── articles/
│   └── hello-world.html
├── composed.html
├── composed-stream.html
└── factory/
    └── anything.html
```

Each generated file contains the fully resolved HTML — composed chunks are flattened, streaming routes are rendered as a single file, and factory/callback routes are resolved with the matched params.

## What the demo covers

The demo (`server.js`) defines a `routes` object and passes it to
`createServerFromRoutes`. Each route value demonstrates a different
response shape that hashttp supports.

### 1. Static file (string target)

A plain string path serves the file directly with an auto-detected
`Content-Type`.

```javascript
"/": "public/index.html"
```

### 2. Template (object with `target` and `model`)

An object with `target` and `model` renders a template file, substituting
`{{ key }}` placeholders with values from the model.

```javascript
"/articles": {
  target: "public/articles/index.html",
  model: { title: "Articles" }
}
```

`model` may be a plain object or a **factory** that receives the request
context (`{ params, query, pathname }`) and returns the data object. This
is useful for dynamic segments:

```javascript
"/articles/:slug": {
  target: "public/articles/[slug].html",
  model: ({ params }) => ({
    slug: params.slug,
    title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  })
}
```

### 3. Composed page (array of chunks)

An array of entries is rendered in order and concatenated into one full
response. Each entry is either a file path (string) or an object with
`target` and `model`. The `...news.map(...)` spreads multiple entries
that reuse the same template file (`section-item.html`) with different
model data.

```javascript
const news = [
  "Lorem ipsum dolor sit amet, ...",
  "Fusce pulvinar pulvinar elit vel egestas. ...",
];

"/composed": [
  { target: "public/header.html", model: { title: "Hello, World!" } },
  "public/greetings.html",
  ...news.map(item => ({
    target: "public/section-item.html",
    model: { content: `<p>${item}</p>` }
  })),
  { target: "public/footer.html", model: { year: new Date().getFullYear() } }
]
```

### 4. Streaming composed page

An object with `stream: true` and a `chunks` array writes each chunk
sequentially using `Transfer-Encoding: chunked` instead of waiting for
the full page. A chunk may carry its own `delay` (milliseconds) applied
before it is written.

```javascript
"/composed-stream": {
  stream: true,
  chunks: [
    { target: "public/header.html", model: { title: "Streaming" } },
    { target: "public/greetings.html", delay: 1000 },
    { target: "public/footer.html", model: { year: 2026 }, delay: 2000 }
  ]
}
```

### 5. Route value as a factory/callback

A route value may be a function. It is invoked with the request context
and must return the real route value (a string, an object with
`target`/`model`, or a composed shape). This is handy when the target or
model needs to be derived at request time.

```javascript
"/factory/:name": ({ params, query }) => ({
  target: "public/factory.html",
  model: { name: params.name, lang: query.lang || "en" }
})
```

### 6. Static JSON / assets

Any file under the public directory is served as-is with the correct MIME
type:

```
GET /data.json  →  serves demo/public/data.json
GET /style.css  →  serves demo/public/style.css
```

### 7. 404 fallback

When no route matches and no static file is found, `404.html` is served
with a `404` status.

## Options

`createServerFromRoutes` accepts an optional second argument for
configuration:

| Option | Type | Default | Description |
|---|---|---|---|
| `baseDir` | `string` | `process.cwd()` | Base directory used to resolve all file paths (route targets, static files, 404 page). All relative paths in routes and options are resolved relative to `baseDir`. |
| `publicDir` | `string` | `<baseDir>/public` | Directory that holds static files (HTML, CSS, JS, JSON, images …). Existing files here are served directly before the route matcher is consulted. |
| `port` | `number` | `7171` | Port the HTTP server listens on. |
| `host` | `string` | `"localhost"` | Host the HTTP server binds to. |
| `fallback` | `string` | `"404.html"` | File served when no route or static file matches. Resolved relative to `publicDir`. |

### Example with all options

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  publicDir: path.join(import.meta.dirname, "public"),
  port: 3000,
  host: "0.0.0.0",
  fallback: "custom-404.html"
});
```

### Custom fallback page

Set `fallback` to a different file name (relative to `publicDir`) to serve
a custom 404 page instead of the default `404.html`:

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  fallback: "errors/not-found.html"
});
```

The file must exist under `publicDir`; otherwise the response will be
empty with a `404` status, just like the default behaviour when
`404.html` is missing.

## Using a different directory instead of `public`

By default hashttp looks for static files in `<baseDir>/public`. If your
project uses a different folder (for example `src`), you have two options:

### Option A: Point `publicDir` to the new folder

Set `publicDir` explicitly in the options so hashttp knows where to look
for static assets:

```javascript
createServerFromRoutes(routes, {
  baseDir: import.meta.dirname,
  publicDir: path.join(import.meta.dirname, "src")
});
```

With this setup, a request for `/style.css` will look for
`<baseDir>/src/style.css`. Route targets in the `routes` object still
resolve relative to `baseDir` (not `publicDir`), so you would write:

```javascript
"/": "src/index.html"
```

### Option B: Change `baseDir` and adjust route targets

Set `baseDir` to the folder that contains both your static assets and
your route templates, then adjust all route paths accordingly:

```javascript
createServerFromRoutes(routes, {
  baseDir: path.join(import.meta.dirname, "src")
});
```

Now every route target is resolved relative to `src/`:

```javascript
"/": "index.html",
"/articles": { target: "articles/index.html", model: { title: "Articles" } }
```

And `publicDir` defaults to `<baseDir>/public`, which would be
`src/public`. If you do **not** want a separate public directory at all,
set `publicDir` to `null` or point it to the same folder — but note that
the static-first fallback will then try to serve any file that matches
the request path directly out of that folder.

### Summary of directory layouts

```
# Default layout (publicDir = baseDir/public)
project/
├── baseDir/
│   ├── public/          ← static files served first
│   │   ├── index.html
│   │   └── style.css
│   └── templates/       ← route targets (optional sub-folders)
│       └── articles/
│           └── [slug].html

# Using src/ as the static folder
project/
├── baseDir/
│   ├── src/             ← publicDir points here
│   │   ├── index.html
│   │   └── style.css
│   └── templates/       ← route targets
│       └── articles/
│           └── [slug].html
```

## Project structure

```text
demo/
├── server.js            # demo server: routes + createServerFromRoutes
├── build.js             # static HTML generator
├── README.md            # this file
├── dist/              # generated static files (output of build.js)
└── public/              # static files served by the demo
    ├── index.html       # route "/"
    ├── 404.html         # fallback page
    ├── custom-404.html  # custom fallback used in demo/server.js
    ├── style.css        # static CSS
    ├── data.json        # static JSON
    ├── factory.html     # template for the factory route
    ├── header.html      # composed chunk ({{title}})
    ├── footer.html      # composed chunk ({{year}})
    ├── greetings.html   # composed chunk
    ├── section-item.html  # composed chunk ({{content}})
    └── articles/
        ├── index.html   # route "/articles" ({{title}})
        └── [slug].html  # route "/articles/:slug" ({{slug}}, {{title}})
```

## Running the demo

```bash
npm run demo
```

Then try these paths in your browser:

- <http://localhost:7171/> — static home page
- <http://localhost:7171/articles> — route rendered with a `model`
- <http://localhost:7171/articles/hello-world> — dynamic route from `[slug].html`
- <http://localhost:7171/composed> — page composed from header + greetings + footer (concat)
- <http://localhost:7171/composed-stream> — same composition streamed sequentially with per-chunk `delay`
- <http://localhost:7171/factory/hello?lang=id> — route value as a callback using params and query
- <http://localhost:7171/data.json> — static JSON file
- <http://localhost:7171/missing-route> — fallback `404.html` (or custom fallback if configured)