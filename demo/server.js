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
    // `model` can be a plain object or a factory that receives the matched params.
    model: (params) => ({
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
};

createServerFromRoutes(routes, { baseDir: demoDir });
