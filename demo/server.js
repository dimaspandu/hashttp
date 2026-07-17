import path from "path";
import { fileURLToPath } from "url";
import { createServerFromRoutes } from "../src/hashttp.js";

const demoDir = path.dirname(fileURLToPath(import.meta.url));

const routes = {
  "/": "public/index.html",
  "/articles": {
    target: "public/articles/index.html",
    model: { title: "Articles" },
  },
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    // `model` can be a plain object or a factory that receives the request context.
    model: ({ params }) => ({
      slug: params.slug,
      title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
  "/composed": [
    {
      target: "public/header.html",
      model: { title: "Hello, World!" },
    },
    "public/greetings.html",
    {
      target: "public/footer.html",
      model: { year: new Date().getFullYear() },
    },
  ],
  // Streaming mode: chunks are written sequentially (Transfer-Encoding: chunked)
  // instead of being joined into one full response first. Each chunk may carry
  // its own `delay` (ms) applied before it is written, for demonstration. The
  // first chunk has no delay so the response starts immediately.
  "/composed-stream": {
    stream: true,
    chunks: [
      {
        target: "public/header.html",
        model: { title: "Streaming" },
      },
      {
        target: "public/greetings.html",
        delay: 1000,
      },
      {
        target: "public/footer.html",
        model: { year: new Date().getFullYear() },
        delay: 2000,
      },
    ],
  },
  // Route value as a factory/callback: invoked with the request context
  // ({ params, query, pathname }) and must return the real route shape
  // (string, object, or composed). Useful for deriving the target or model
  // at request time.
  "/factory/:name": ({ params, query }) => ({
    target: "public/factory.html",
    model: {
      name: params.name,
      lang: query.lang || "en",
    },
  }),
};

createServerFromRoutes(routes, { baseDir: demoDir });
