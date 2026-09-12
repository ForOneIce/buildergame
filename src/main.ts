import './ui/theme.css';
import './style.css';
import {objectArt,sitePlan} from './ui/planning';
import {icon} from './ui/icons';
import {builderSymbol} from './ui/builder-symbols';
import {createHomeShowcase} from './home-showcase';
import {gameHeader,gameLayout,projectCard} from './game-ui';
import {localProgress,saveProgress} from './player-progress';
import { createTown } from './town';
import { safeUrl, repositoryKey } from './model.mjs';
import { publicBundle, configuration, cleanEvent, defaultRule, assertAppend } from './bundle.mjs';
import { sampleTown } from './sample.mjs';
import type { Bundle, TownEvent, Project, Landscape } from './types';
import { projectDestination } from './links';
import './map-ui.css';

declare const __DEPLOYED_AT__: string;
const app = document.querySelector<HTMLDivElement>('#app')!;
let lang: 'en' | 'zh' = localStorage.getItem('bg-language') === 'zh' ? 'zh' : 'en';
const t = (en: string, zh: string) => lang === 'en' ? en : zh;
const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
let bundle = sampleTown() as Bundle;
let screen: 'welcome' | 'setup' | 'town' | 'success' = 'welcome';
let collection: 'personal' | 'hackathon' = 'personal';
let session = { configured: false, playerConfigured: false, authenticated: false, isDeployer: false, login: null as string | null, avatar: null as string | null };
let landscape: Landscape = 'flat';
let visited=new Set<string>(), progressStatus='local';
let progressGeneration=0, progressTask:Promise<void>|undefined;
let serverAvailable = false, published = false, captureBusy = false, failures = 0;
let scene: ReturnType<typeof createTown> | undefined, timer: ReturnType<typeof setInterval> | undefined;
let snapshotIndex = bundle.history.snapshots.length - 1;
let selected = '', filter = '', title = '', repoText = '', username = '', nextPage: number | null = 1;
let repositories: Array<{repository: string; name: string; description: string; builder: Project['builder']}> = [];
const checked = new Set<string>(); let imported: TownEvent | null = null, usePrevious = false;
let weights = { ...defaultRule.weights };
let returnFocus: HTMLElement | null = null;
let cancelArrival: (()=>void)|undefined, doorTimer: ReturnType<typeof setTimeout>|undefined;
let entryFromCard=false;
let homeShowcase:ReturnType<typeof createHomeShowcase>|undefined;
let terrainPreview:{bundle:Bundle;snapshotIndex:number;published:boolean}|null=null;
let publishDraft:boolean|undefined;
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
function navigate(to: typeof screen) { stop();if(terrainPreview&&to!=='town'){bundle=terrainPreview.bundle;snapshotIndex=terrainPreview.snapshotIndex;published=terrainPreview.published;terrainPreview=null;}screen=to;render(); }
function avatar(p: Project) {return p.builder.avatar ? `<img class="avatar" alt="" src="${escape(p.builder.avatar)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="avatar">${escape(p.builder.name.slice(0,2).toUpperCase())}</span>`;}
function link(url: string | undefined, text: string, css = 'button') { const safe=safeUrl(url);return safe ? `<a class="${css}" href="${escape(safe)}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`:''; }
function header() { return gameHeader(t,session,lang,screen==='welcome'); }

