import path from "path";
import url from "url";
import http from "http";
import fs from "fs";
import createMatcher from "../helpers/roution/src/roution.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");

const routes = {
  "/": "public/index.html",
  "/articles": {
    target: "public/articles/index.html",
    struct: { title: "Articles" },
  },
  "/articles/:slug": {
    target: "public/articles/[slug].html",
    // `struct` can be a plain object or a factory that receives the matched params.
    struct: (params) => ({
      slug: params.slug,
      title: params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }),
  },
  "/composed": [
    {
      target: "public/header.html",
      struct: { title: "Hello, World!" },
    },
    "public/greetings.html",
    {
      target: "public/footer.html",
      struct: { year: new Date().getFullYear() },
    },
  ],
};

const matcher = createMatcher(routes);

const typeMap = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const contentType = (file) =>
  typeMap[path.extname(file).toLowerCase()] || "application/octet-stream";

// Reject any target that escapes the public directory (path traversal guard).
function isWithinPublic(target) {
  const resolved = path.resolve(target);
  return resolved === publicDir || resolved.startsWith(publicDir + path.sep);
}

async function fileExists(filePath) {
  try {
    return (await fs.promises.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

// Resolve a struct definition into a plain data object.
// A struct may be a literal object or a factory that receives the route params.
function resolveStruct(struct, params) {
  if (typeof struct === "function") return struct(params);
  return struct || {};
}

// Substitute `{{ key }}` placeholders with values from the data object.
function renderTemplate(content, data) {
  return content.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) =>
    key in data ? String(data[key]) : ""
  );
}

// Render a single matcher entry. An entry is either a plain file path (string)
// or an object of the shape { target, struct }.
async function renderEntry(entry, params) {
  const target = typeof entry === "string" ? entry : entry.target;
  const data = typeof entry === "string" ? {} : resolveStruct(entry.struct, params);
  const content = await fs.promises.readFile(path.join(__dirname, target), "utf8");
  return renderTemplate(content, data);
}

function targetOf(entry) {
  return typeof entry === "string" ? entry : entry.target;
}

const server = http.createServer(async (req, res) => {
  const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;

  // 1. Try to serve the request directly from the public folder.
  //    Safe and existing files are streamed as-is based on their extension.
  const staticPath = path.join(publicDir, requestPath);
  if (isWithinPublic(staticPath) && (await fileExists(staticPath))) {
    res.writeHead(200, {
      "Content-Type": contentType(staticPath),
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(staticPath).pipe(res);
    return;
  }

  // 2. Otherwise fall back to the route matcher.
  const match = matcher.match(requestPath);
  if (match.found) {
    const headers = (file) => ({
      "Content-Type": contentType(file),
      "Access-Control-Allow-Origin": "*",
    });

    // 2a. Chunked response: a list of entries rendered and joined in order.
    if (Array.isArray(match.value)) {
      const parts = await Promise.all(
        match.value.map((entry) => renderEntry(entry, match.params))
      );
      res.writeHead(200, headers(targetOf(match.value[0])));
      res.end(parts.join(""));
      return;
    }

    // 2b. Templated response: a single { target, struct } entry.
    if (typeof match.value === "object") {
      const html = await renderEntry(match.value, match.params);
      res.writeHead(200, headers(match.value.target));
      res.end(html);
      return;
    }

    // 2c. Plain file path: stream it directly based on its extension.
    const filePath = path.join(__dirname, match.value);
    res.writeHead(200, headers(filePath));
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 3. Nothing matched: serve the 404 page.
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  fs.createReadStream(path.join(publicDir, "404.html")).pipe(res);
});

const port = 7171;

server.listen(port, "localhost", () => {
  console.log(`Server is running on http://localhost:${port}/`);
});
