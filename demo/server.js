import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import hashttp from "../src/index.js";
import { getContentType } from "../src/contentType.js";

const demoRoot = path.dirname(fileURLToPath(import.meta.url));

const routes = {
  "/": "public/index.html",
  "/articles": "public/articles.html",
  "/articles/:slug": "public/articles/hello-world.html",
  "/docs": "public/docs",
  "/style.css": "public/style.css",
  "/data.json": { target: "public/data.json", headers: { "Content-Type": "application/json" } },
  "/storage/:file": "public/storage/[file]", // folder-like route: /storage/hello.txt
  "*": { target: "public/404.html", status: 404 },
};

const router = hashttp(routes);

async function mapTargetToFile(target, params = {}) {
  if (!target || typeof target !== "string") return null;
  let filename = target;
  // Replace [param] placeholders
  filename = filename.replace(/\[([a-zA-Z0-9_]+)\]/g, (_, name) => params[name] || "");
  const resolvedPath = path.resolve(demoRoot, filename);

  try {
    const stat = await fs.stat(resolvedPath);
    if (stat.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      return {
        filePath: indexPath,
        contentType: getContentType(indexPath),
      };
    }
  } catch (err) {
    // Ignore missing path and try reading as file later.
  }

  return {
    filePath: resolvedPath,
    contentType: getContentType(resolvedPath),
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;
  const match = router.match(p);

  // The router already has a fallback route for unmatched paths via "*".
  // This guard is an extra safety net if the route table changes or if
  // the fallback route is removed, ensuring the server still returns 404.
  if (!match) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const resolved = router.resolve(match.pointer);
  const fileDetails = await mapTargetToFile(resolved.target, match.params);

  try {
    const data = await fs.readFile(fileDetails.filePath);
    res.writeHead(resolved.status || 200, {
      "Content-Type": fileDetails.contentType,
      ...resolved.headers,
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Resource not found");
  }
});

server.listen(4000, () => {
  console.log("Demo server running at http://localhost:4000");
  console.log("Routes:", router.info());
});