function render() {
  homeShowcase?.dispose();homeShowcase=undefined;cancelArrival?.();cancelArrival=undefined;clearTimeout(doorTimer);
  document.body.classList.remove('project-detail-open');document.body.dataset.screen=screen;document.body.classList.toggle('town-view',screen==='town');
  scene?.dispose();scene=undefined;stop();document.documentElement.lang=lang==='en'?'en':'zh-CN';document.title=`Buildergame · ${t('Your repos, your town','你的仓库，你的小镇')}`;
  app.innerHTML=header()+`<div id="notice" class="notice" role="status" aria-live="polite" hidden></div>`+(screen==='welcome'?welcome():screen==='setup'?setup():screen==='success'?success():town())+`<input type="file" id="import" accept=".json,application/json" hidden><dialog id="detail" class="paper-panel" aria-labelledby="detail-title"><button class="close hud-button icon-button" id="close" aria-label="${t('Close','关闭')}">×</button><div id="detail-body"></div></dialog><dialog id="project-entry" class="paper-panel" aria-labelledby="entry-title"><button class="close hud-button icon-button" id="close-entry" aria-label="${t('Close','关闭')}">×</button><div class="entry-door" aria-hidden="true"><span></span></div><h2 id="entry-title"></h2><p id="entry-status" role="status"></p><div id="entry-actions"></div></dialog>`;
  $('#home').onclick=()=>navigate('welcome');$('#language').onclick=()=>{lang=lang==='en'?'zh':'en';localStorage.setItem('bg-language',lang);render();};
  $('#language').setAttribute('aria-label',t('Switch to Chinese','切换英文'));
  document.querySelector('#player-login')?.setAttribute('aria-label',session.authenticated?t(`Sync exploration for ${session.login}`,`同步 ${session.login} 的探索进度`):t('Sign in with GitHub','通过 GitHub 登录'));
  if(session.authenticated)$('#logout').onclick=async()=>{await api('auth/logout',{});session.authenticated=false;session.isDeployer=false;session.login=null;session.avatar=null;render();};
  document.querySelector('#player-login')?.addEventListener('click',()=>{if(session.authenticated){void syncProgress();return;}if(session.playerConfigured){location.href=import.meta.env.BASE_URL+'api/auth/login?role=player';}else notice(t('GitHub sign-in is unavailable on this deployment. You can explore as a guest; progress is saved on this device.','此部署暂未开放 GitHub 登录。你可以作为访客探索，进度保存在当前设备。'));});
  $('#close-entry').onclick=()=>$<HTMLDialogElement>('#project-entry').close();
  $('#project-entry').addEventListener('close',()=>{clearTimeout(doorTimer);if(entryFromCard){document.body.classList.add('project-detail-open');$<HTMLDialogElement>('#detail').showModal();document.querySelector<HTMLButtonElement>('[data-visit]')?.focus();}else returnFocus?.focus();});
  $('#close').onclick=()=>$('#detail').dispatchEvent(new Event('dismiss'));
  $('#detail').addEventListener('dismiss',()=>{$<HTMLDialogElement>('#detail').close();});
  $('#detail').addEventListener('close',()=>{document.body.classList.remove('project-detail-open');if(!$<HTMLDialogElement>('#project-entry').open){const target=returnFocus?.isConnected?returnFocus:document.querySelector<HTMLElement>('#show-projects');target?.focus();}});
  $<HTMLInputElement>('#import').onchange=async e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;try{if(file.size>12*1024*1024)throw Error(t('Maximum file size is 12 MB','文件最大为 12 MB'));const input=JSON.parse(await file.text());if(input.format){bundle=publicBundle(input) as Bundle;snapshotIndex=bundle.history.snapshots.length-1;published=false;usePrevious=true;imported=bundle.event;screen='town';render();notice(t('Backup restored locally. Export or sign in to capture and publish.','备份已在本地恢复。可导出，或登录后抓取并发布。'));}else{imported=cleanEvent(input) as TownEvent;collection=imported.collectionType||'hackathon';title=imported.name;repoText=imported.projects.map(p=>p.repository).join('\n');weights={...imported.rule.weights};usePrevious=false;screen='setup';render();notice(t('Configuration loaded. Ready to capture.','配置已加载，可以抓取快照。'));}}catch(error){notice((error as Error).message,true);}};
  document.querySelectorAll<HTMLElement>('[data-import]').forEach(el=>el.onclick=()=>$<HTMLInputElement>('#import').click());
  document.querySelectorAll<HTMLElement>('[data-export]').forEach(el=>el.onclick=exportTown);
  document.querySelector('[data-create]')?.addEventListener('click',()=>{imported=null;usePrevious=false;title='';navigate('setup');});
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.onclick=()=>{collection=el.dataset.mode as typeof collection;imported=null;usePrevious=false;if(screen!=='setup')title='';navigate('setup');});
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach(el=>el.onclick=()=>navigate('town'));
  document.querySelectorAll<HTMLElement>('[data-create],[data-mode],#capture').forEach(el=>el.dataset.cursor='build');document.querySelectorAll<HTMLElement>('[data-enter],[data-sample-landscape]').forEach(el=>el.dataset.cursor='walk');
  if(screen==='setup')bindSetup();if(screen==='town')bindTown();
  if(screen==='welcome'){try{homeShowcase=createHomeShowcase($('#home-showcase'),{lang});}catch{$('#home-showcase').innerHTML='<p class="showcase-fallback">'+t('The building preview is unavailable in this browser.','此浏览器暂时无法显示建筑预览。')+'</p>';}}
}
function welcome() {
  const exploreLabel=bundle.event.sampleData?t('Explore sample town','探索示例小镇'):t('Enter the town','进入小镇');
  const createLabel=t('Create town','新建城镇');
  return `<main class="landing"><section class="hero"><div class="hero-copy paper-panel"><h1 class="hero-description">${t('A home for GitHub builders. Let’s watch each other grow.','为github builder打造的家园，让我们一起见证彼此的成长。')}</h1><div class="hero-buttons paired-actions"><button class="button object-entry hinted-control" data-enter aria-label="${exploreLabel}" aria-describedby="explore-hint">${objectArt('map')}<span class="control-hint" id="explore-hint" role="tooltip">${exploreLabel}</span></button><button class="button object-entry hinted-control" data-create aria-label="${createLabel}" aria-describedby="create-hint">${objectArt('plan')}<span class="control-hint" id="create-hint" role="tooltip">${createLabel}</span></button></div></div><div class="hero-art"><div id="home-showcase" class="home-showcase" aria-label="${t('One building growing through five construction stages','一栋建筑的五阶段成长展示')}"></div><p class="floating-note">${t('Keep building. Keep growing.','持续构建，持续成长')}</p></div></section><section class="choose"><div class="section-head"><h2>${t('Who can create a town?','谁能新建城镇？')}</h2></div><div class="builder-audiences"><article class="builder-audience"><div class="builder-symbol">${builderSymbol('personal')}</div><h3>${t('Individual builders','个人开发者')}</h3><p>${t('A home for your public projects.','为你的公开作品安一个家。')}</p></article><article class="builder-audience"><div class="builder-symbol">${builderSymbol('community')}</div><h3>${t('Communities & hackathons','社群与黑客松')}</h3><p>${t('Bring your builders’ projects together.','让活动中的开发者聚在一起。')}</p></article></div></section><footer><span>Buildergame · ${t('A home for what you build','为创造而建的小镇')}</span></footer></main>`;
}

