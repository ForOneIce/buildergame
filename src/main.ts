import './style.css';
import { validateSnapshots, safeUrl } from './model.mjs';
import { createTown } from './town';
import { projectDestination } from './links';
import type { TownEvent, History, Project } from './types';

declare const __DEPLOYED_AT__: string;
const app = document.querySelector<HTMLDivElement>('#app')!;
const html = (text: unknown) => String(text ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const date = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));
const stageName = (stage: string | null) => stage ? ({ land: 'Open land', foundation: 'Foundation', frame: 'Timber frame', cottage: 'Cottage', townhouse: 'Townhouse', decorated: 'Garden house' }[stage] ?? stage) : 'Awaiting data';
async function getJson(path: string) {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Cannot load ${path} (${response.status})`);
  return response.json();
}
async function start() {
  const [event, initialHistory]: [TownEvent, History] = await Promise.all([getJson('event.json'), getJson('snapshots.json')]);
  validateSnapshots(event, initialHistory); let history = initialHistory;
  document.title = `${event.name} · Buildergame`;
  let index = history.snapshots.length - 1, selected: string | null = null, playing: ReturnType<typeof setInterval> | undefined;
  let town: ReturnType<typeof createTown> | undefined;
  app.innerHTML = `
    <header class="masthead"><a class="brand" href="${html(safeUrl(event.url) || '#')}" target="_blank" rel="noopener noreferrer"><span class="brand-mark">b<span>g</span></span><span>buildergame<small>A HOME FOR WHAT YOU BUILD</small></span></a><div class="edition">${event.sampleData ? '<span class="sample-dot"></span> SAMPLE EDITION' : 'COMMUNITY EDITION'}<span class="edition-line">No wallet needed</span></div></header>
    <main>
      <section class="intro"><div><p class="eyebrow">THE HACKATHON CONTINUES HERE</p><h1>${html(event.name)}<span>Builder town.</span></h1><p class="intro-copy">${html(event.subtitle)}</p></div><div class="intro-note"><span class="note-star">✳</span><p>Good things<br>keep growing.</p><span>Built together. Remembered together.</span></div></section>
      <section class="workspace" aria-label="Town explorer">
        <div class="town-column"><div class="scene-shell"><div id="scene"></div><div class="scene-top"><span class="scene-label"><i></i> <span id="scene-date"></span></span><span class="scene-tag">${event.sampleData ? 'FICTIONAL PROJECTS · PREVIEW ART' : 'RECORDED GITHUB SNAPSHOT'}</span></div><div class="scene-bottom"><span>Drag to orbit · Scroll to zoom<br>Sign → meet builder · House → visit project</span><button id="reset" class="round-button" aria-label="Reset town camera" title="Reset town camera">↺</button></div><div class="welcome" aria-hidden="true"><span>WELCOME TO</span><strong>${html(event.name)}</strong><small>Every project has a place.</small></div></div>
          <div class="timeline"><div class="timeline-heading"><div><p class="eyebrow">TOWN TIME MACHINE</p><h2 id="version-name"></h2></div><button id="play" class="quiet-button" aria-label="Play recorded timeline">▶ Play history</button></div><div class="scrubber"><button id="previous" aria-label="Previous snapshot">←</button><input id="timeline" type="range" min="0" max="${history.snapshots.length - 1}" value="${index}" step="1" aria-label="Recorded snapshot"><button id="next" aria-label="Next snapshot">→</button></div><div class="timeline-labels"><span id="first-date"></span><span id="last-date"></span></div><p id="timeline-status" class="timeline-status" role="status" aria-live="polite"></p></div>
        </div>
        <aside class="directory"><div class="directory-heading"><div><p class="eyebrow">AROUND THE NEIGHBORHOOD</p><h2>Meet the builders <span>${event.projects.length}</span></h2></div><label class="search-label"><span class="sr-only">Find a project or builder</span><input id="search" type="search" placeholder="Find a project or builder…"></label></div><div id="projects" class="project-list"></div><p class="directory-foot">Fixed plots. Shared history. Open doors.</p></aside>
      </section>
      <section class="about"><div><span class="section-number">01 /</span><h2>A town that remembers.</h2><p>Travel between recorded snapshots. Every project keeps its plot, so the changes have a place to call home.</p></div><div><span class="section-number">02 /</span><h2>Your event, your values.</h2><p>Buildings follow the organizer’s chosen metrics. This edition combines historical commits, stars and forks.</p></div><div><span class="section-number">03 /</span><h2>Leave the door open.</h2><p>Meet a builder, visit their project, and follow what happens next. Participation starts with curiosity.</p></div></section>
      <p class="data-note">${event.sampleData ? 'Preview: all project names, builders and historical metrics are fictional. These are not verified ETHOnline submissions. Visuals and growth settings are provisional.' : 'Counts are observations, not quality ratings. Forks do not establish contributions. Unavailable observations retain their last known building.'}</p>
    </main><footer><span>buildergame <span class="footer-separator">/</span> An open home for hackathon projects</span><span>Build version <time>${html(__DEPLOYED_AT__)}</time></span></footer>
    <dialog id="details" aria-labelledby="detail-title"><div class="dialog-top"><span class="eyebrow">A PLACE IN THE TOWN</span><button id="close" class="round-button" aria-label="Close project details">×</button></div><div id="detail-body"></div></dialog>`;
  const el = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
  const slider = el<HTMLInputElement>('#timeline'); const search = el<HTMLInputElement>('#search'); const dialog = el<HTMLDialogElement>('#details');
  function avatar(project: Project) {
    return project.builder.avatar ? `<img class="avatar" alt="" src="${html(project.builder.avatar)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="avatar initials">${html(project.builder.name.slice(0, 2).toUpperCase())}</span>`;
  }
  function renderList() {
    const filter = search.value.toLowerCase();
    const projects = event.projects.filter(p => `${p.name} ${p.description} ${p.builder.name}`.toLowerCase().includes(filter));
    el('#projects').innerHTML = projects.length ? projects.map(p => {
      const state = history.snapshots[index].projects.find(r => r.projectId === p.id)!;
      return `<button class="project-card ${selected === p.id ? 'selected' : ''}" data-project="${p.id}">${avatar(p)}<span class="project-copy"><strong>${html(p.name)}</strong><span>${html(p.builder.name)}</span><small class="stage">${stageName(state.stage)}${state.status === 'stale' ? ' · Last known' : ''}</small></span><span class="card-arrow">↗</span></button>`;
    }).join('') : '<p class="no-results">No neighbors match that search.</p>';
    el('#projects').querySelectorAll<HTMLButtonElement>('[data-project]').forEach(button => button.addEventListener('click', () => showProject(button.dataset.project!)));
  }
  function renderDetails() {
    const project = event.projects.find(p => p.id === selected); if (!project) return;
    const state = history.snapshots[index].projects.find(p => p.projectId === selected)!;
    const metrics = state.metrics;
    el('#detail-body').innerHTML = `${avatar(project)}<p class="eyebrow detail-builder">${html(project.builder.name)}</p><h2 id="detail-title">${html(project.name)}</h2><p class="detail-description">${html(project.description)}</p><p class="builder-bio">${html(project.builder.bio || '')}</p><span class="stage detail-stage">${stageName(state.stage)}</span><dl class="metrics"><div><dt>Commits</dt><dd>${metrics?.commits.toLocaleString() ?? '—'}</dd></div><div><dt>Stars</dt><dd>${metrics?.stars.toLocaleString() ?? '—'}</dd></div><div><dt>Forks</dt><dd>${metrics?.forks.toLocaleString() ?? '—'}</dd></div></dl><p class="observation">${state.status === 'stale' ? 'Last known observation · ' : state.status === 'unknown' ? 'Observation unavailable' : 'Observed · '}${state.observedAt ? date(state.observedAt) + ' UTC' : ''}<br>${event.sampleData ? 'Fictional sample metrics. Repository links below are placeholders.' : 'Commits include history reachable from the recorded default-branch HEAD.'}</p><div class="detail-actions"><a class="primary-button" href="${html(projectDestination(project))}" target="_blank" rel="noopener noreferrer">${event.sampleData ? 'Sample project link' : 'Visit project'} ↗</a><a class="quiet-button" href="${html(project.repository)}" target="_blank" rel="noopener noreferrer">Star on GitHub ↗</a>${project.builder.url ? `<a class="quiet-button" href="${html(project.builder.url)}" target="_blank" rel="noopener noreferrer">Meet / follow builder ↗</a>` : ''}</div>`;
  }
  function showProject(id: string) { selected = id; town?.focus(id); renderList(); renderDetails(); if (!dialog.open) dialog.showModal(); }
  function renderSnapshot(next: number) {
    const prior = history.snapshots[index]; index = next;
    const snapshot = history.snapshots[index]; slider.value = String(index); slider.setAttribute('aria-valuetext', `${snapshot.label}, ${date(snapshot.capturedAt)} UTC`);
    el('#scene-date').textContent = date(snapshot.capturedAt) + ' UTC';
    el('#version-name').textContent = snapshot.label;
    el('#first-date').textContent = date(history.snapshots[0].capturedAt);
    el('#last-date').textContent = date(history.snapshots.at(-1)!.capturedAt) + ' UTC';
    const changed = snapshot.projects.filter(r => r.stage !== prior.projects.find(p => p.projectId === r.projectId)?.stage).length;
    el('#timeline-status').textContent = `${index + 1} / ${history.snapshots.length} snapshots · ${changed ? `${changed} building${changed === 1 ? '' : 's'} changed · ` : ''}${event.mode === 'live' ? 'Published updates checked periodically' : 'Recorded showcase'}${event.sampleData ? ' · Sample history' : ''}`;
    el<HTMLButtonElement>('#previous').disabled = index === 0; el<HTMLButtonElement>('#next').disabled = index === history.snapshots.length - 1;
    town?.update(snapshot); renderList(); if (dialog.open) renderDetails();
  }
  function stop() { clearInterval(playing); playing = undefined; el('#play').textContent = '▶ Play history'; el('#play').setAttribute('aria-label', 'Play recorded timeline'); }
  slider.addEventListener('input', () => { stop(); renderSnapshot(Number(slider.value)); });
  el('#previous').addEventListener('click', () => { stop(); renderSnapshot(Math.max(0, index - 1)); });
  el('#next').addEventListener('click', () => { stop(); renderSnapshot(Math.min(history.snapshots.length - 1, index + 1)); });
  el<HTMLButtonElement>('#play').disabled = history.snapshots.length < 2;
  el('#play').addEventListener('click', () => {
    if (playing) return stop();
    if (index === history.snapshots.length - 1) renderSnapshot(0);
    el('#play').textContent = 'Ⅱ Pause history'; el('#play').setAttribute('aria-label', 'Pause recorded timeline');
    playing = setInterval(() => { if (index < history.snapshots.length - 1) renderSnapshot(index + 1); if (index === history.snapshots.length - 1) stop(); }, 2300);
  });
  search.addEventListener('input', renderList);
  el('#close').addEventListener('click', () => dialog.close());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  try {
    town = createTown(el('#scene'), event.projects, (id, open) => {
      const project = event.projects.find(p => p.id === id)!;
      if (open && !event.sampleData) window.open(projectDestination(project), '_blank', 'noopener,noreferrer'); else showProject(id);
    });
  } catch (error) {
    console.warn('3D renderer unavailable', error);
    el('#scene').innerHTML = '<div class="webgl-fallback"><h2>The town is here, in list form.</h2><p>3D rendering is unavailable in this browser. Explore every project using the directory.</p></div>';
    el<HTMLButtonElement>('#reset').disabled = true;
  }
  el('#reset').addEventListener('click', () => town?.reset()); renderSnapshot(index);
  if (event.mode === 'live') setInterval(async () => {
    if (document.hidden) return;
    try {
      const updated: History = await getJson('snapshots.json'); validateSnapshots(event, updated);
      if (updated.snapshots.length < history.snapshots.length || history.snapshots.some((old, i) => JSON.stringify(old) !== JSON.stringify(updated.snapshots[i]))) throw new Error('Published history was rewritten; reload after organizer review');
      if (updated.snapshots.length === history.snapshots.length) return;
      const wasLatest = index === history.snapshots.length - 1; history = updated; slider.max = String(history.snapshots.length - 1);
      el<HTMLButtonElement>('#play').disabled = history.snapshots.length < 2;
      renderSnapshot(wasLatest ? history.snapshots.length - 1 : index);
    } catch { el('#timeline-status').textContent = 'Could not load a valid update. Keeping the last recorded town.'; }
  }, event.refreshSeconds * 1000);
}
start().catch(error => { app.innerHTML = `<main class="load-error"><p class="eyebrow">TOWN COULD NOT OPEN</p><h1>Please check the event data.</h1><p>${html(error.message)}</p><p>Organizer: run <code>npm run validate</code> before building.</p><button onclick="location.reload()">Try again</button></main>`; });
