import path from "path";
import fs from "fs";
import http from "http";
import { createMatcher } from "../libs/roution/src/roution.js";

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

// Resolve a model definition into a plain data object.
// A model may be a literal object or a factory that receives the route params.
function resolveModel(model, params) {
  if (typeof model === "function") return model(params);
  return model || {};
}

// Substitute `{{ key }}` placeholders with values from the data object.
function renderTemplate(content, data) {
  return content.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) =>
    key in data ? String(data[key]) : ""
  );
}

// Render a single route entry. An entry is either a plain file path (string)
// or an object of the shape { target, model }.
async function renderEntry(entry, params, baseDir) {
  const target = typeof entry === "string" ? entry : entry.target;
  const data = typeof entry === "string" ? {} : resolveModel(entry.model, params);
  const content = await fs.promises.readFile(path.join(baseDir, target), "utf8");
  return renderTemplate(content, data);
}

const targetOf = (entry) =>
  typeof entry === "string" ? entry : entry.target;

/**
 * Create an HTTP server that resolves each request in three steps:
 *   1. Serve a matching static file from `publicDir` (path-traversal safe).
 *   2. Fall back to the route matcher (single file, composed chunks, or template).
 *   3. Serve `404.html` when nothing matches.
 *
 * @param {Object<string, any>} routes - Flat route map accepted by the matcher.
 * @param {Object} [options]
 * @param {string} [options.publicDir] - Directory for static files (default: ./public).
 * @param {number} [options.port] - Port to listen on (default: 7171).
 * @param {string} [options.host] - Host to bind (default: localhost).
 * @returns {import("http").Server}
 */
export function createServerFromRoutes(routes, options = {}) {
  const {
    baseDir = process.cwd(),
    publicDir = path.join(baseDir, "public"),
    port = 7171,
    host = "localhost",
  } = options;

  const matcher = createMatcher(routes);

  // Reject any target that escapes the public directory (path traversal guard).
  const isWithinPublic = (target) => {
    const resolved = path.resolve(target);
    return resolved === publicDir || resolved.startsWith(publicDir + path.sep);
  };

  const fileExists = async (filePath) => {
    try {
      return (await fs.promises.stat(filePath)).isFile();
    } catch {
      return false;
    }
  };

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

      // 2a. Composed response. A route value can be:
      //     - an array (default concat) -> render all chunks, join, send once
      //     - an object { stream: true, chunks: [...] } -> render and write
      //       each chunk sequentially (Transfer-Encoding: chunked)
      const composed = Array.isArray(match.value)
        ? { stream: false, chunks: match.value }
        : match.value;
      const isComposed = composed && Array.isArray(composed.chunks);
      if (isComposed) {
        const first = composed.chunks[0];
        res.writeHead(200, headers(targetOf(first)));
        if (composed.stream) {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          // Stream each chunk as soon as it is rendered, in order. A chunk may
          // carry its own `delay` (ms) applied before it is written, which is
          // useful for demonstrating sequential streaming.
          for (let i = 0; i < composed.chunks.length; i++) {
            const entry = composed.chunks[i];
            const entryDelay = entry && typeof entry === "object" ? entry.delay : undefined;
            if (i > 0 && typeof entryDelay === "number") await sleep(entryDelay);
            const chunk = await renderEntry(entry, match.params, baseDir);
            res.write(chunk);
          }
          res.end();
          return;
        }
        const parts = await Promise.all(
          composed.chunks.map((entry) => renderEntry(entry, match.params, baseDir))
        );
        res.end(parts.join(""));
        return;
      }

      // 2b. Templated response: a single { target, model } entry.
      if (typeof match.value === "object") {
        const html = await renderEntry(match.value, match.params, baseDir);
        res.writeHead(200, headers(match.value.target));
        res.end(html);
        return;
      }

      // 2c. Plain file path: stream it directly based on its extension.
      const filePath = path.join(baseDir, match.value);
      res.writeHead(200, headers(filePath));
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 3. Nothing matched: serve the 404 page.
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(publicDir, "404.html")).pipe(res);
  });

  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}/`);
  });

  return server;
}

export default createServerFromRoutes;