function setup() {
  return `<main class="setup-page planning-desk"><button class="back" id="back">← ${t('Fold away','收起图纸')}</button><div class="setup-heading"><p class="eyebrow">${t('BUILDERGAME · PLANNING DRAWING','BUILDERGAME · 小镇规划图')}</p><h1>${t('Make room for what you build.','为你的创造，规划一处家园。')}</h1><p>${t('Choose the projects. We’ll give them a place on the map.','选择项目，让它们在地图上拥有一席之地。')}</p></div><div class="planning-sheet"><div class="setup-grid"><aside class="setup-drawing">${sitePlan(imported ? imported.landscape||'flat' : landscape,t)}<p>${t('Every project keeps its address as the town grows.','每个项目保留固定地址，小镇围绕它们生长。')}</p><span class="sheet-number">01 / ${t('TOWN PLAN','小镇规划')}</span></aside><section class="setup-card"><div class="tabs"><button class="button ${collection==='personal'?'active':''}" aria-pressed="${collection==='personal'}" data-mode="personal">⌘ ${t('Personal repositories','个人仓库')}</button><button class="button ${collection==='hackathon'?'active':''}" aria-pressed="${collection==='hackathon'}" data-mode="hackathon">⚑ ${t('Hackathon collection','黑客松合集')}</button></div><label>${t('Town name','小镇名称')}<input id="town-name" maxlength="80" placeholder="${t('e.g. Maple’s workshop','例如：枫叶的工坊')}" value="${escape(title)}"></label>${collection==='personal'?`<div class="github-connect"><span class="github-symbol">⌘</span><div><strong>${session.authenticated?escape(session.login):t('Connect your GitHub','连接你的 GitHub')}</strong><p>${t('Public repositories only. No repository write permission.','仅公开仓库，不请求仓库写入权限。')}</p></div>${session.configured&&!session.authenticated?`<a class="button dark" href="${import.meta.env.BASE_URL}api/auth/login">${t('Sign in','登录')}</a>`:''}</div>${!session.configured?`<p class="helper">${t('OAuth is not configured on this deployment. You can try public data below. The deployer can enable login with the setup guide.','此部署尚未配置 OAuth。可在下方试用公开数据；部署者可按文档启用登录。')}</p>`:''}<div class="inline-fields"><label>${t('GitHub username','GitHub 用户名')}<input id="username" value="${escape(session.login||username)}" placeholder="octocat" ${session.authenticated?'readonly':''}></label><button class="button dark" id="load-repos">${t('Find repositories','查找仓库')}</button></div><div class="repo-toolbar"><span id="selected-count">${checked.size} ${t('selected','已选择')}</span><button class="text-button" id="select-all">${t('Select loaded','选择已加载仓库')}</button></div><div class="repo-choices" id="repo-choices">${repositoryChoices()}</div>${nextPage&&repositories.length?`<button class="button light" id="more">${t('Load more','加载更多')}</button>`:''}`:`<label>${t('Public GitHub repository URLs','公开 GitHub 仓库地址')}<textarea id="repositories" rows="8" placeholder="https://github.com/owner/project-one&#10;https://github.com/another/project-two">${escape(repoText)}</textarea></label><p class="helper">${t('One URL per line. Repositories can belong to different people or organizations.','每行一个地址，可来自不同个人或组织。')}</p><button class="button light" data-import>↑ ${t('Import configuration or backup','导入配置或备份')}</button><p class="helper">${t('Use examples/hackathon.config.json as a starting point.','可参考 examples/hackathon.config.json。')}</p>`}<details class="growth"><summary>${t('House growth settings','房屋成长设置')}</summary><p class="helper">${t('Your town, your values. Weighted counts are not a quality rating.','你的小镇，你的价值取向。加权数值不代表质量评级。')}</p><div class="weight-fields">${(['commits','stars','forks'] as const).map((key,i)=>`<label>${[t('Commits','累计提交'),t('Stars','星标'),t('Forks','分叉')][i]}<input data-weight="${key}" type="number" min="0" step="0.1" value="${weights[key]??0}"></label>`).join('')}</div>${imported?.rule.mode==='custom'?`<p class="helper">${t('Imported custom score table is retained. Editing weights switches to weighted mode.','保留导入的自定义评分表；修改权重将切换为加权模式。')}</p>`:''}</details><div class="capture-actions paired-actions"><button class="button primary" id="capture">✦ ${t('Create town snapshot','建立小镇快照')}</button><button class="text-button" id="export-config">${t('Export configuration','导出配置')}</button></div><label class="publish-option"><input type="checkbox" id="publish" ${session.isDeployer?'checked':'disabled'}> ${t('Publish for everyone on this deployment','发布到当前部署，供所有访客查看')}</label><p class="helper">${session.isDeployer?t('This replaces the deployment’s active town. Existing history in the same town is retained.','这会更新当前部署展示的小镇。同一小镇的已有历史会保留。'):t('Sign in as the deployer to publish here, or export a backup for static hosting.','部署者登录后可发布；也可以导出备份用于静态托管。')}</p></section></div></div></main>`;
}
function repositoryChoices() {return repositories.length?repositories.map(r=>`<label class="repo-choice"><input type="checkbox" data-repo="${escape(r.repository)}" ${checked.has(r.repository)?'checked':''}><span><strong>${escape(r.name)}</strong><small>${escape(r.description)}</small></span></label>`).join(''):`<div class="empty-repos">⌘<p>${t('Your public projects will appear here.','你的公开项目将在这里显示。')}</p></div>`;}
function bindCheckboxes() {document.querySelectorAll<HTMLInputElement>('[data-repo]').forEach(e=>e.onchange=()=>{e.checked?checked.add(e.dataset.repo!):checked.delete(e.dataset.repo!);imported=null;usePrevious=false;$('#selected-count').textContent=`${checked.size} ${t('selected','已选择')}`;});}
function updateTerrainThumbnail(){
  const thumbnail=document.querySelector<HTMLImageElement>('#terrain-thumbnail');if(!thumbnail)return;
  thumbnail.src=import.meta.env.BASE_URL+'ui/landscapes/'+landscape+'.png';
  thumbnail.alt=t({flat:'Flat town preview',valley:'Valley town preview',clouds:'Cloud town preview'}[landscape],{flat:'平地城镇缩略图',valley:'山谷城镇缩略图',clouds:'云端城镇缩略图'}[landscape]);
}
function currentConfiguration(): TownEvent {
  const name=title.trim();if(!name)throw Error(t('Give your town a name.','请为小镇起个名字。'));
  if(imported){const result=structuredClone(imported);result.name=name;if(!usePrevious)result.landscape=landscape;return cleanEvent(result) as TownEvent;}
  const urls=collection==='personal'?[...checked]:repoText.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  const unique=new Set(urls.map(repositoryKey));if(unique.size!==urls.length)throw Error(t('Remove duplicate repository URLs.','请删除重复仓库地址。'));
  const event=configuration({ name, collectionType:collection, landscape, repositories:urls, rule:{...defaultRule,version:`linear-${weights.commits}-${weights.stars}-${weights.forks}`,weights:{...weights}} }) as TownEvent;
  event.projects.forEach(p=>{const source=repositories.find(r=>r.repository===p.repository);if(source)p.builder=source.builder;});return event;
}
function bindSetup() {
  landscape=imported ? imported.landscape||'flat' : landscape;
  const picker=document.createElement('div');picker.className='landscape-picker';
  picker.innerHTML='<label for="landscape">'+t('Town landscape','城镇地形')+'</label><select id="landscape" '+(usePrevious?'disabled':'')+'>'+(['flat','valley','clouds'] as Landscape[]).map((mode,i)=>'<option value="'+mode+'" '+(landscape===mode?'selected':'')+'>'+[t('Flat · concrete roads','平地 · 水泥路面'),t('Valley · slopes, gravel & water','山谷 · 缓坡、碎石与水流'),t('Clouds · floating districts & steps','云端 · 漂浮片区与云朵阶梯')][i]+'</option>').join('')+'</select><p class="helper">'+t('Chosen once for this town. Future snapshots keep the same landscape.','建镇时确定，之后的快照保持同一地形。')+'</p>';
  document.querySelector('.growth')!.before(picker);
  const landscapeChoices=document.createElement('div');landscapeChoices.className='landscape-choices';landscapeChoices.innerHTML=(['flat','valley','clouds'] as Landscape[]).map((mode,i)=>`<button type="button" class="button landscape-choice" data-landscape-choice="${mode}" aria-pressed="${landscape===mode}" ${usePrevious?'disabled':''}>${icon(['map','mountain','cloud'][i])}<span>${[t('Flat','平地'),t('Valley','山谷'),t('Clouds','云端')][i]}</span></button>`).join('');picker.append(landscapeChoices);picker.querySelector('select')!.classList.add('sr-only');picker.querySelector('select')!.tabIndex=-1;picker.querySelector('select')!.setAttribute('aria-hidden','true');landscapeChoices.setAttribute('role','group');landscapeChoices.setAttribute('aria-label',t('Town landscape','城镇地形'));
  const changeLandscape=(value:Landscape)=>{landscape=value;if(imported&&!usePrevious)imported.landscape=landscape;picker.querySelector('select')!.value=value;document.querySelector<HTMLElement>('.site-plan')!.dataset.landscape=landscape;updateTerrainThumbnail();landscapeChoices.querySelectorAll<HTMLElement>('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.landscapeChoice===value)));};
  picker.querySelector('select')!.onchange=e=>changeLandscape((e.target as HTMLSelectElement).value as Landscape);landscapeChoices.querySelectorAll<HTMLElement>('button').forEach(el=>el.onclick=()=>changeLandscape(el.dataset.landscapeChoice as Landscape));
  const samples=document.createElement('div');samples.className='sample-landscapes';samples.setAttribute('role','group');samples.setAttribute('aria-label',t('Explore example landscapes','游览示例地形'));
  samples.innerHTML=(['flat','valley','clouds'] as Landscape[]).map((mode,i)=>`<button class="button" data-cursor="walk" data-sample-landscape="${mode}">${[t('Explore flat town','游览平地城镇'),t('Explore valley','游览山谷'),t('Explore cloud town','游览云端城镇')][i]}</button>`).join('');
  document.querySelector('.setup-drawing')!.append(samples);
  samples.querySelectorAll<HTMLElement>('button').forEach(button=>button.onclick=()=>{terrainPreview={bundle,snapshotIndex,published};bundle=sampleTown() as Bundle;const mode=button.dataset.sampleLandscape as Landscape;bundle.event.landscape=mode;if(mode!=='flat'){bundle.event.id+='-'+mode;bundle.history.eventId=bundle.event.id;}published=false;snapshotIndex=bundle.history.snapshots.length-1;navigate('town');});
  updateTerrainThumbnail();
  const publishInput=$<HTMLInputElement>('#publish');
  publishInput.checked=session.isDeployer&&(publishDraft??true);
  publishInput.onchange=()=>publishDraft=publishInput.checked;
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
      captureBusy=true;document.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('button,input,textarea,select').forEach(e=>e.disabled=true);
      $('#capture').textContent=t('Building your snapshot…','正在建立快照…');notice(t('Reading repository metadata and full commit history counts. Large collections can take a few minutes.','正在读取仓库信息和累计提交数。大型合集可能需要几分钟。'));
      const result=await api('capture',{event,previous:usePrevious?bundle:null,publish});
      bundle=publicBundle(result.bundle) as Bundle;published=result.published;failures=result.failures.length;snapshotIndex=bundle.history.snapshots.length-1;imported=bundle.event;usePrevious=true;localStorage.setItem('bg-town-backup',JSON.stringify(publicBundle(bundle)));navigate('success');
    }catch(error){render();notice((error as Error).message,true);}finally{captureBusy=false;}
  };
}
function success() {
  return `<main class="success-page paper-panel"><span class="success-icon">${objectArt('map')}</span><p class="eyebrow">${t('A NEW CHAPTER BEGINS','新的篇章开始了')}</p><h1>${t('Your town is ready.','你的小镇建好了。')}</h1><p>${escape(bundle.event.name)} · ${bundle.event.projects.length} ${t('projects','个项目')} · ${bundle.history.snapshots.length} ${t('snapshots','个快照')}</p><p class="success-status">${published?t('Published. Anyone visiting this deployment can explore your town without signing in.','已发布。访问当前部署的任何人都可以免登录游览。'):t('Saved in this browser. Export the backup to publish it with your static deployment.','已保存在此浏览器中。导出备份后可随静态站点部署。')}</p>${failures?`<p class="helper">${failures} ${t('repositories could not be refreshed; their last known state is retained where available.','个仓库未能刷新；有历史记录的保留上次状态。')}</p>`:''}<div class="hero-buttons"><button class="button object-entry" data-enter>${objectArt('map')}<span class="entry-label">${t('Enter my town','进入我的小镇')}</span></button><button class="button light" data-export>↓ ${t('Export backup','导出备份')}</button></div><p class="helper">${t('Backup files contain public town data, never your GitHub token.','备份文件只包含公开小镇数据，不包含 GitHub 令牌。')}</p></main>`;
}
function town() {return gameLayout(bundle,snapshotIndex,filter,t);}
function mountMapArrival() {
  const host=document.querySelector<HTMLElement>('#scene');if(!host?.querySelector('canvas'))return;
  const overlay=document.createElement('section');overlay.id='map-transition';overlay.className='map-transition';
  overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
  overlay.innerHTML=objectArt('map')+`<p>${t('Unfolding the map…','正在展开地图…')}</p><div class="map-transition-actions"><button class="button" data-arrival-continue>${t('Explore while loading','边加载边探索')}</button><button class="button" data-arrival-back>${t('Back to entrance','返回入口')}</button></div>`;
  app.append(overlay);host.setAttribute('aria-busy','true');
  const behind=Array.from(app.children).filter(el=>el!==overlay&&el instanceof HTMLElement) as HTMLElement[];
  const oldInert=behind.map(el=>el.inert);behind.forEach(el=>el.inert=true);
  const continueButton=overlay.querySelector<HTMLButtonElement>('[data-arrival-continue]')!;continueButton.focus();
  const restore=()=>behind.forEach((el,i)=>el.inert=oldInert[i]);
  const began=performance.now(),minimum=matchMedia('(prefers-reduced-motion: reduce)').matches?0:620;
  let delay:ReturnType<typeof setTimeout>|undefined;
  const finish=()=>{clearTimeout(delay);observer.disconnect();restore();const hadFocus=overlay.contains(document.activeElement);overlay.hidden=true;host.removeAttribute('aria-busy');if(hadFocus)document.querySelector<HTMLButtonElement>('#map-home')?.focus();};
  const check=()=>{if(host.dataset.townReady==='true'||host.dataset.townReady==='error'){clearTimeout(delay);delay=setTimeout(finish,Math.max(0,minimum-(performance.now()-began)));}};
  const observer=new MutationObserver(check);observer.observe(host,{attributes:true,attributeFilter:['data-town-ready']});check();
  overlay.querySelector('[data-arrival-continue]')!.addEventListener('click',finish);
  overlay.querySelector('[data-arrival-back]')!.addEventListener('click',()=>navigate('welcome'));
  cancelArrival=()=>{clearTimeout(delay);observer.disconnect();restore();overlay.remove();};
}
function openProjectEntry(p:Project) {
  clearTimeout(doorTimer);entryFromCard=$<HTMLDialogElement>('#detail').open;
  if(entryFromCard)$<HTMLDialogElement>('#detail').close();else returnFocus=document.activeElement as HTMLElement;
  selected=p.id;scene?.focus(p.id);markVisited(p.id);
  const dialog=$<HTMLDialogElement>('#project-entry');dialog.classList.remove('is-opening');
  $('#entry-title').textContent=p.name;$('#entry-status').textContent=t('Opening the door…','正在开门…');$('#entry-actions').innerHTML='';
  dialog.showModal();void dialog.offsetWidth;dialog.classList.add('is-opening');
  const finish=()=>{if(!dialog.open)return;$('#entry-status').textContent=bundle.event.sampleData?t('This home belongs to a fictional sample project.','这是虚构示例项目的房屋。'):t('Welcome! The project opens in a new tab.','欢迎！项目将在新标签页中打开。');$('#entry-actions').innerHTML=bundle.event.sampleData?`<button class="button" disabled>${t('Visit project','访问项目')}</button>`:link(projectDestination(p),t('Visit project','访问项目'),'button');};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else doorTimer=setTimeout(finish,550);
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
  const body=r.status==='stale'?'<p class="helper">'+t('Showing the last available snapshot.','展示最近一次可用快照。')+'</p>':!r.metrics?'<p class="helper">'+t('Repository data unavailable.','仓库数据暂不可用。')+'</p>':'';
  const links=`<button class="button" data-visit ${noSampleLinks?'disabled':''}>${t('Visit project','访问项目')}</button>${noSampleLinks?`<p class="helper">${t('Fictional sample project','虚构示例项目')}</p>`:''}`;
  $('#detail-body').innerHTML=projectCard(p,body,links,'',t);
  document.querySelector('[data-visit]')?.addEventListener('click',()=>openProjectEntry(p));
  markVisited(id);
  list();if(matchMedia('(max-width: 760px)').matches){$('#project-panel').hidden=true;$('#show-projects').setAttribute('aria-expanded','false');returnFocus=$('#show-projects');}else if(returnFocus?.dataset.project)returnFocus=document.querySelector<HTMLElement>('[data-project="'+id+'"]');document.body.classList.add('project-detail-open');$<HTMLDialogElement>('#detail').showModal();
}
function showSnapshot(index: number) {
  const previous=bundle.history.snapshots[snapshotIndex];snapshotIndex=index;const snap=bundle.history.snapshots[index];scene?.update(snap);
  $<HTMLInputElement>('#timeline').value=String(index);$<HTMLInputElement>('#timeline').setAttribute('aria-valuetext',`${index+1} / ${bundle.history.snapshots.length}, ${date(snap.capturedAt)} UTC`);
  $('#snapshot-date').textContent=date(snap.capturedAt)+' UTC';$('#snapshot-count').textContent=`${index+1} / ${bundle.history.snapshots.length}`;
  const changes=snap.projects.filter(r=>r.stage!==previous.projects.find(p=>p.projectId===r.projectId)?.stage).length;
  const sampleLabel=lang==='zh'&&bundle.event.sampleData?['最初的地基','找到建设的节奏','邻里生机盎然'][index]:lang==='zh'?snap.label.replace(/^Snapshot (\d+)$/,'快照 $1'):snap.label;
  refreshProgress();$('#snapshot-label').textContent=`${sampleLabel}${changes?` · ${changes} ${t('buildings changed','栋建筑发生变化')}`:''}`;list();
}
function bindTown() {
  try{scene=createTown($('#scene'),bundle.event.projects,(id,open)=>{const p=bundle.event.projects.find(p=>p.id===id)!;if(open){openProjectEntry(p);}else details(id);},bundle.event.landscape||'flat');}catch{ $('#scene').innerHTML=`<div class="webgl-error">${t('3D is unavailable in this browser. Every project is still accessible in the directory.','此浏览器无法显示 3D，仍可通过项目列表访问所有项目。')}</div>`; }
  $('#reset').onclick=()=>scene?.reset();$('#zoom-in').onclick=()=>scene?.zoom(1);$('#zoom-out').onclick=()=>scene?.zoom(-1);
  progressGeneration++;progressTask=undefined;
  visited=localProgress(bundle.event.id,session.login);progressStatus='local';
  $('#map-home').onclick=()=>scene?.reset();
  document.querySelectorAll<HTMLElement>('.map-nav button').forEach(button=>button.setAttribute('aria-label',button.querySelector('span')!.textContent!));
  $('#close-projects').onclick=()=>{$('#project-panel').hidden=true;$('#show-projects').setAttribute('aria-expanded','false');};
  const questStack=$('.quest-stack'),explorationToggle=$('#show-exploration');questStack.id='exploration-panel';
  questStack.hidden=matchMedia('(max-width: 760px)').matches;explorationToggle.setAttribute('aria-controls',questStack.id);explorationToggle.setAttribute('aria-expanded',String(!questStack.hidden));
  explorationToggle.onclick=()=>{questStack.hidden=!questStack.hidden;explorationToggle.setAttribute('aria-expanded',String(!questStack.hidden));if(!questStack.hidden)$('#next-project').focus();};
  $('#next-project').onclick=()=>{const next=bundle.event.projects.find(p=>!visited.has(p.id))||bundle.event.projects[0];if(next)details(next.id);};
  $('#minimap').onclick=e=>{if(!scene)return;const b=(e.currentTarget as HTMLCanvasElement).getBoundingClientRect();const x=(e.clientX-b.left)/b.width*240,z=(e.clientY-b.top)/b.height*240;const points=minimapPoints();const nearest=points.sort((a,b)=>(a.x-x)**2+(a.z-z)**2-((b.x-x)**2+(b.z-z)**2))[0];if(nearest && Math.hypot(nearest.x-x,nearest.z-z)<26)details(nearest.id);};
  const panel=$('#project-panel');const toggle=$('#show-projects');panel.hidden=true;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.setAttribute('aria-controls','project-panel');
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  document.querySelector('#scene canvas')?.setAttribute('aria-label',t('Interactive town. Use the project directory for keyboard access.','交互小镇。可通过项目列表使用键盘访问全部项目。'));
  $('#manage').onclick=()=>{if(bundle.event.sampleData){imported=null;usePrevious=false;title='';}else{imported=structuredClone(bundle.event);weights={...bundle.event.rule.weights};title=bundle.event.name;collection=bundle.event.collectionType||'hackathon';repoText=bundle.event.projects.map(p=>p.repository).join('\n');repositories=bundle.event.projects.map(p=>({repository:p.repository,name:p.name,description:p.description,builder:p.builder}));checked.clear();repositories.forEach(r=>checked.add(r.repository));nextPage=null;usePrevious=true;}navigate('setup');};
  if(terrainPreview){const back=document.createElement('button');back.id='return-to-plan';back.className='hud-button';back.innerHTML=icon('plan')+'<span>'+t('Back to plan','返回规划图')+'</span>';back.setAttribute('aria-label',t('Back to plan','返回规划图'));back.onclick=()=>navigate('setup');$('#manage').before(back);$('#manage').hidden=true;}
  $<HTMLInputElement>('#search').oninput=e=>{filter=(e.target as HTMLInputElement).value;list();};
  $<HTMLInputElement>('#timeline').oninput=e=>{stop();$('#play').textContent='▶';showSnapshot(Number((e.target as HTMLInputElement).value));};
  $<HTMLButtonElement>('#play').disabled=bundle.history.snapshots.length<2;
  $('#play').onclick=()=>{if(timer){stop();$('#play').textContent='▶';return;}if(snapshotIndex===bundle.history.snapshots.length-1)showSnapshot(0);$('#play').textContent='Ⅱ';timer=setInterval(()=>{showSnapshot(snapshotIndex+1);if(snapshotIndex===bundle.history.snapshots.length-1){stop();$('#play').textContent='▶';}},2200);};
  showSnapshot(snapshotIndex);refreshProgress();void syncProgress();mountMapArrival();
}

