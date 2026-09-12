import { randomBytes } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { publicBundle, cleanEvent, assertAppend } from '../src/bundle.mjs';
import { capture, github } from './github.mjs';
import { townDeployment, townStore, validTownSlug } from './towns.mjs';

const tokenId = () => randomBytes(32).toString('hex');
const cookie = (name, value, secure, age) => `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;
export function createApi(env = process.env, options = {}) {
  const sessions = new Map(), states = new Map(), limits = new Map();
  const origin = env.PUBLIC_ORIGIN || 'http://127.0.0.1:5173';
  const secure = origin.startsWith('https:');
  const file = resolve(env.TOWN_DATA_FILE || 'private/town.json');
  const fetcher = options.fetcher || fetch;
  const configured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  const playerConfigured = configured;
  const towns = townStore({ directory: env.TOWN_DATA_DIR || join(dirname(file), 'towns'), legacyFile: file, ...(options.staticDirectory ? { staticDirectory: options.staticDirectory } : {}), ...(options.staticFile ? { staticFile: options.staticFile } : {}) });
  let busy = false;
  return async function api(req, res) {
    const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
    const redirect = (url, cookies) => { res.writeHead(302, { Location: url, 'Set-Cookie': cookies, 'Cache-Control': 'no-store' }); res.end(); };
    try {
      const now = Date.now(); for (const [id, s] of sessions) if (s.expires < now) sessions.delete(id); for (const [id, s] of states) if (s.expires < now) states.delete(id); for (const [id,t] of limits) if (now-t>60000)limits.delete(id);
      const url = new URL(req.url, origin);
      const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(s => s.trim().split('=')));
      const session = sessions.get(cookies.bg_session);
      const authenticated = Boolean(session);
      const isDeployer = Boolean(session && env.GITHUB_ALLOWED_LOGIN && session.login.toLowerCase() === env.GITHUB_ALLOWED_LOGIN.toLowerCase());
      if (req.method !== 'GET' && req.headers.origin !== origin) return json({ error: 'Cross-origin request rejected' }, 403);
      async function body() { let size = 0, chunks = []; for await (const c of req) { size += c.length; if (size > 12 * 1024 * 1024) throw new Error('File exceeds 12 MB'); chunks.push(c); } return JSON.parse(Buffer.concat(chunks).toString()); }
      if (url.pathname === '/api/session' && req.method === 'GET') return json({ configured, playerConfigured, authenticated, canPublish: authenticated, isDeployer, login: session?.login || null, avatar: session?.avatar || null });
      if (url.pathname === '/api/progress' && ['GET','POST'].includes(req.method)) {
        return json({ error: 'Exploration progress is stored only in your browser. Server synchronization has been retired.' }, 410);
      }
      if (url.pathname === '/api/town' && req.method === 'GET') return json(await towns.readDefault());
      if (url.pathname === '/api/towns' && req.method === 'GET') return json({ towns: await towns.list() });
      if (url.pathname.startsWith('/api/towns/') && req.method === 'GET') {
        const slug = url.pathname.slice('/api/towns/'.length).replace(/\/$/, '');
        if (!validTownSlug(slug)) return json({ error: 'Invalid town address' }, 400);
        const town = await towns.get(slug);
        return town ? json(town) : json({ error: 'Town not found' }, 404);
      }
      if (url.pathname === '/api/auth/login' && req.method === 'GET') {
        const player=url.searchParams.get('role')==='player';
        if (!(player?playerConfigured:configured)) return json({ error: 'GitHub sign-in is not configured on this deployment.' }, 503);
        if(states.size >= 1000)return json({error:'Try again later'},429);
        const requestedReturn = url.searchParams.get('returnTo');
        const returnMatch = requestedReturn?.match(/^\/towns\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
        const returnTo = requestedReturn === '/?setup=personal' ? requestedReturn : returnMatch && validTownSlug(returnMatch[1]) ? `/towns/${returnMatch[1]}/` : null;
        const state = tokenId(); states.set(state, { expires: now + 600000, player, returnTo });
        const target = new URL('https://github.com/login/oauth/authorize');
        target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${origin}/api/auth/callback`, state, scope: '' }).toString();
        return redirect(target.href, cookie('bg_state', state, secure, 600));
      }
      if (url.pathname === '/api/auth/callback' && req.method === 'GET') {
        const state = url.searchParams.get('state');
        if (!state || state !== cookies.bg_state || !states.has(state) || !url.searchParams.get('code')) return json({ error: 'Invalid or expired GitHub login state' }, 400);
        const {player,returnTo}=states.get(state);states.delete(state);
        const exchange = await fetcher('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: url.searchParams.get('code'), redirect_uri: `${origin}/api/auth/callback` }), signal: AbortSignal.timeout(20000) });
        const grant = await exchange.json(); if (!exchange.ok || !grant.access_token) throw new Error('GitHub authorization failed');
        const { data: user } = await github('/user', grant.access_token, fetcher);
        if (typeof user.login !== 'string' || !/^[a-z0-9-]{1,39}$/i.test(user.login) || !Number.isSafeInteger(user.id) || user.id < 1) throw new Error('GitHub authorization failed');
        if(cookies.bg_session)sessions.delete(cookies.bg_session);
        const id = tokenId(); sessions.set(id, { token: grant.access_token, login: user.login, userId: String(user.id), avatar: user.avatar_url || null, expires: now + 8 * 3600000 });
        return redirect(returnTo || (player?'/?town=1':'/?setup=personal'), [cookie('bg_session', id, secure, 28800), cookie('bg_state', '', secure, 0)]);
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
        if (input.publish && !authenticated) return json({ error: 'Sign in with GitHub to publish a town' }, 401);
        if (busy) return json({ error: 'Another snapshot is being captured. Please retry shortly.' }, 409);
        const peer = req.socket.remoteAddress; if (!authenticated && now - (limits.get(peer) || 0) < 60000) return json({ error: 'Wait one minute between public previews.' }, 429);
        const old = input.previous ? publicBundle(input.previous) : null;
        let event = cleanEvent(input.event);
        if (!authenticated && event.projects.length > 20) return json({ error: 'Public previews support up to 20 repositories. Sign in for larger collections.' }, 400);
        if (old) assertAppend(old, { ...old, event });
        if (old && old.event.id !== event.id) throw new Error('Snapshot belongs to a different town');
        busy = true; limits.set(peer, now);
        try {
          const prepared = input.publish ? await towns.prepare(event, session.login, isDeployer, session.userId) : null;
          event = prepared?.event || cleanEvent({ ...event, deployment: event.deployment || townDeployment(event.name) });
          const published = prepared?.previous;
          // Catch omitted or edited history before expensive GitHub calls.
          if (published && (!old || JSON.stringify(old.history) !== JSON.stringify(published.history))) return json({ error: 'Load the current published town before appending a snapshot.' }, 409);
          const result = await capture(event, old?.history, session?.token, fetcher, { label: input.label });
          if (input.publish) {
            const saved = await towns.publish(result.bundle, session.login, isDeployer, session.userId);
            return json({ ...result, ...saved, published: true });
          }
          return json({ ...result, published: false });
        } finally { busy = false; }
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      const message = error instanceof SyntaxError ? 'Invalid JSON data' : error.message || 'Request failed';
      // Messages from local validation / our GitHub wrapper never include tokens or provider response bodies.
      const storageError = typeof error.code === 'string' && /^E[A-Z0-9_]+$/.test(error.code);
      return json({ error: storageError || message.includes('ENOENT') || message.includes('EACCES') ? 'Town storage is unavailable' : message }, error.status || 400);
    }
  };
}
