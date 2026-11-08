/**
 * Локальный статический сервер, эмулирующий .htaccess:
 * /path → path.html, / → index.html, 404 → 404.html.
 * Только для проверки сборки: node scripts/static-server.mjs [port]
 */

import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.argv[2] ?? 3200);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const candidates = [
    path.join(root, clean),
    path.join(root, `${clean}.html`),
    path.join(root, clean, "index.html"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    const notFound = path.join(root, "404.html");
    if (existsSync(notFound)) createReadStream(notFound).pipe(res);
    else res.end("404");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`static server: http://127.0.0.1:${port}`);
});
