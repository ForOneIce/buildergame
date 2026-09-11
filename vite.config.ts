import { defineConfig, loadEnv } from 'vite';
import { createApi } from './server/api.mjs';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [{ name: 'buildergame-api', configureServer(server) {
    const api = createApi({ ...process.env, ...loadEnv(mode, '.', '') });
    server.middlewares.use((req, res, next) => { if (req.url?.startsWith('/api/')) void api(req, res); else next(); });
  } }],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, fs: { deny: ['.env', '.env.*', '**/private/**', '**/.git/**', '**/server/**', '**/tests/**'] } },
  define: { __DEPLOYED_AT__: JSON.stringify(new Date().toISOString()) },
}));
