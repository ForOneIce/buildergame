import './style.css';
import { createTown } from './town';
import { safeUrl, repositoryKey } from './model.mjs';
import { publicBundle, configuration, cleanEvent, defaultRule, assertAppend } from './bundle.mjs';
import { sampleTown } from './sample.mjs';
import type { Bundle, TownEvent, Project } from './types';
import { projectDestination } from './links';

declare const __DEPLOYED_AT__: string;
const app = document.querySelector<HTMLDivElement>('#app')!;
let lang: 'en' | 'zh' = localStorage.getItem('bg-language') === 'zh' ? 'zh' : 'en';
const t = (en: string, zh: string) => lang === 'en' ? en : zh;
const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
let bundle = sampleTown() as Bundle;
let screen: 'welcome' | 'setup' | 'town' | 'success' = 'welcome';
let collection: 'personal' | 'hackathon' = 'personal';
let session = { configured: false, authenticated: false, login: null as string | null };
let serverAvailable = false, published = false, captureBusy = false, failures = 0;
let scene: ReturnType<typeof createTown> | undefined, timer: ReturnType<typeof setInterval> | undefined;
let snapshotIndex = bundle.history.snapshots.length - 1;
let selected = '', filter = '', title = '', repoText = '', username = '', nextPage: number | null = 1;
let repositories: Array<{repository: string; name: string; description: string; builder: Project['builder']}> = [];
const checked = new Set<string>(); let imported: TownEvent | null = null, usePrevious = false;
let weights = { ...defaultRule.weights };
let returnFocus: HTMLElement | null = null;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const date = (s: string) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(s));
const stage = (s: string | null) => ({ land:t('Open land','空地'), foundation:t('Foundation','地基'), frame:t('Timber frame','木架'), cottage:t('Cottage','小屋'), townhouse:t('Townhouse','楼房'), decorated:t('Garden house','花园屋') }[s || ''] || t('Awaiting data','等待数据'));
async function api(path: string, data?: unknown) {
  const response = await fetch(`${import.meta.env.BASE_URL}api/${path}`, { credentials: 'same-origin', cache: 'no-store', ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  let result; try { result = await response.json(); } catch { throw new Error(t('The data service is not running. Use the Node deployment for GitHub capture.','数据服务未运行。GitHub 抓取需要 Node 部署。')); }
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`); return result;
}
function notice(text: string, error = false) { const el=$('#notice');el.textContent=text;el.classList.toggle('error',error);el.hidden=false;el.onclick=()=>el.hidden=true; }
function download(value: unknown, name: string) { const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function exportTown() { download(publicBundle(bundle),'town.json');notice(t('Backup downloaded. Add town.json to public/data/ in your deployment repository, then rebuild.','备份已下载。将 town.json 放入部署仓库的 public/data/，然后重新构建。')); }
function stop() { if(timer)clearInterval(timer);timer=undefined; }
function navigate(to: typeof screen) { stop();screen=to;render(); }
function avatar(p: Project) {return p.builder.avatar ? `<img class="avatar" alt="" src="${escape(p.builder.avatar)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="avatar">${escape(p.builder.name.slice(0,2).toUpperCase())}</span>`;}
function link(url: string | undefined, text: string, css = 'button') { const safe=safeUrl(url);return safe ? `<a class="${css}" href="${escape(safe)}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`:''; }
function header() {
  return `<header><button class="brand" id="home"><span class="brand-house">⌂</span><span>buildergame<small>BUILD · SHIP · GROW</small></span></button><div class="header-actions"><span class="session-name">${session.login ? escape(session.login) : t('A little world for your work','为你的作品建一座小镇')}</span><button class="language" id="language" aria-label="${t('Switch to Chinese','切换英文')}">${lang === 'en' ? '中 / EN' : '中文 / EN'}</button>${session.authenticated ? `<button class="language" id="logout">${t('Sign out','退出登录')}</button>` : ''}</div></header>`;
}
function render() {
  scene?.dispose();scene=undefined;stop();document.documentElement.lang=lang==='en'?'en':'zh-CN';document.title=`Buildergame · ${t('Your repos, your town','你的仓库，你的小镇')}`;
  app.innerHTML=header()+`<div id="notice" class="notice" role="status" aria-live="polite" hidden></div>`+(screen==='welcome'?welcome():screen==='setup'?setup():screen==='success'?success():town())+`<input type="file" id="import" accept=".json,application/json" hidden><dialog id="detail" aria-labelledby="detail-title"><button class="close" id="close" aria-label="${t('Close','关闭')}">×</button><div id="detail-body"></div></dialog>`;
  $('#home').onclick=()=>navigate('welcome');$('#language').onclick=()=>{lang=lang==='en'?'zh':'en';localStorage.setItem('bg-language',lang);render();};
  if(session.authenticated)$('#logout').onclick=async()=>{await api('auth/logout',{});session.authenticated=false;session.login=null;render();};
  $('#close').onclick=()=>$('#detail').dispatchEvent(new Event('dismiss'));
  $('#detail').addEventListener('dismiss',()=>{$<HTMLDialogElement>('#detail').close();});
  $('#detail').addEventListener('close',()=>returnFocus?.focus());
  $<HTMLInputElement>('#import').onchange=async e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;try{if(file.size>12*1024*1024)throw Error(t('Maximum file size is 12 MB','文件最大为 12 MB'));const input=JSON.parse(await file.text());if(input.format){bundle=publicBundle(input) as Bundle;snapshotIndex=bundle.history.snapshots.length-1;published=false;usePrevious=true;imported=bundle.event;screen='town';render();notice(t('Backup restored locally. Export or sign in to capture and publish.','备份已在本地恢复。可导出，或登录后抓取并发布。'));}else{imported=cleanEvent(input) as TownEvent;collection=imported.collectionType||'hackathon';title=imported.name;repoText=imported.projects.map(p=>p.repository).join('\n');weights={...imported.rule.weights};usePrevious=false;screen='setup';render();notice(t('Configuration loaded. Ready to capture.','配置已加载，可以抓取快照。'));}}catch(error){notice((error as Error).message,true);}};
  document.querySelectorAll<HTMLElement>('[data-import]').forEach(el=>el.onclick=()=>$<HTMLInputElement>('#import').click());
  document.querySelectorAll<HTMLElement>('[data-export]').forEach(el=>el.onclick=exportTown);
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.onclick=()=>{collection=el.dataset.mode as typeof collection;imported=null;usePrevious=false;title='';navigate('setup');});
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach(el=>el.onclick=()=>navigate('town'));
  if(screen==='setup')bindSetup();if(screen==='town')bindTown();
  if(screen==='welcome'){try{const miniature=sampleTown();scene=createTown($('#island-preview'),miniature.event.projects.slice(0,4) as Project[],()=>navigate('town'));scene.update({...miniature.history.snapshots[2],projects:miniature.history.snapshots[2].projects.slice(0,4)} as Bundle['history']['snapshots'][number]);}catch{/* Text entry points remain available. */}}
}
function welcome() {
  return `<main class="landing"><section class="hero"><div class="hero-copy"><p class="eyebrow">${t('SMALL STEPS. A WORLD OF POSSIBILITIES.','每一小步，都有无限可能。')}</p><h1>${t('Good projects<br>deserve a <em>home.</em>','让好作品<br>有一个<em>家。</em>')}</h1><p class="hero-description">${t('Turn your GitHub repositories into a living 3D town. Explore the houses, meet their builders, and watch a neighborhood grow.','将 GitHub 仓库变成生动的 3D 小镇。探索房屋、认识开发者，见证整个社区的成长。')}</p><div class="hero-buttons"><button class="button primary" data-enter>${bundle.event.sampleData?t('Explore sample town','探索示例小镇'):t('Enter the town','进入小镇')} <span>↗</span></button><button class="button light" data-import>${t('Open a backup','打开备份')}</button></div><p class="hero-fine">${t('No wallet. No download. Just a little curiosity.','无需钱包，无需下载，带着好奇心来就好。')}</p></div><div class="hero-art" aria-hidden="true"><div class="art-orb"></div><div class="island-preview" id="island-preview"></div><span class="floating-note note-one">✦ ${t('Every repo has a place','每个仓库都有位置')}</span><span class="floating-note note-two">⌂ ${t('Built with little steps','由每一小步建成')}</span></div></section><section class="choose"><div class="section-head"><p class="eyebrow">${t('MAKE IT YOURS','创造属于你的小镇')}</p><h2>${t('What will your town be?','你的小镇，会是什么样？')}</h2></div><div class="mode-cards"><button class="mode-card" data-mode="personal"><span class="mode-icon">⌘</span><div><span class="tag">${t('FOR INDIVIDUAL BUILDERS','面向个人开发者')}</span><h3>${t('My builder town','我的开发者小镇')}</h3><p>${t('Connect GitHub, choose your public projects, and give your portfolio a place to grow.','连接 GitHub，选择公开仓库，让作品集在小镇中生长。')}</p></div><span class="mode-arrow">↗</span></button><button class="mode-card" data-mode="hackathon"><span class="mode-icon community">⚑</span><div><span class="tag">${t('FOR COMMUNITIES & EVENTS','面向社群与活动')}</span><h3>${t('A hackathon neighborhood','黑客松社区小镇')}</h3><p>${t('Gather projects from different builders. Keep the whole event alive beyond demo day.','汇集不同开发者的项目，让活动在演示日之后依然鲜活。')}</p></div><span class="mode-arrow">↗</span></button></div></section><footer><span>Buildergame · ${t('A home for what you build','为创造而建的小镇')}</span><span>${t('Sample metrics are fictional. Artwork translated into procedural 3D.','示例数值为虚构数据，参考图以程序化 3D 实现。')}</span></footer></main>`;
}
function setup() {
  return `<main class="setup-page"><button class="back" id="back">← ${t('Back to the islands','返回群岛')}</button><div class="setup-heading"><p class="eyebrow">${t('PLANT THE FIRST SEED','种下第一颗种子')}</p><h1>${t('Let’s build your town.','开始建造你的小镇。')}</h1><p>${t('Choose the projects. We’ll give them a place on the map.','选择项目，让它们在地图上拥有一席之地。')}</p></div><div class="setup-grid"><section class="setup-card"><div class="tabs"><button class="${collection==='personal'?'active':''}" data-mode="personal">⌘ ${t('Personal repositories','个人仓库')}</button><button class="${collection==='hackathon'?'active':''}" data-mode="hackathon">⚑ ${t('Hackathon collection','黑客松合集')}</button></div><label>${t('Town name','小镇名称')}<input id="town-name" maxlength="80" placeholder="${t('e.g. Maple’s workshop','例如：枫叶的工坊')}" value="${escape(title)}"></label>${collection==='personal'?`<div class="github-connect"><span class="github-symbol">⌘</span><div><strong>${session.authenticated?escape(session.login):t('Connect your GitHub','连接你的 GitHub')}</strong><p>${t('Public repositories only. No repository write permission.','仅公开仓库，不请求仓库写入权限。')}</p></div>${session.configured&&!session.authenticated?`<a class="button dark" href="${import.meta.env.BASE_URL}api/auth/login">${t('Sign in','登录')}</a>`:''}</div>${!session.configured?`<p class="helper">${t('OAuth is not configured on this deployment. You can try public data below. The deployer can enable login with the setup guide.','此部署尚未配置 OAuth。可在下方试用公开数据；部署者可按文档启用登录。')}</p>`:''}<div class="inline-fields"><label>${t('GitHub username','GitHub 用户名')}<input id="username" value="${escape(session.login||username)}" placeholder="octocat" ${session.authenticated?'readonly':''}></label><button class="button dark" id="load-repos">${t('Find repositories','查找仓库')}</button></div><div class="repo-toolbar"><span id="selected-count">${checked.size} ${t('selected','已选择')}</span><button class="text-button" id="select-all">${t('Select loaded','选择已加载仓库')}</button></div><div class="repo-choices" id="repo-choices">${repositoryChoices()}</div>${nextPage&&repositories.length?`<button class="button light" id="more">${t('Load more','加载更多')}</button>`:''}`:`<label>${t('Public GitHub repository URLs','公开 GitHub 仓库地址')}<textarea id="repositories" rows="8" placeholder="https://github.com/owner/project-one&#10;https://github.com/another/project-two">${escape(repoText)}</textarea></label><p class="helper">${t('One URL per line. Repositories can belong to different people or organizations.','每行一个地址，可来自不同个人或组织。')}</p><button class="button light" data-import>↑ ${t('Import configuration or backup','导入配置或备份')}</button><p class="helper">${t('Use examples/hackathon.config.json as a starting point.','可参考 examples/hackathon.config.json。')}</p>`}<details class="growth"><summary>${t('House growth settings','房屋成长设置')}</summary><p class="helper">${t('Your town, your values. Weighted counts are not a quality rating.','你的小镇，你的价值取向。加权数值不代表质量评级。')}</p><div class="weight-fields">${(['commits','stars','forks'] as const).map((key,i)=>`<label>${[t('Commits','累计提交'),t('Stars','星标'),t('Forks','分叉')][i]}<input data-weight="${key}" type="number" min="0" step="0.1" value="${weights[key]??0}"></label>`).join('')}</div>${imported?.rule.mode==='custom'?`<p class="helper">${t('Imported custom score table is retained. Editing weights switches to weighted mode.','保留导入的自定义评分表；修改权重将切换为加权模式。')}</p>`:''}</details><div class="capture-actions"><button class="button primary" id="capture">✦ ${t('Create town snapshot','建立小镇快照')}</button><button class="text-button" id="export-config">${t('Export configuration','导出配置')}</button></div><label class="publish-option"><input type="checkbox" id="publish" ${session.authenticated?'checked':'disabled'}> ${t('Publish for everyone on this deployment','发布到当前部署，供所有访客查看')}</label><p class="helper">${session.authenticated?t('This replaces the deployment’s active town. Existing history in the same town is retained.','这会更新当前部署展示的小镇。同一小镇的已有历史会保留。'):t('Sign in as the deployer to publish here, or export a backup for static hosting.','部署者登录后可发布；也可以导出备份用于静态托管。')}</p></section><aside class="setup-aside"><span class="aside-sprout">✦</span><h2>${t('Every little<br>commit counts.','每一小步<br>都留下痕迹。')}</h2><ol><li><strong>${t('Pick your projects','选择你的项目')}</strong><p>${t('A curated collection of public repositories.','精心挑选一组公开仓库。')}</p></li><li><strong>${t('Capture a moment','记录这一刻')}</strong><p>${t('Stars, forks and cumulative commit history.','星标、分叉与累计提交历史。')}</p></li><li><strong>${t('Step into your town','进入你的小镇')}</strong><p>${t('Explore, share, and come back to see what grows.','探索、分享，再回来看看新的成长。')}</p></li></ol><div class="aside-tip">${t('A pause in development never makes a house decay. Your recorded work stays.','暂停开发不会让房屋荒废。已经记录的建设成果会保留。')}</div></aside></div></main>`;
}
function repositoryChoices() {return repositories.length?repositories.map(r=>`<label class="repo-choice"><input type="checkbox" data-repo="${escape(r.repository)}" ${checked.has(r.repository)?'checked':''}><span><strong>${escape(r.name)}</strong><small>${escape(r.description)}</small></span></label>`).join(''):`<div class="empty-repos">⌘<p>${t('Your public projects will appear here.','你的公开项目将在这里显示。')}</p></div>`;}
function bindCheckboxes() {document.querySelectorAll<HTMLInputElement>('[data-repo]').forEach(e=>e.onchange=()=>{e.checked?checked.add(e.dataset.repo!):checked.delete(e.dataset.repo!);imported=null;usePrevious=false;$('#selected-count').textContent=`${checked.size} ${t('selected','已选择')}`;});}
function currentConfiguration(): TownEvent {
  const name=title.trim();if(!name)throw Error(t('Give your town a name.','请为小镇起个名字。'));
  if(imported){const result=structuredClone(imported);result.name=name;return cleanEvent(result) as TownEvent;}
  const urls=collection==='personal'?[...checked]:repoText.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  const unique=new Set(urls.map(repositoryKey));if(unique.size!==urls.length)throw Error(t('Remove duplicate repository URLs.','请删除重复仓库地址。'));
  const event=configuration({ name, collectionType:collection, repositories:urls, rule:{...defaultRule,version:`linear-${weights.commits}-${weights.stars}-${weights.forks}`,weights:{...weights}} }) as TownEvent;
  event.projects.forEach(p=>{const source=repositories.find(r=>r.repository===p.repository);if(source)p.builder=source.builder;});return event;
}
function bindSetup() {
  $('#back').onclick=()=>navigate('welcome');$<HTMLInputElement>('#town-name').oninput=e=>title=(e.target as HTMLInputElement).value;
  if(collection==='hackathon')$<HTMLTextAreaElement>('#repositories').oninput=e=>{repoText=(e.target as HTMLTextAreaElement).value;imported=null;usePrevious=false;};
  else {
    $<HTMLInputElement>('#username').oninput=e=>username=(e.target as HTMLInputElement).value;
    const fetchRepos=async(page=1)=>{const button=$<HTMLButtonElement>('#load-repos');button.disabled=true;try{const data=await api(`repos?owner=${encodeURIComponent(session.login||username)}&page=${page}`);if(page===1){repositories=[];checked.clear();imported=null;usePrevious=false;}repositories.push(...data.repositories);nextPage=data.nextPage;username=data.owner;if(!title)title=`${username}'s town`;render();}catch(error){notice((error as Error).message,true);}finally{button.disabled=false;}};
    $('#load-repos').onclick=()=>void fetchRepos();if(document.querySelector('#more'))$('#more').onclick=()=>void fetchRepos(nextPage!);
    $('#select-all').onclick=()=>{repositories.forEach(r=>checked.add(r.repository));imported=null;usePrevious=false;$('#repo-choices').innerHTML=repositoryChoices();$('#selected-count').textContent=`${checked.size} ${t('selected','已选择')}`;bindCheckboxes();};bindCheckboxes();
  }
  document.querySelectorAll<HTMLInputElement>('[data-weight]').forEach(e=>e.oninput=()=>{weights[e.dataset.weight as keyof typeof weights]=Number(e.value);if(imported)imported.rule={...defaultRule,mode:'weighted',version:`linear-${weights.commits}-${weights.stars}-${weights.forks}`,weights:{...weights}};});
  $('#export-config').onclick=()=>{try{download(currentConfiguration(),'town.config.json');}catch(e){notice((e as Error).message,true);}};
  $('#capture').onclick=async()=>{
    if(captureBusy)return;
    try {
      const event=currentConfiguration();const publish=$<HTMLInputElement>('#publish').checked;
      captureBusy=true;document.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLTextAreaElement>('button,input,textarea').forEach(e=>e.disabled=true);
      $('#capture').textContent=t('Building your snapshot…','正在建立快照…');notice(t('Reading repository metadata and full commit history counts. Large collections can take a few minutes.','正在读取仓库信息和累计提交数。大型合集可能需要几分钟。'));
      const result=await api('capture',{event,previous:usePrevious?bundle:null,publish});
      bundle=publicBundle(result.bundle) as Bundle;published=result.published;failures=result.failures.length;snapshotIndex=bundle.history.snapshots.length-1;imported=bundle.event;usePrevious=true;localStorage.setItem('bg-town-backup',JSON.stringify(publicBundle(bundle)));navigate('success');
    }catch(error){render();notice((error as Error).message,true);}finally{captureBusy=false;}
  };
}
function success() {
  return `<main class="success-page"><span class="success-icon">⌂</span><p class="eyebrow">${t('A NEW CHAPTER BEGINS','新的篇章开始了')}</p><h1>${t('Your town is ready.','你的小镇建好了。')}</h1><p>${escape(bundle.event.name)} · ${bundle.event.projects.length} ${t('projects','个项目')} · ${bundle.history.snapshots.length} ${t('snapshots','个快照')}</p><p class="success-status">${published?t('Published. Anyone visiting this deployment can explore your town without signing in.','已发布。访问当前部署的任何人都可以免登录游览。'):t('Saved in this browser. Export the backup to publish it with your static deployment.','已保存在此浏览器中。导出备份后可随静态站点部署。')}</p>${failures?`<p class="helper">${failures} ${t('repositories could not be refreshed; their last known state is retained where available.','个仓库未能刷新；有历史记录的保留上次状态。')}</p>`:''}<div class="hero-buttons"><button class="button primary" data-enter>${t('Enter my town','进入我的小镇')} ↗</button><button class="button light" data-export>↓ ${t('Export backup','导出备份')}</button></div><p class="helper">${t('Backup files contain public town data, never your GitHub token.','备份文件只包含公开小镇数据，不包含 GitHub 令牌。')}</p></main>`;
}
function town() {
  return `<main class="game"><div id="scene" class="scene"></div><div class="game-title glass"><span class="eyebrow">${bundle.event.sampleData?t('SAMPLE ISLAND · FICTIONAL DATA','示例岛屿 · 虚构数据'):bundle.event.collectionType==='personal'?t('DEVELOPER TOWN','开发者小镇'):t('HACKATHON NEIGHBORHOOD','黑客松社区')}</span><h1>${escape(bundle.event.name)}</h1><p>${t('Small steps. A growing world.','每一小步，让世界生长。')}</p></div><nav class="game-nav glass" aria-label="${t('Town controls','小镇控制')}"><button id="show-projects" class="active">▦ <span>${t('Projects','项目')}</span></button><button data-export>↓ <span>${t('Backup','备份')}</span></button><button id="manage">⚙ <span>${t('Manage','管理')}</span></button></nav><aside class="project-panel glass" id="project-panel"><div class="panel-title"><h2>${t('Meet the neighbors','认识邻居')}</h2><span>${bundle.event.projects.length}</span></div><label class="sr-only" for="search">${t('Search projects','搜索项目')}</label><input type="search" id="search" placeholder="${t('Find a project or builder…','查找项目或开发者…')}" value="${escape(filter)}"><div class="project-list" id="project-list"></div></aside><div class="camera-controls"><button id="zoom-in" aria-label="${t('Zoom in','放大')}">+</button><button id="zoom-out" aria-label="${t('Zoom out','缩小')}">−</button><button id="reset" aria-label="${t('Reset camera','重置视角')}">↺</button></div><div class="timeline glass"><div class="timeline-heading"><span>◷ ${t('TOWN TIME MACHINE','小镇时光机')}</span><span id="snapshot-date"></span></div><div class="timeline-controls"><button id="play" aria-label="${t('Play history','播放历史')}">▶</button><input id="timeline" type="range" min="0" max="${bundle.history.snapshots.length-1}" value="${snapshotIndex}" aria-label="${t('Snapshot timeline','快照时间线')}"><span id="snapshot-count"></span></div><p id="snapshot-label" role="status" aria-live="polite"></p></div><p class="scene-tip">${t('Drag to orbit · Scroll to zoom · Select a sign to meet its builder','拖动旋转 · 滚轮缩放 · 点击木牌认识开发者')}</p><span class="build-version">${t('Build','构建版本')} ${escape(__DEPLOYED_AT__.slice(0,16))} UTC</span></main>`;
}
function list() {
  const projects=bundle.event.projects.filter(p=>`${p.name} ${p.builder.name}`.toLowerCase().includes(filter.toLowerCase()));
  $('#project-list').innerHTML=projects.length?projects.map(p=>{const record=bundle.history.snapshots[snapshotIndex].projects.find(r=>r.projectId===p.id)!;return `<button class="project-card ${selected===p.id?'selected':''}" data-project="${p.id}">${avatar(p)}<span><strong>${escape(p.name)}</strong><small>${escape(p.builder.name)}</small><em>${stage(record.stage)}${record.status==='stale'?t(' · Last known',' · 上次记录'):''}</em></span><b>↗</b></button>`;}).join(''):`<p class="helper">${t('No matching neighbors.','没有找到匹配的邻居。')}</p>`;
  document.querySelectorAll<HTMLElement>('[data-project]').forEach(e=>e.onclick=()=>details(e.dataset.project!));
}
function details(id: string) {
  selected=id;scene?.focus(id);returnFocus=document.activeElement as HTMLElement;
  const p=bundle.event.projects.find(p=>p.id===id)!;const r=bundle.history.snapshots[snapshotIndex].projects.find(r=>r.projectId===id)!;
  const noSampleLinks=bundle.event.sampleData;
  $('#detail-body').innerHTML=`${avatar(p)}<p class="eyebrow">${escape(p.builder.name)}</p><h2 id="detail-title">${escape(p.name)}</h2><p>${escape(p.description)}</p><p class="helper">${escape(p.builder.bio||'')}</p><span class="stage-pill">${stage(r.stage)}</span><dl class="metrics">${(['commits','stars','forks'] as const).map((k,i)=>`<div><dt>${[t('Commits','累计提交'),t('Stars','星标'),t('Forks','分叉')][i]}</dt><dd>${r.metrics?.[k]?.toLocaleString()??'—'}</dd></div>`).join('')}</dl><p class="helper">${r.observedAt?`${t('Observed','采集于')} ${date(r.observedAt)} UTC`:t('Data unavailable','暂无数据')}${r.status==='stale'?t(' · Last known state',' · 上次记录'):''}</p>${noSampleLinks?`<p class="helper">${t('This is a fictional sample project. Create a town to visit real repositories.','这是虚构示例项目。建立小镇后即可访问真实仓库。')}</p>`:`<div class="detail-links">${link(projectDestination(p),t('Visit project','访问项目'),'button primary')}${link(p.repository,t('Star on GitHub','前往 GitHub 星标'))}${link(p.builder.url,t('Follow builder','关注开发者'))}</div>`}`;
  list();$<HTMLDialogElement>('#detail').showModal();
}
function showSnapshot(index: number) {
  const previous=bundle.history.snapshots[snapshotIndex];snapshotIndex=index;const snap=bundle.history.snapshots[index];scene?.update(snap);
  $<HTMLInputElement>('#timeline').value=String(index);$<HTMLInputElement>('#timeline').setAttribute('aria-valuetext',`${index+1} / ${bundle.history.snapshots.length}, ${date(snap.capturedAt)} UTC`);
  $('#snapshot-date').textContent=date(snap.capturedAt)+' UTC';$('#snapshot-count').textContent=`${index+1} / ${bundle.history.snapshots.length}`;
  const changes=snap.projects.filter(r=>r.stage!==previous.projects.find(p=>p.projectId===r.projectId)?.stage).length;
  const sampleLabel=lang==='zh'&&bundle.event.sampleData?['最初的地基','找到建设的节奏','邻里生机盎然'][index]:lang==='zh'?snap.label.replace(/^Snapshot (\d+)$/,'快照 $1'):snap.label;
  $('#snapshot-label').textContent=`${sampleLabel}${changes?` · ${changes} ${t('buildings changed','栋建筑发生变化')}`:''}`;list();
}
function bindTown() {
  try{scene=createTown($('#scene'),bundle.event.projects,(id,open)=>{const p=bundle.event.projects.find(p=>p.id===id)!;if(open&&!bundle.event.sampleData)window.open(projectDestination(p),'_blank','noopener,noreferrer');else details(id);});}catch{ $('#scene').innerHTML=`<div class="webgl-error">${t('3D is unavailable in this browser. Every project is still accessible in the directory.','此浏览器无法显示 3D，仍可通过项目列表访问所有项目。')}</div>`; }
  $('#reset').onclick=()=>scene?.reset();$('#zoom-in').onclick=()=>scene?.zoom(1);$('#zoom-out').onclick=()=>scene?.zoom(-1);
  const panel=$('#project-panel');const toggle=$('#show-projects');panel.hidden=matchMedia('(max-width:760px)').matches;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.setAttribute('aria-controls','project-panel');
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  document.querySelector('#scene canvas')?.setAttribute('aria-label',t('Interactive town. Use the project directory for keyboard access.','交互小镇。可通过项目列表使用键盘访问全部项目。'));
  $('#manage').onclick=()=>{if(bundle.event.sampleData){imported=null;usePrevious=false;title='';}else{imported=structuredClone(bundle.event);weights={...bundle.event.rule.weights};title=bundle.event.name;collection=bundle.event.collectionType||'hackathon';repoText=bundle.event.projects.map(p=>p.repository).join('\n');repositories=bundle.event.projects.map(p=>({repository:p.repository,name:p.name,description:p.description,builder:p.builder}));checked.clear();repositories.forEach(r=>checked.add(r.repository));nextPage=null;usePrevious=true;}navigate('setup');};
  $<HTMLInputElement>('#search').oninput=e=>{filter=(e.target as HTMLInputElement).value;list();};
  $<HTMLInputElement>('#timeline').oninput=e=>{stop();$('#play').textContent='▶';showSnapshot(Number((e.target as HTMLInputElement).value));};
  $<HTMLButtonElement>('#play').disabled=bundle.history.snapshots.length<2;
  $('#play').onclick=()=>{if(timer){stop();$('#play').textContent='▶';return;}if(snapshotIndex===bundle.history.snapshots.length-1)showSnapshot(0);$('#play').textContent='Ⅱ';timer=setInterval(()=>{showSnapshot(snapshotIndex+1);if(snapshotIndex===bundle.history.snapshots.length-1){stop();$('#play').textContent='▶';}},2200);};
  showSnapshot(snapshotIndex);
}
async function start() {
  try{session=await api('session');serverAvailable=true;const remote=await api('town');if(remote){bundle=publicBundle(remote) as Bundle;published=!bundle.event.sampleData;}}catch{try{const res=await fetch(`${import.meta.env.BASE_URL}data/town.json`,{cache:'no-cache'});bundle=publicBundle(await res.json()) as Bundle;published=!bundle.event.sampleData;}catch{/* Bundled sample remains usable without a data file. */}}
  if(!published){try{const local=localStorage.getItem('bg-town-backup');if(local)bundle=publicBundle(JSON.parse(local)) as Bundle;}catch{localStorage.removeItem('bg-town-backup');}}
  snapshotIndex=bundle.history.snapshots.length-1;
  if(new URLSearchParams(location.search).get('setup')==='personal'){screen='setup';username=session.login||'';title=username?`${username}'s town`:'';history.replaceState(null,'',location.pathname);}
  render();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
let checking=false,lastCheck=0;
setInterval(async()=>{
  if(checking||!published||screen!=='town'||document.hidden||bundle.event.mode!=='live'||Date.now()-lastCheck<bundle.event.refreshSeconds*1000)return;
  checking=true;lastCheck=Date.now();
  try{const value=serverAvailable?await api('town'):await(await fetch(`${import.meta.env.BASE_URL}data/town.json`,{cache:'no-cache'})).json();if(!value)return;const next=publicBundle(value) as Bundle;if(next.event.id!==bundle.event.id)return;assertAppend(bundle,next);if(next.history.snapshots.length>bundle.history.snapshots.length){const latest=snapshotIndex===bundle.history.snapshots.length-1;bundle=next;$<HTMLInputElement>('#timeline').max=String(next.history.snapshots.length-1);showSnapshot(latest?next.history.snapshots.length-1:snapshotIndex);notice(t('A new town snapshot is available.','小镇有了新的快照。'));}}
  catch{notice(t('Could not refresh the published town. Keeping the current snapshot.','暂时无法刷新已发布小镇，保留当前快照。'));}finally{checking=false;}
},5000);
void start();
