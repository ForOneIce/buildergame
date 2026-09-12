import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { assertAppend, cleanEvent, publicBundle } from '../src/bundle.mjs';

export const validTownSlug = value => typeof value === 'string' && value !== 'index' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const identity = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const metadata = bundle => ({ slug: bundle.event.deployment.slug, name: bundle.event.name, townId: bundle.event.id, path: `/towns/${bundle.event.deployment.slug}/`, createdAt: bundle.event.deployment.createdAt });

export function townDeployment(name, date = new Date()) {
  const createdAt = date.toISOString();
  // Non-Latin names retain their display text; a short hash keeps their URL ASCII-safe.
  const stem = identity(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/, '') || `town-${createHash('sha256').update(identity(name)).digest('hex').slice(0, 8)}`;
  return { slug: `${stem}-${createdAt.replace(/[-:.]/g, '').replace('T', '-').replace('Z', '')}`, createdAt };
}

async function readJson(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw fail('Town storage is unavailable', 503); }
}
async function atomicWrite(file, value) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try { await writeFile(temporary, JSON.stringify(value, null, 2), { flag: 'wx', mode: 0o600 }); await rename(temporary, file); }
  finally { await rm(temporary, { force: true }).catch(() => {}); }
}

// One small public bundle per town; ownership stays in the private envelope.
export function townStore({ directory = 'private/towns', legacyFile = 'private/town.json', staticDirectory = 'public/data/towns', staticFile = 'public/data/town.json', clock = () => new Date() } = {}) {
  directory = resolve(directory); legacyFile = resolve(legacyFile); staticDirectory = resolve(staticDirectory); staticFile = resolve(staticFile);
  let queue = Promise.resolve();
  async function files(path) {
    try { return (await readdir(path, { withFileTypes: true })).filter(entry => entry.isFile() && entry.name.endsWith('.json') && validTownSlug(entry.name.slice(0, -5)) && entry.name !== 'index.json').map(entry => entry.name); }
    catch (error) { if (error.code === 'ENOENT') return []; throw fail('Town storage is unavailable', 503); }
  }
  function normalize(input, slug, local) {
    const bundle = publicBundle(local ? input.bundle : input);
    if (!bundle.event.deployment) {
      const capturedAt = bundle.history.snapshots[0].capturedAt;
      bundle.event.deployment = { slug, createdAt: new Date(capturedAt).toISOString() };
    }
    if (bundle.event.deployment.slug !== slug) throw fail('Town filename does not match its address', 503);
    if (local && (input.format !== 'buildergame-town/v1' || typeof input.owner !== 'string' || !/^[a-z0-9-]{1,39}$/i.test(input.owner))) throw fail('Town storage is unavailable', 503);
    if (local && input.ownerId != null && !/^[1-9][0-9]*$/.test(input.ownerId)) throw fail('Town storage is unavailable', 503);
    return { bundle, owner: local ? input.owner.toLowerCase() : null, ownerId: local && input.ownerId != null ? String(input.ownerId) : null, updatedAt: local && timestamp(input.updatedAt) ? input.updatedAt : bundle.history.snapshots.at(-1).capturedAt };
  }
  async function records() {
    const result = new Map();
    for (const [path, local] of [[directory, true], [staticDirectory, false]]) {
      for (const filename of await files(path)) {
        const slug = filename.slice(0, -5); if (result.has(slug)) continue;
        const input = await readJson(join(path, filename)); if (!input) continue;
        result.set(slug, normalize(input, slug, local));
      }
    }
    return [...result.values()];
  }
  async function readDefault() {
    const input = await readJson(legacyFile) || await readJson(staticFile);
    return input ? publicBundle(input) : null;
  }
  async function get(slug) {
    if (!validTownSlug(slug)) throw fail('Invalid town address', 400);
    const local = await readJson(join(directory, `${slug}.json`));
    if (local) return normalize(local, slug, true).bundle;
    const deployed = await readJson(join(staticDirectory, `${slug}.json`));
    return deployed ? normalize(deployed, slug, false).bundle : null;
  }
  async function prepare(input, login, isDeployer = false, ownerId = null) {
    if (!login || !/^[a-z0-9-]{1,39}$/i.test(login)) throw fail('Sign in with GitHub to publish a town', 401);
    const event = cleanEvent(input);
    if (!identity(event.name) || [...event.name].length > 120) throw fail('Town names must contain 1–120 characters', 400);
    const all = await records();
    const same = all.filter(record => record.bundle.event.id === event.id);
    if (same.length > 1) throw fail('This town has multiple stored addresses. Resolve the duplicate files before publishing.');
    const previous = same[0];
    const legacy = await readDefault();
    const known = previous?.bundle || (legacy?.event.id === event.id ? legacy : null);
    const ownsTown = previous?.ownerId ? previous.ownerId === ownerId : previous?.owner === login.toLowerCase();
    if (previous?.owner && !ownsTown && !isDeployer) throw fail('Only this town’s owner can publish its snapshots', 403);
    if (known && !previous?.owner && !isDeployer) throw fail('Only the configured deployer can update repository-deployed or legacy towns', 403);
    const duplicates = [...all.map(record => record.bundle), ...(legacy ? [legacy] : [])];
    if (duplicates.some(bundle => bundle.event.id !== event.id && identity(bundle.event.name) === identity(event.name))) throw fail('A town with this name already exists. Choose a different name.');
    if (known && known.event.name !== event.name) throw fail('Town names are fixed after creation. Create a new town to choose another name.');
    let deployment = known?.event.deployment;
    if (deployment && event.deployment && JSON.stringify(deployment) !== JSON.stringify(event.deployment)) throw fail('This town’s public address is fixed after creation');
    if (!deployment) {
      const generated = townDeployment(event.name, clock()), base = generated.slug;
      let slug = base;
      while (all.some(record => record.bundle.event.deployment.slug === slug)) slug = `${base}-${randomBytes(3).toString('hex')}`;
      deployment = { ...generated, slug };
      // An imported backup can retain its portable address if no existing town owns it.
      if (event.deployment) {
        if (!validTownSlug(event.deployment.slug)) throw fail('Invalid town address', 400);
        if (all.some(record => record.bundle.event.deployment.slug === event.deployment.slug)) throw fail('This town address is already in use');
        deployment = event.deployment;
      }
    }
    return { event: cleanEvent({ ...event, deployment }), previous: known, owner: previous?.owner || login.toLowerCase(), ownerId: previous?.ownerId || (previous?.owner && !ownsTown ? null : ownerId) };
  }
  function publish(input, login, isDeployer = false, ownerId = null) {
    const task = queue.then(async () => {
      const prepared = await prepare(input.event, login, isDeployer, ownerId);
      const bundle = publicBundle({ ...input, event: prepared.event });
      assertAppend(prepared.previous, bundle);
      const updatedAt = clock().toISOString();
      await atomicWrite(join(directory, `${bundle.event.deployment.slug}.json`), { format: 'buildergame-town/v1', owner: prepared.owner, ownerId: prepared.ownerId, updatedAt, bundle });
      // Keep the original default-town API/file compatible without letting another player replace it.
      if (isDeployer) await atomicWrite(legacyFile, bundle);
      return { bundle, town: { ...metadata(bundle), updatedAt } };
    });
    queue = task.catch(() => {}); return task;
  }
  return { get, readDefault, prepare, publish, async list() { return (await records()).map(({ bundle, updatedAt }) => ({ ...metadata(bundle), updatedAt })).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.slug.localeCompare(b.slug)); } };
}
