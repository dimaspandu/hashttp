import http from "http";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import hashttp from "../src/index.js";
import { getContentType } from "../src/contentType.js";

const demoRoot = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(demoRoot, "public");

const routes = {
  "/articles/:slug": "public/articles/hello-world.html",
  "/storage/:file": "public/storage/[file]", // folder-like route: /storage/hello.txt
  "*": { target: "public/404.html", status: 404 },
};

const router = hashttp(routes);

async function mapTargetToFile(target, requestPath, routeKey, isFolderRoute, params = {}) {
  if (!target || typeof target !== "string") return null;
  let filename = target;

  if (isFolderRoute && routeKey && requestPath && requestPath !== routeKey) {
    const relative = requestPath.slice(routeKey.length).replace(/^\//, "");
    if (relative) {
      filename = path.join(filename, relative);
    }
  }

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

async function servePublicFile(requestPath) {
  let relativePath = requestPath.replace(/^\//, "");
  if (!relativePath) {
    relativePath = "index.html";
  }

  const resolvedPath = path.resolve(publicRoot, relativePath);
  if (!resolvedPath.startsWith(publicRoot + path.sep) && resolvedPath !== publicRoot) {
    return null;
  }

  try {
    const stat = await fs.stat(resolvedPath);
    if (stat.isFile()) {
      return {
        filePath: resolvedPath,
        contentType: getContentType(resolvedPath),
      };
    }

    if (stat.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      const indexStat = await fs.stat(indexPath);
      if (indexStat.isFile()) {
        return {
          filePath: indexPath,
          contentType: getContentType(indexPath),
        };
      }
    }
  } catch (err) {
    // Ignore missing path and try route fallback later.
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  const publicFile = await servePublicFile(p);
  if (publicFile) {
    try {
      const data = await fs.readFile(publicFile.filePath);
      res.writeHead(200, { "Content-Type": publicFile.contentType });
      res.end(data);
      return;
    } catch (err) {
      // Fall back to route handling below if public file read fails.
    }
  }

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
  const fileDetails = await mapTargetToFile(resolved.target, p, match.routeKey, resolved.folder, match.params);

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
