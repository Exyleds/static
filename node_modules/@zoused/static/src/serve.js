import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderTemplate } from './templates/index.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

function resolveInside(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const stripped = decoded.replace(/^\/+/, '');
  const filePath = path.resolve(root, stripped);
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (filePath !== root && !filePath.startsWith(rootWithSep)) {
    return null;
  }
  return filePath;
}

async function sendFile(res, filePath) {
  const data = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(data);
}

async function sendStatus(res, status) {
  let body;
  try {
    body = await renderTemplate(String(status));
  } catch {
    body = String(status);
  }
  res.writeHead(status, {
    'Content-Type': body === String(status)
      ? 'text/plain; charset=utf-8'
      : 'text/html; charset=utf-8',
  });
  res.end(body);
}

export function serveSite({ dir, port }) {
  const root = path.resolve(dir);

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const filePath = resolveInside(root, url.pathname);
      if (!filePath) {
        await sendStatus(res, 403);
        return;
      }

      let target = filePath;
      try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) target = path.join(filePath, 'index.html');
      } catch (error) {
        if (error.code === 'ENOENT') {
          await sendStatus(res, 404);
          return;
        }
        throw error;
      }

      await sendFile(res, target);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') {
        await sendStatus(res, 404);
        return;
      }
      await sendStatus(res, 500);
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}
