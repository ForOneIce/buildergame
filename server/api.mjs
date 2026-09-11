import { randomBytes } from 'node:crypto';
import { readFile, mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { publicBundle, cleanEvent, assertAppend } from '../src/bundle.mjs';
import { capture, github } from './github.mjs';

const tokenId = () => randomBytes(32).toString('hex');
const cookie = (name, value, secure, age) => `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;
export function createApi(env = process.env, options = {}) {
  const sessions = new Map(), states = new Map(), limits = new Map();
  const origin = env.PUBLIC_ORIGIN || 'http://127.0.0.1:5173';
  const secure = origin.startsWith('https:');
  const file = resolve(env.TOWN_DATA_FILE || 'private/town.json');
  const fetcher = options.fetcher || fetch;
  const configured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_ALLOWED_LOGIN);
  let busy = false;
  async function load() {
    try { return publicBundle(JSON.parse(await readFile(file, 'utf8'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { return publicBundle(JSON.parse(await readFile('public/data/town.json', 'utf8'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
  }
  return async function api(req, res) {
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    const redirect = (url, cookies) => { res.writeHead(302, { Location: url, 'Set-Cookie': cookies, 'Cache-Control': 'no-store' }); res.end(); };
    try {
      const now = Date.now(); for (const [id, s] of sessions) if (s.expires < now) sessions.delete(id); for (const [id, s] of states) if (s.expires < now) states.delete(id); for (const [id,t] of limits) if (now-t>60000)limits.delete(id);
      const url = new URL(req.url, origin);
      const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(s => s.trim().split('=')));
      const session = sessions.get(cookies.bg_session);
      const authenticated = Boolean(session);
      if (req.method !== 'GET' && req.headers.origin !== origin) return json({ error: 'Cross-origin request rejected' }, 403);
      async function body() { let size = 0, chunks = []; for await (const c of req) { size += c.length; if (size > 12 * 1024 * 1024) throw new Error('File exceeds 12 MB'); chunks.push(c); } return JSON.parse(Buffer.concat(chunks).toString()); }
      if (url.pathname === '/api/session' && req.method === 'GET') return json({ configured, authenticated, login: session?.login || null });
      if (url.pathname === '/api/town' && req.method === 'GET') return json(await load());
      if (url.pathname === '/api/auth/login' && req.method === 'GET') {
        if (!configured) return json({ error: 'Configure the GitHub OAuth app and allowed deployer login in .env first.' }, 503);
        if(states.size >= 1000)return json({error:'Try again later'},429);
        const state = tokenId(); states.set(state, { expires: now + 600000 });
        const target = new URL('https://github.com/login/oauth/authorize');
        target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${origin}/api/auth/callback`, state, scope: '' }).toString();
        return redirect(target.href, cookie('bg_state', state, secure, 600));
      }
      if (url.pathname === '/api/auth/callback' && req.method === 'GET') {
        const state = url.searchParams.get('state');
        if (!state || state !== cookies.bg_state || !states.has(state) || !url.searchParams.get('code')) return json({ error: 'Invalid or expired GitHub login state' }, 400);
        states.delete(state);
        const exchange = await fetcher('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: `${origin}/api/auth/callback` }), signal: AbortSignal.timeout(20000) });
        const grant = await exchange.json(); if (!exchange.ok || !grant.access_token) throw new Error('GitHub authorization failed');
        const { data: user } = await github('/user', grant.access_token, fetcher);
        if (user.login.toLowerCase() !== env.GITHUB_ALLOWED_LOGIN.toLowerCase()) return json({ error: 'This GitHub account is not the configured town deployer' }, 403);
        if(cookies.bg_session)sessions.delete(cookies.bg_session);
        const id = tokenId(); sessions.set(id, { token: grant.access_token, login: user.login, expires: now + 8 * 3600000 });
        return redirect('/?setup=personal', [cookie('bg_session', id, secure, 28800), cookie('bg_state', '', secure, 0)]);
      }
      if (url.pathname === '/api/auth/logout' && req.method === 'POST') { sessions.delete(cookies.bg_session); res.setHeader('Set-Cookie', cookie('bg_session', '', secure, 0)); return json({ ok: true }); }
      if (url.pathname === '/api/repos' && req.method === 'GET') {
        const owner = session?.login || url.searchParams.get('owner');
        const page = Number(url.searchParams.get('page') || 1);
        if (!owner || !/^[\w-]{1,39}$/.test(owner) || !Number.isInteger(page) || page < 1 || page > 100) return json({ error: 'Invalid GitHub username or page' }, 400);
        const { data, headers } = await github(`/users/${owner}/repos?type=owner&sort=full_name&per_page=100&page=${page}`, session?.token, fetcher);
        return json({ owner, nextPage: /rel="next"/.test(headers.get('link') || '') ? page + 1 : null, repositories: data.filter(r => !r.private).map(r => ({ repository: r.html_url, name: r.name, description: r.description || '', fork: r.fork, stars: r.stargazers_count, builder: { name: owner, url: r.owner.html_url, avatar: r.owner.avatar_url } })) });
      }
      if (url.pathname === '/api/capture' && req.method === 'POST') {
        const input = await body();
        if (input.publish && !authenticated) return json({ error: 'Sign in as the configured deployer to publish' }, 401);
        if (busy) return json({ error: 'Another snapshot is being captured. Please retry shortly.' }, 409);
        const peer = req.socket.remoteAddress; if (!authenticated && now - (limits.get(peer) || 0) < 60000) return json({ error: 'Wait one minute between public previews.' }, 429);
        const old = input.previous ? publicBundle(input.previous) : null;
        const event = cleanEvent(input.event);
        if (!authenticated && event.projects.length > 20) return json({ error: 'Public previews support up to 20 repositories. Sign in for larger collections.' }, 400);
        if (old) assertAppend(old, { ...old, event });
        if (old && old.event.id !== event.id) throw new Error('Snapshot belongs to a different town');
        const published = input.publish ? await load() : null;
        // Catch omitted or edited server history before expensive GitHub calls.
        if(published?.event.id === event.id && (!old || JSON.stringify(old.history)!==JSON.stringify(published.history)))return json({error:'Load the current published town before appending a snapshot.'},409);
        busy = true; limits.set(peer, now);
        try {
          const result = await capture(event, old?.history, session?.token, fetcher);
          if (input.publish) {
            assertAppend(published, result.bundle);
            await mkdir(dirname(file), { recursive: true }); const temporary = `${file}.${tokenId()}.tmp`;
            await writeFile(temporary, JSON.stringify(result.bundle, null, 2)); await rename(temporary, file);
          }
          return json({ ...result, published: Boolean(input.publish) });
        } finally { busy = false; }
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      const message = error instanceof SyntaxError ? 'Invalid JSON data' : error.message || 'Request failed';
      // Messages from local validation / our GitHub wrapper never include tokens or provider response bodies.
      return json({ error: message.includes('ENOENT') || message.includes('EACCES') ? 'Town storage is unavailable' : message }, 400);
    }
  };
}
