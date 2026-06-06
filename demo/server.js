import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import hashttp from '../src/index.js';

const routes = {
  '/': 'demo/public/index.html',
  '/articles': 'demo/public/articles.html',
  '/articles/:slug': 'demo/public/articles/hello-world.html',
  '/style.css': 'demo/public/style.css',
  '/data.json': { target: 'demo/public/data.json', headers: { 'Content-Type': 'application/json' } },
  '/storage/:file': 'demo/public/storage/[file]',
  '*': 'demo/public/404.html',
};

const router = hashttp(routes);

function mapTargetToFile(target, params = {}) {
  if (!target || typeof target !== 'string') return null;
  let filename = target;
  // Replace [param] placeholders
  filename = filename.replace(/\[([a-zA-Z0-9_]+)\]/g, (_, name) => params[name] || '');
  return path.resolve(process.cwd(), filename);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const match = router.match(p);

  if (!match) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const resolved = router.resolve(match.pointer);
  const filePath = mapTargetToFile(resolved.target, match.params);

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': resolved.contentType, ...resolved.headers });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Resource not found');
  }
});

server.listen(4000, () => {
  console.log('Demo server running at http://localhost:4000');
  console.log('Routes:', router.info());
});
