import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname);

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

const isWithinDist = (target) => {
  const resolved = path.resolve(target);
  return resolved === distDir || resolved.startsWith(distDir + path.sep);
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://localhost");
  const requestPath = requestUrl.pathname;

  const filePath = path.join(distDir, requestPath);

  if (!isWithinDist(filePath)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(path.join(distDir, "index.html")).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

const port = 3000;
const host = "localhost";

server.listen(port, host, () => {
  console.log(`Dist server running on http://${host}:${port}/`);
});

export default server;