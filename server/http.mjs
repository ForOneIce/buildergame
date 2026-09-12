import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { createApi } from './api.mjs';
import { validTownSlug } from './towns.mjs';

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };

export function createWebHandler({ api, root = resolve('dist') } = {}) {
  root = resolve(root);
  api ||= createApi(process.env, { staticDirectory: join(root, 'data', 'towns'), staticFile: join(root, 'data', 'town.json') });
  return async (req, res) => {
    if (req.url.startsWith('/api/')) return api(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const route = pathname.match(/^\/towns\/([^/]+)(\/?)$/);
      if (route && !validTownSlug(route[1])) throw new Error('Invalid town address');
      if (route && !route[2]) { res.writeHead(308, { Location: `/towns/${route[1]}/${url.search}`, 'Cache-Control': 'no-cache' }); return res.end(); }
      const file = resolve(root, '.' + (route || pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + sep)) throw new Error('Invalid path');
      let data = await readFile(file);
      // Nested town routes share the same root assets and API on the Node deployment.
      if (route) data = Buffer.from(data.toString('utf8').replace(/<head(?:\s[^>]*)?>/i, '$&<base href="/">'));
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': route || pathname.endsWith('.json') ? 'no-cache' : 'public, max-age=300' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' }); res.end(req.method === 'HEAD' ? undefined : 'Not found'); }
  };
}