function minimapPoints(){
  const points=scene?.mapPoints||[];if(!points.length)return [];
  const xs=points.map(p=>p.x),zs=points.map(p=>p.z),minX=Math.min(...xs),minZ=Math.min(...zs),width=Math.max(...xs)-minX,depth=Math.max(...zs)-minZ,scale=155/Math.max(width,depth,16);
  return points.map(p=>({id:p.id,x:120+(p.x-minX-width/2)*scale,z:120+(p.z-minZ-depth/2)*scale}));
}
function refreshProgress(){
  if(screen!=='town')return;
  const count=bundle.event.projects.filter(p=>visited.has(p.id)).length,total=bundle.event.projects.length;
  $('#visited-count').textContent=count+' / '+total;$('#explorer-count').textContent=count+' / '+total+' '+t('projects discovered','个项目已探索');
  for(const id of ['visited-bar','explorer-bar'])$<HTMLProgressElement>('#'+id).value=count;
  $('#progress-status').textContent=progressStatus==='synced'?t('Synced to your GitHub player profile','已同步到 GitHub 玩家档案'):progressStatus==='memory'?t('This session only · storage unavailable','仅本次会话 · 存储不可用'):t('Saved on this device','保存在当前设备');
  if(session.avatar)$('#explorer-avatar').innerHTML='<img alt="" src="'+escape(session.avatar)+'" referrerpolicy="no-referrer">';
  const records=bundle.history.snapshots[snapshotIndex].projects;
  $('#town-stats').innerHTML=(['stars','forks'] as const).map((key,i)=>'<span class="stat-token hud-glass"><b>'+['★','⑂'][i]+'</b> '+records.reduce((sum,r)=>sum+(r.metrics?.[key]||0),0).toLocaleString()+'</span>').join('')+'<span class="stat-token hud-glass">⌂ '+total+'</span>';
  const canvas=$<HTMLCanvasElement>('#minimap'),ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,240,240);ctx.fillStyle=bundle.event.landscape==='clouds'?'#c1dff2':'#85ad8d';ctx.beginPath();ctx.arc(120,120,112,0,Math.PI*2);ctx.fill();
  const points=minimapPoints();for(const p of points){ctx.fillStyle=visited.has(p.id)?'#f5d783':'#f1f2dc';ctx.fillRect(p.x-7,p.z-7,14,14);if(selected===p.id){ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.strokeRect(p.x-11,p.z-11,22,22);}}
}
function markVisited(id:string){
  visited.add(id);progressStatus=saveProgress(bundle.event.id,session.login,visited)?'local':'memory';refreshProgress();
  void syncProgress();
}
function syncProgress():Promise<void>|undefined{
  if(!session.authenticated)return;
  if(progressTask)return progressTask;
  const townId=bundle.event.id,login=session.login,generation=progressGeneration;
  const current=()=>generation===progressGeneration&&screen==='town'&&bundle.event.id===townId&&session.login===login;
  const valid=new Set(bundle.event.projects.map(p=>p.id));
  // One queue per view; include visits made while a request is in flight. 同步期间的新访问也入队。
  progressTask=(async()=>{
    try{
      const result=await api('progress?town='+encodeURIComponent(townId));if(!current())return;
      const remote=new Set<string>(result.visited.filter((id:string)=>valid.has(id)));
      remote.forEach(id=>visited.add(id));saveProgress(townId,login,visited);refreshProgress();
      while(current()){
        const next=[...visited].find(id=>valid.has(id)&&!remote.has(id));if(!next)break;
        const updated=await api('progress',{townId,projectId:next});if(!current())return;
        remote.add(next);updated.visited.filter((id:string)=>valid.has(id)).forEach((id:string)=>{remote.add(id);visited.add(id);});
        saveProgress(townId,login,visited);
      }
      if(current()){progressStatus='synced';refreshProgress();}
    }catch{/* Local progress remains available; the next visit or profile click retries. */}
    finally{if(generation===progressGeneration)progressTask=undefined;}
  })();
  return progressTask;
}
async function start() {
  try{session=await api('session');serverAvailable=true;const remote=await api('town');if(remote){bundle=publicBundle(remote) as Bundle;published=!bundle.event.sampleData;}}catch{try{const res=await fetch(`${import.meta.env.BASE_URL}data/town.json`,{cache:'no-cache'});bundle=publicBundle(await res.json()) as Bundle;published=!bundle.event.sampleData;}catch{/* Bundled sample remains usable without a data file. */}}
  if(!published){try{const local=localStorage.getItem('bg-town-backup');if(local)bundle=publicBundle(JSON.parse(local)) as Bundle;}catch{localStorage.removeItem('bg-town-backup');}}
  snapshotIndex=bundle.history.snapshots.length-1;
  if(new URLSearchParams(location.search).get('town')==='1'){screen='town';history.replaceState(null,'',location.pathname);}
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
