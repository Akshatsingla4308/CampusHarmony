// Zero-dependency development server for Campus Harmony Frontend
// Serves static assets from public/ folder on http://localhost:5173
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Normalize URL
  let reqPath = decodeURI(req.url.split('?')[0]);
  // Always open the app from /sms/ so its relative css/js paths resolve correctly
  if (reqPath === '/' || reqPath === '' || reqPath === '/sms' || reqPath === '/sms/') {
    res.writeHead(302, { Location: '/sms/login.html' });
    res.end();
    return;
  }

  let filePath = path.join(PUBLIC_DIR, reqPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If requesting a directory, look for index.html
      if (stats && stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      } else if (path.extname(filePath)) {
        // A missing css/js/image file must be a 404, not the login page (that caused "Unexpected token <")
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      } else {
        // Fallback to login
        filePath = path.join(PUBLIC_DIR, 'sms', 'login.html');
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log('===========================================================');
  console.log(` Campus Harmony Frontend running at: http://localhost:${PORT}`);
  console.log(` Entry Page: http://localhost:${PORT}/sms/login.html`);
  console.log('===========================================================');
});
