import './ui/theme.css';
import './style.css';
import './flow.css';
import {objectArt,sitePlan} from './ui/planning';
import {icon} from './ui/icons';
import {createInterfaceAudio} from './ui/interface-audio';
import {createPlannerMusic} from './ui/planner-music';
import {builderSymbol} from './ui/builder-symbols';
import {createHomeShowcase} from './home-showcase';
import {gameHeader,gameLayout,projectCard} from './game-ui';
import {localProgress,saveProgress} from './player-progress';
import { createTown } from './town';
import { mountMailboxUI } from './mailbox-ui';
import { safeUrl, repositoryKey, baselineSnapshot } from './model.mjs';
import { publicBundle, configuration, cleanEvent, defaultRule, assertAppend } from './bundle.mjs';
import { siteBase, siteUrl, townUrl, previewUrl, requestedTown } from './site-paths';
import { connectToken, listRepositories, captureTown } from './browser-github.mjs';
import { sampleTown } from './sample.mjs';
import { planningDraft } from './planning-draft.mjs';
import { cleanSupport, hasSupport, recipientForProject, SUPPORT_CHAIN_ID } from './support-config.mjs';
import type { mountSupportPanel } from './support/panel';
import { createTownInteractionLock } from './support/town-lock';
import { bindSupportSetupHelp } from './support/setup-help';
import type { Bundle, TownEvent, Project, Landscape, Snapshot } from './types';
import { projectDestination } from './links';
import './map-ui.css';
import './mailbox-ui.css';
import './ui/audio-control.css';

declare const __DEPLOYED_AT__: string;
const app = document.querySelector<HTMLDivElement>('#app')!;
const supportInteractionLock = createTownInteractionLock(app);
let deferredSupportNavigation = false;
const interfaceAudio = createInterfaceAudio(app);
const plannerMusic = createPlannerMusic(app, interfaceAudio.enabled);
const audioControls = {
  get enabled() { return interfaceAudio.enabled; },
  get available() { return interfaceAudio.available || plannerMusic.available; },
};
const localRead=(key:string)=>{try{return localStorage.getItem(key);}catch{return null;}};
const localWrite=(key:string,value:string)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
let lang: 'en' | 'zh' = localRead('bg-language') === 'zh' ? 'zh' : 'en';
const t = (en: string, zh: string) => lang === 'en' ? en : zh;
const escape = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]!);
let bundle = sampleTown() as Bundle;
let screen: 'welcome' | 'setup' | 'town' | 'success' = 'welcome';
let collection: 'personal' | 'hackathon' = 'personal';
let session = { configured: false, playerConfigured: false, authenticated: false, isDeployer: false, login: null as string | null, avatar: null as string | null };
let githubToken=''; // Memory only; never serialize into a town, draft, or storage.
let sessionSource:'guest'|'server'|'token'='guest';
const canPublishHere=()=>session.authenticated&&sessionSource==='server';
let landscape: Landscape = 'flat';
let visited=new Set<string>(), progressStatus='local';
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
let mailboxUI:ReturnType<typeof mountMailboxUI>|undefined;
let supportPanel:ReturnType<typeof mountSupportPanel>|undefined;
let supportPanelLoading:Promise<void>|undefined, supportGeneration=0;
let supportRecipient='', supportRecipientsText='';
let creatorWalletAcknowledged=false;
const paidCoinAnimations=new Set<string>();
let planTurn:'forward'|'backward'|undefined;
let publishDraft:boolean|undefined;
let snapshotLabel='';
let reposRequest:AbortController|undefined,reposGeneration=0;
let startupError='';
let townDirectory:Array<{slug:string;name:string;townId:string}>=[];
function timelineSnapshots():Snapshot[]{
  const snapshots=bundle.history.snapshots;
  if(bundle.event.sampleData||snapshots[0]?.kind==='baseline')return snapshots;
  return [baselineSnapshot(bundle.event,new Date(new Date(snapshots[0].capturedAt).getTime()-1).toISOString()) as Snapshot,...snapshots];
}
function rememberTown(){
  const data=JSON.stringify(publicBundle(bundle));
  const saved=localWrite('bg-town-backup',data);
  if(bundle.event.deployment)localWrite('bg-town:'+bundle.event.deployment.slug,data);
  return saved;
}
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const date = (s: string) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(s));
const stage = (s: string | null) => ({ land:t('Open land','空地'), foundation:t('Foundation','地基'), frame:t('Timber frame','木架'), cottage:t('Cottage','小屋'), townhouse:t('Townhouse','楼房'), decorated:t('Garden house','花园屋') }[s || ''] || t('Awaiting data','等待数据'));
async function api(path: string, data?: unknown, signal?:AbortSignal) {
  const response = await fetch(siteUrl(`api/${path}`), { signal, credentials: 'same-origin', cache: 'no-store', ...(data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  let result; try { result = await response.json(); } catch { throw new Error(t('The site data service is unavailable. Retry, or connect a GitHub token to capture in this browser.','站点数据服务暂不可用。请重试，或连接 GitHub Token 在浏览器内抓取。')); }
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`); return result;
}
function notice(text: string, error = false) { const el=$('#notice');el.textContent=text;el.classList.toggle('error',error);el.hidden=false;el.onclick=()=>el.hidden=true; }
function download(value: unknown, name: string) { const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function exportTown() { const slug=bundle.event.deployment?.slug;download(publicBundle(bundle),slug?`${slug}.json`:'town.json');notice(slug?t(`Backup downloaded. Add ${slug}.json to public/data/towns/ in your GitHub deployment repository.`,`备份已下载。将 ${slug}.json 添加到 GitHub 部署仓库的 public/data/towns/。`):t('Backup downloaded. Add town.json to public/data/ in your deployment repository, then rebuild.','备份已下载。将 town.json 放入部署仓库的 public/data/，然后重新构建。')); }
function stop() { if(timer)clearInterval(timer);timer=undefined; }
function navigate(to: typeof screen) {
  if(supportInteractionLock.locked)return;
  startGeneration++;
  stop();screen=to;
  const target=to==='town'&&bundle.event.deployment?(published?townUrl:previewUrl)(bundle.event.deployment.slug):siteUrl();
  if(location.href!==target)history.pushState(null,'',target);
  render();
}
function avatar(p: Project) {return p.builder.avatar ? `<img class="avatar" alt="" src="${escape(p.builder.avatar)}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="avatar">${escape(p.builder.name.slice(0,2).toUpperCase())}</span>`;}
function link(url: string | undefined, text: string, css = 'button') { const safe=safeUrl(url);return safe ? `<a class="${css}" href="${escape(safe)}" target="_blank" rel="noopener noreferrer">${text} ↗</a>`:''; }
function header() { return gameHeader(t,session,lang,true,false,audioControls,screen==='town'&&hasSupport(bundle.event)); }
async function openBuilderSupport(project?:Project) {
  if(screen!=='town'||!hasSupport(bundle.event)||project&&!recipientForProject(bundle.event,project))return;
  stop();document.querySelector('#play')?.replaceChildren();const play=document.querySelector('#play');if(play)play.innerHTML=icon('play');
  if(supportPanel){supportPanel.open(project);return;}
  if(supportPanelLoading)return;
  const generation=supportGeneration,event=bundle.event;
  const button=document.querySelector<HTMLButtonElement>('#town-wallet');if(button)button.setAttribute('aria-busy','true');
  supportPanelLoading=(async()=>{
    try {
      const {mountSupportPanel}=await import('./support/panel');
      if(generation!==supportGeneration||screen!=='town'||bundle.event!==event)return;
      supportPanel=mountSupportPanel(app,{event,t,onLockChange:(locked)=>{
        if(generation!==supportGeneration)return;
        supportInteractionLock.set(locked);
        if(locked)stop();
        else if(deferredSupportNavigation){deferredSupportNavigation=false;queueMicrotask(()=>{if(!supportInteractionLock.locked)void start();});}
      },onConfirmed:(id)=>{
        if(generation!==supportGeneration||screen!=='town'||bundle.event!==event)return;
        // A chain receipt authorizes the visual celebration, never the reverse.
        paidCoinAnimations.add(id);
        if(!scene?.tossCoin(id))paidCoinAnimations.delete(id);
        void interfaceAudio.play('success');
      }});
      supportPanel.open(project);
    }catch(error){if(generation===supportGeneration)notice(t('Wallet panel could not load. Your town is still available. Please try again.','钱包面板加载失败，小镇仍可正常游览，请重试。'),true);}
    finally{if(generation===supportGeneration){supportPanelLoading=undefined;button?.removeAttribute('aria-busy');}}
  })();
  await supportPanelLoading;
}
function connectGitHub(){
  const dialog=$<HTMLDialogElement>('#github-connect-dialog');
  const request=new AbortController();dialog.onclose=()=>request.abort();
  dialog.innerHTML='<form id="github-token-form"><div class="panel-title"><h2>'+t('Connect GitHub','连接 GitHub')+'</h2><button type="button" class="button icon-button" id="close-github" aria-label="'+t('Close','关闭')+'">×</button></div><p>'+t('Use a personal access token to load your public repositories directly from GitHub.','使用个人访问令牌，直接从 GitHub 读取你的公开仓库。')+'</p><label>'+t('GitHub token','GitHub 令牌')+'<input id="github-token" type="password" autocomplete="off" spellcheck="false" required></label><p class="helper">'+t('Keep read access limited to the repositories you want to use. The token stays in this tab’s memory and is cleared when you reload or disconnect.','请仅授予所需仓库的读取权限。令牌只保留在此标签页内存中，刷新或断开连接即清除。')+'</p><p id="github-token-error" class="helper" role="alert"></p><button id="connect-token" class="button primary" type="submit">'+t('Connect','连接')+'</button></form><p><a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer">'+t('Create a fine-grained token on GitHub','在 GitHub 创建精细权限令牌')+'</a></p>'+
    ((session.playerConfigured||session.configured)?'<a class="text-button" href="'+escape(siteUrl('api/auth/login?role=player&returnTo='+encodeURIComponent('/?setup=personal')))+'">'+t('Or use this site’s GitHub OAuth login','或使用此站点的 GitHub OAuth 登录')+'</a>':'');
  $('#close-github').onclick=()=>dialog.close();dialog.showModal();
  $('#github-token-form').onsubmit=async event=>{
    event.preventDefault();const input=$<HTMLInputElement>('#github-token'),button=$<HTMLButtonElement>('#connect-token');const candidate=input.value.trim();button.disabled=true;$('#github-token-error').textContent='';
    try{const profile=await connectToken(candidate,{signal:request.signal});if(!dialog.open||!dialog.isConnected)return;githubToken=candidate;session={...session,authenticated:true,isDeployer:false,login:profile.login,avatar:profile.avatar};sessionSource='token';input.value='';dialog.close();if(screen!=='setup'){collection='personal';imported=null;usePrevious=false;title='';supportRecipient='';supportRecipientsText='';}navigate('setup');}
    catch(error){if(dialog.open&&dialog.isConnected)$('#github-token-error').textContent=(error as Error).message;}
    finally{button.disabled=false;}
  };
}

function render() {
  if(supportInteractionLock.locked)return;
  plannerMusic.setActive(screen === 'setup');
  reposRequest?.abort();reposRequest=undefined;reposGeneration++;
  mailboxUI?.dispose();mailboxUI=undefined;
  supportGeneration++;supportPanel?.dispose();supportPanel=undefined;supportPanelLoading=undefined;paidCoinAnimations.clear();
  homeShowcase?.dispose();homeShowcase=undefined;cancelArrival?.();cancelArrival=undefined;clearTimeout(doorTimer);
  document.body.classList.remove('project-detail-open');document.body.dataset.screen=screen;document.body.classList.toggle('town-view',screen==='town');
  scene?.dispose();scene=undefined;stop();document.documentElement.lang=lang==='en'?'en':'zh-CN';document.title=`Buildergame · ${t('Your repos, your town','你的仓库，你的小镇')}`;
  app.innerHTML=header()+`<div id="notice" class="notice" role="status" aria-live="polite" hidden></div>`+(screen==='welcome'?welcome():screen==='setup'?setup():screen==='success'?success():town())+`<input type="file" id="import" accept=".json,application/json" hidden><dialog id="detail" class="paper-panel" aria-labelledby="detail-title"><button class="close hud-button icon-button" id="close" aria-label="${t('Close','关闭')}">×</button><div id="detail-body"></div></dialog><dialog id="project-entry" class="paper-panel" aria-labelledby="entry-title"><button class="close hud-button icon-button" id="close-entry" aria-label="${t('Close','关闭')}">×</button><div class="entry-door" aria-hidden="true"><span></span></div><h2 id="entry-title"></h2><p id="entry-status" role="status"></p><div id="entry-actions"></div></dialog>`;
  app.insertAdjacentHTML('beforeend','<dialog id="github-connect-dialog" class="paper-panel" aria-label="'+t('Connect GitHub','连接 GitHub')+'"></dialog>');
  $('#home').onclick=()=>navigate('welcome');
  document.querySelector('#town-wallet')?.addEventListener('click',()=>void openBuilderSupport());
  document.querySelector<HTMLButtonElement>('#sound-toggle')?.addEventListener('click',event=>{
    interfaceAudio.toggle(event);
    plannerMusic.setEnabled(interfaceAudio.enabled);
    const button=$('#sound-toggle'),label=interfaceAudio.enabled?t('Mute audio','关闭声音'):t('Enable audio','开启声音');
    button.setAttribute('aria-pressed',String(interfaceAudio.enabled));button.setAttribute('aria-label',label);
    button.innerHTML=icon(interfaceAudio.enabled?'sound':'sound-off')+'<span class="control-hint" id="sound-hint" role="tooltip">'+label+'</span>';
  });
  const languageButton=document.querySelector<HTMLButtonElement>('#language');
  if(languageButton){languageButton.onclick=()=>{lang=lang==='en'?'zh':'en';localWrite('bg-language',lang);render();};languageButton.setAttribute('aria-label',t('Switch to Chinese','切换英文'));}
  document.querySelector('#player-login')?.setAttribute('aria-label',session.authenticated?t(`GitHub account: ${session.login}`,`GitHub 账号：${session.login}`):t('Sign in with GitHub','通过 GitHub 登录'));
  document.querySelector('#logout')?.addEventListener('click',async()=>{if(sessionSource==='server'){try{await api('auth/logout',{});}catch(error){notice((error as Error).message,true);return;}}githubToken='';sessionSource='guest';session.authenticated=false;session.isDeployer=false;session.login=null;session.avatar=null;repositories=[];checked.clear();render();});
  document.querySelector('#player-login')?.addEventListener('click',()=>{
    if(session.authenticated){if(screen!=='setup'){collection='personal';imported=null;usePrevious=false;title='';supportRecipient='';supportRecipientsText='';navigate('setup');}return;}
    connectGitHub();
  });
  $('#close-entry').onclick=()=>$<HTMLDialogElement>('#project-entry').close();
  $('#project-entry').addEventListener('close',()=>{clearTimeout(doorTimer);if(entryFromCard){document.body.classList.add('project-detail-open');$<HTMLDialogElement>('#detail').showModal();document.querySelector<HTMLButtonElement>('[data-visit]')?.focus();}else returnFocus?.focus();});
  $('#close').onclick=()=>$('#detail').dispatchEvent(new Event('dismiss'));
  $('#detail').addEventListener('dismiss',()=>{$<HTMLDialogElement>('#detail').close();});
  $('#detail').addEventListener('close',()=>{document.body.classList.remove('project-detail-open');if(!$<HTMLDialogElement>('#project-entry').open){const target=returnFocus?.isConnected?returnFocus:document.querySelector<HTMLElement>('#show-projects');target?.focus();}});
  $<HTMLInputElement>('#import').onchange=async e=>{
    const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;
    try {
      if(file.size>12*1024*1024)throw Error(t('Maximum file size is 12 MB','文件最大为 12 MB'));
      const input=JSON.parse(await file.text());
      if(input.kind==='buildergame-plan/v1'){
        loadPlanningDraft(input);navigate('setup');notice(t('Plan restored. Continue where you left off.','图纸草稿已恢复，可以继续填写。'));
      } else if(input.format){
        bundle=publicBundle(input) as Bundle;snapshotIndex=timelineSnapshots().length-1;published=false;usePrevious=true;imported=bundle.event;rememberTown();navigate('town');notice(t('Backup restored in this browser. Publish it to share its address.','备份已在此浏览器恢复。发布后才能通过地址分享。'));
      } else {
        loadConfiguration(input);navigate('setup');notice(t('Configuration loaded. Ready to capture.','配置已加载，可以抓取快照。'));
      }
    }catch(error){notice((error as Error).message,true);}
  };
  document.querySelectorAll<HTMLElement>('[data-import]').forEach(el=>el.onclick=()=>$<HTMLInputElement>('#import').click());
  document.querySelectorAll<HTMLElement>('[data-connect-github]').forEach(el=>el.onclick=connectGitHub);
  document.querySelectorAll<HTMLElement>('[data-export]').forEach(el=>el.onclick=exportTown);
  document.querySelector('[data-create]')?.addEventListener('click',()=>{imported=null;usePrevious=false;title='';supportRecipient='';supportRecipientsText='';navigate('setup');});
  document.querySelectorAll<HTMLElement>('[data-mode]').forEach(el=>el.onclick=()=>{
    const next=el.dataset.mode as typeof collection;if(next===collection)return;
    const scroll=window.scrollY;planTurn=next==='hackathon'?'forward':'backward';
    collection=next;imported=null;usePrevious=false;navigate('setup');
    document.querySelector<HTMLElement>(`[data-mode="${next}"]`)?.focus({preventScroll:true});window.scrollTo(0,scroll);
  });
  document.querySelectorAll<HTMLElement>('[data-enter]').forEach(el=>el.onclick=()=>navigate('town'));
  document.querySelector('#copy-town-link')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(townUrl(bundle.event.deployment!.slug));notice(t('Town link copied.','小镇链接已复制。'));}catch{notice(t('Copy the address shown above.','请复制上方显示的地址。'));}});
  document.querySelectorAll<HTMLElement>('[data-create],[data-mode],#capture').forEach(el=>el.dataset.cursor='build');document.querySelectorAll<HTMLElement>('[data-enter],[data-tour-landscape]').forEach(el=>el.dataset.cursor='walk');
  if(screen==='setup'){bindSetup();planTurn=undefined;}if(screen==='town')bindTown();
  if(screen==='welcome'){try{homeShowcase=createHomeShowcase($('#home-showcase'),{lang});}catch{$('#home-showcase').innerHTML='<p class="showcase-fallback">'+t('The building preview is unavailable in this browser.','此浏览器暂时无法显示建筑预览。')+'</p>';}}
}
function welcome() {
  const exploreLabel=bundle.event.sampleData?t('Explore sample town','探索示例小镇'):t('Enter the town','进入小镇');
  const createLabel=t('Create town','新建城镇');
  return `<main class="landing"><section class="hero"><div class="hero-copy paper-panel"><h1 class="hero-description">${t('A home for GitHub builders. Let’s watch each other grow.','为github builder打造的家园，让我们一起见证彼此的成长。')}</h1><div class="hero-buttons paired-actions"><button class="button object-entry hinted-control" data-create aria-label="${createLabel}" aria-describedby="create-hint">${objectArt('plan')}<span class="control-hint" id="create-hint" role="tooltip">${createLabel}</span></button><button class="button object-entry hinted-control" data-enter aria-label="${exploreLabel}" aria-describedby="explore-hint">${objectArt('map')}<span class="control-hint" id="explore-hint" role="tooltip">${exploreLabel}</span></button></div></div><div class="hero-art"><div id="home-showcase" class="home-showcase" aria-label="${t('One building growing through five construction stages','一栋建筑的五阶段成长展示')}"></div><p class="floating-note control-hint" id="showcase-hint" role="tooltip">${t('Keep building. Keep growing.','持续构建，持续成长')}</p></div></section><section class="choose"><div class="section-head"><h2>${t('Who can create a town?','谁能新建城镇？')}</h2></div><div class="builder-audiences"><article class="builder-audience"><div class="builder-symbol">${builderSymbol('personal')}</div><h3>${t('Individual builders','个人开发者')}</h3><p>${t('A home for your public projects.','为你的公开作品安一个家。')}</p></article><article class="builder-audience"><div class="builder-symbol">${builderSymbol('community')}</div><h3>${t('Communities & hackathons','社群与黑客松')}</h3><p>${t('Bring your builders’ projects together.','让活动中的开发者聚在一起。')}</p></article></div></section>${townDirectory.length?`<details class="town-directory paper-panel"><summary>${t('Towns on this site','此站点的小镇')} (${townDirectory.length})</summary><ul>${townDirectory.map(town=>`<li><a href="${escape(townUrl(town.slug))}">${escape(town.name)}</a></li>`).join('')}</ul></details>`:''}<footer><a href="https://github.com/ForOneIce/buildergame" target="_blank" rel="noopener noreferrer">Buildergame by ForOneIce · ${t('Source','源码')}</a></footer></main>`;
}

function setup() {
  return `<main class="setup-page planning-desk" aria-label="${t('Town planning sheet','小镇规划图纸')}">
    <div class="planning-sheet" ${planTurn?`data-page-turn="${planTurn}"`:''}><div class="setup-grid">
      <aside class="setup-drawing">${sitePlan(imported ? imported.landscape||'flat' : landscape,t)}<p>${t('Every project keeps its address as the town grows.','每个项目保留固定地址，小镇围绕它们生长。')}</p></aside>
      <section class="setup-card" aria-label="${t('Town configuration','小镇配置')}">
        <div class="tabs" role="group" aria-label="${t('Who is building?','谁来建镇？')}">
          <button class="button" aria-pressed="${collection==='personal'}" data-mode="personal">${builderSymbol('personal')}<span>${t('Personal','个人')}</span></button>
          <button class="button" aria-pressed="${collection==='hackathon'}" data-mode="hackathon">${builderSymbol('community')}<span>${t('Community','社群')}</span></button>
        </div>
        <label>${t('Town name','小镇名称')}<input id="town-name" maxlength="80" placeholder="${t('e.g. Maple’s workshop','例如：枫叶的工坊')}" value="${escape(title)}" ${usePrevious?'readonly':''}></label>
        <p class="helper">${t('Each published town has a unique name and a permanent address on this site.','每座已发布小镇在此站点拥有唯一名称和固定地址。')}</p>
        ${collection==='personal'?`
          <div class="github-connect">${icon('github')}<div><strong>${session.authenticated?escape(session.login):'GitHub'}</strong><p>${t('Choose the public projects you want to bring home.','选择你想在这里安家的公开项目。')}</p></div>${!session.authenticated?`<button type="button" class="button" data-connect-github>${t('Connect','连接')}</button>`:''}</div>
          <div class="inline-fields"><label>${t('GitHub username','GitHub 用户名')}<input id="username" value="${escape(session.login||username)}" placeholder="octocat" ${session.authenticated?'readonly':''}></label><button class="button" id="load-repos">${t('Find repositories','查找仓库')}</button></div>
          <div class="repo-toolbar"><span id="selected-count">${checked.size} ${t('selected','已选择')}</span><button class="text-button" id="select-all">${t('Select all','全选')}</button></div>
          <div class="repo-choices" id="repo-choices">${repositoryChoices()}</div>${nextPage&&repositories.length?`<button class="button" id="more">${t('Load more','加载更多')}</button>`:''}
        `:`
          <label>${t('Public GitHub repository URLs','公开 GitHub 仓库地址')}<textarea id="repositories" rows="6" placeholder="https://github.com/owner/project-one&#10;https://github.com/another/project-two">${escape(repoText)}</textarea></label>
          <p class="helper">${t('One URL per line, from any builder or organization.','每行一个地址，可以来自不同开发者或组织。')}</p>
        `}
        <details class="growth" open><summary>${t('House growth settings','房屋成长设置')}</summary><p class="helper">${t('Your town, your values. These weights shape the buildings.','你的小镇，你的价值取向。用权重决定建筑的成长。')}</p><div class="weight-fields">${(['commits','stars','forks'] as const).map((key,i)=>`<label>${[t('Commits','累计提交'),t('Stars','星标'),t('Forks','分叉')][i]}<input data-weight="${key}" type="number" min="0" step="0.1" value="${weights[key]??0}"></label>`).join('')}</div>${imported?.rule.mode==='custom'?`<p class="helper">${t('Your custom scores are retained. Editing weights switches to weighted growth.','保留已导入的自定义评分；修改权重将切换为加权成长。')}</p>`:''}</details>
        <label>${t('Snapshot occasion (optional)','快照纪念名称（可选）')}<input id="snapshot-label" maxlength="100" placeholder="${t('e.g. Demo day · First release','例如：演示日 · 首次发布')}" value="${escape(snapshotLabel)}"></label>
        <p class="helper">${t('Capture this moment. Recorded data stays unchanged until you create another snapshot.','记录此刻。已保存的数据保持不变，直到你主动创建下一张快照。')}</p>
        <details class="config-backup support-settings" ${supportRecipient||supportRecipientsText?'open':''}><summary>${t('Builder support (optional)','开发者赞赏（可选）')}</summary><p class="helper">${t('Ethereum Sepolia · Test ETH only. Leave this empty to keep playful mailbox coins without wallet prompts.','Ethereum Sepolia · 仅测试 ETH。留空时保留投币彩蛋，不显示钱包提示。')}</p><p id="support-recipient-advice" class="helper">${t('Use a dedicated project support wallet, separate from your everyday wallet. Receiving addresses and on-chain transactions are publicly viewable.','建议使用项目专用赞赏钱包，与日常个人钱包分开。收款地址及链上交易可公开查询。')}</p>${collection==='personal'?`<label>${t('Your public receiving address','公开收款地址')}<input id="support-recipient" maxlength="100" autocomplete="off" spellcheck="false" aria-describedby="support-recipient-advice support-recipient-privacy" placeholder="0x…" value="${escape(supportRecipient)}"></label>`:`<label>${t('Project receiving addresses','项目收款地址')}<textarea id="support-recipients" rows="3" maxlength="30000" spellcheck="false" aria-describedby="support-recipient-advice support-recipient-privacy" placeholder="owner/repository = 0x…">${escape(supportRecipientsText)}</textarea></label><p class="helper">${t('One owner/repository = address per line. Projects without an address keep virtual mailbox coins.','每行填写 owner/repository = 地址。未配置地址的项目保留虚拟投币。')}</p>`}<p id="support-recipient-privacy" class="helper">${t('Use an address designated by the builder. It will be public in the exported town. Never enter a private key or recovery phrase.','请填写开发者指定的地址；地址会随小镇配置公开。不要填写私钥或助记词。')}</p></details>
        <label class="publish-option"><input type="checkbox" id="publish" ${canPublishHere()?'checked':'disabled'}> ${t('Publish for everyone to explore','发布小镇，供所有人探索')}</label>
        <p class="helper publish-hint">${canPublishHere()?t('Saved at its own address. Your other towns stay available.','保存到独立地址，其他小镇仍可访问。'):t('Create in your browser, then commit the exported snapshot to your deployment repository to share its address.','在浏览器中创建后，将导出的快照提交至部署仓库，即可分享小镇地址。')}</p>
        <div class="capture-actions"><button class="button primary" id="capture">${captureLabel()}</button></div>
        <details class="config-backup"><summary>${t('Not ready yet?','还没准备好？')}</summary><p class="helper">${t('Save your plan locally, then load it here when you’re ready to continue. Unfinished fields are welcome.','先把图纸草稿保存在本地，准备好后再导入继续填写。不必一次填完。')}</p><div class="paired-actions"><button class="text-button" id="save-draft">${icon('download')}${t('Save draft','保存草稿')}</button><button class="text-button" data-import>${icon('upload')}${t('Load a plan','导入图纸')}</button></div><button class="text-button" id="export-config">${t('Export deployment configuration','导出部署配置')}</button>${!bundle.event.sampleData?`<p class="helper">${t('Continue the town you just visited, preserving its history and landscape.','继续建设刚刚游览的小镇，保留已有历史和地形。')}</p><div class="paired-actions"><button type="button" class="text-button" id="edit-current-town">${t('Continue current town','继续建设当前小镇')}</button><button type="button" class="text-button" data-export>${t('Back up current town','备份当前小镇')}</button></div>`:''}</details>
      </section>
    </div></div>
  </main>`;
}
function captureLabel() {
  const publish=canPublishHere()&&(publishDraft??true);
  return usePrevious?(publish?t('Update & publish town','更新并发布小镇'):t('Update town','更新小镇')):(publish?t('Create & publish town','创建并发布小镇'):t('Create town','创建小镇'));
}
function loadConfiguration(input: unknown) {
  const event=cleanEvent(input) as TownEvent;
  imported=event;collection=event.collectionType||'hackathon';title=event.name;landscape=event.landscape||'flat';
  repoText=event.projects.map(p=>p.repository).join('\n');weights={...event.rule.weights};usePrevious=false;
  supportRecipient=event.support?.recipient||'';supportRecipientsText=Object.entries(event.support?.projectRecipients||{}).map(([repo,address])=>`${repo} = ${address}`).join('\n');
  repositories=event.projects.map(p=>({repository:p.repository,name:p.name,description:p.description,builder:p.builder}));
  checked.clear();repositories.forEach(r=>checked.add(r.repository));nextPage=null;
}
function loadPlanningDraft(input: unknown) {
  const draft=planningDraft(input);
  collection=draft.collection;landscape=draft.landscape;title=draft.title;username=draft.username;repoText=draft.repoText;
  weights={commits:draft.weights.commits,stars:draft.weights.stars,forks:draft.weights.forks};publishDraft=draft.publish;
  supportRecipient=draft.supportRecipient??draft.configuration?.support?.recipient??'';supportRecipientsText=draft.supportRecipientsText??Object.entries(draft.configuration?.support?.projectRecipients||{}).map(([repo,address])=>`${repo} = ${address}`).join('\n');
  imported=draft.configuration as TownEvent|null;usePrevious=false;nextPage=null;
  repositories=draft.selected.map((repository:string)=>{
    const [owner,name]=repositoryKey(repository).split('/');
    return {repository,name,description:'',builder:{name:owner,url:`https://github.com/${owner}`}};
  });
  checked.clear();draft.selected.forEach((url:string)=>checked.add(url));
}
function repositoryChoices() {return repositories.length?repositories.map(r=>`<label class="repo-choice"><input type="checkbox" data-repo="${escape(r.repository)}" ${checked.has(r.repository)?'checked':''}><span><strong>${escape(r.name)}</strong><small>${escape(r.description)}</small></span></label>`).join(''):`<div class="empty-repos">⌘<p>${t('Your public projects will appear here.','你的公开项目将在这里显示。')}</p></div>`;}
function bindCheckboxes() {document.querySelectorAll<HTMLInputElement>('[data-repo]').forEach(e=>e.onchange=()=>{e.checked?checked.add(e.dataset.repo!):checked.delete(e.dataset.repo!);imported=null;usePrevious=false;$('#selected-count').textContent=`${checked.size} ${t('selected','已选择')}`;$('#capture').textContent=captureLabel();});}
function updateTerrainThumbnail(){
  const thumbnail=document.querySelector<HTMLImageElement>('#terrain-thumbnail');if(!thumbnail)return;
  thumbnail.src=import.meta.env.BASE_URL+'ui/landscapes/'+landscape+'.png';
  thumbnail.alt=t({flat:'Flat town preview',valley:'Valley town preview',clouds:'Cloud town preview'}[landscape],{flat:'平地城镇缩略图',valley:'山谷城镇缩略图',clouds:'云端城镇缩略图'}[landscape]);
}
function withSupportConfiguration(event:TownEvent):TownEvent {
  if((collection==='personal'?supportRecipient:supportRecipientsText).trim()&&!creatorWalletAcknowledged)throw Error(t('Read and acknowledge the wallet support notice before adding a receiving address.','添加收款地址前，请阅读并确认钱包赞赏使用须知。'));
  let support:unknown;
  if(collection==='personal'){
    if(supportRecipient.trim())support={version:1,chainId:SUPPORT_CHAIN_ID,recipient:supportRecipient.trim()};
  }else if(supportRecipientsText.trim()){
    const entries=supportRecipientsText.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{
      const parts=line.split('=');
      if(parts.length!==2)throw Error(t('Use owner/repository = address on each support line.','赞赏地址请每行按 owner/repository = 地址 填写。'));
      const source=parts[0].trim(),key=repositoryKey(source.startsWith('https://')?source:`https://github.com/${source}`);
      return [key,parts[1].trim()] as const;
    });
    if(new Set(entries.map(([key])=>key)).size!==entries.length)throw Error(t('Remove duplicate project support addresses.','请删除重复配置的项目收款地址。'));
    support={version:1,chainId:SUPPORT_CHAIN_ID,projectRecipients:Object.fromEntries(entries)};
  }
  const normalized=cleanSupport(support,event.collectionType,event.projects);
  if(normalized)event.support=normalized;else delete event.support;
  return cleanEvent(event) as TownEvent;
}
function currentConfiguration(): TownEvent {
  const name=title.trim();if(!name)throw Error(t('Give your town a name.','请为小镇起个名字。'));
  if(imported){const result=structuredClone(imported);result.name=name;if(!usePrevious)result.landscape=landscape;return withSupportConfiguration(result);}
  const urls=collection==='personal'?[...checked]:repoText.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
  if(!urls.length)throw Error(t('Choose at least one public repository before creating your town.','创建小镇前，请至少选择或填写一个公开仓库。'));
  const unique=new Set(urls.map(repositoryKey));if(unique.size!==urls.length)throw Error(t('Remove duplicate repository URLs.','请删除重复仓库地址。'));
  const event=configuration({ name, collectionType:collection, landscape, repositories:urls, rule:{...defaultRule,version:`linear-${weights.commits}-${weights.stars}-${weights.forks}`,weights:{...weights}} }) as TownEvent;
  const normalized=name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
  if(townDirectory.some(town=>town.townId!==event.id&&town.name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US')===normalized))throw Error(t('A town with this name already exists. Choose a different name.','此站点已有同名小镇，请换一个名称。'));
  event.projects.forEach(p=>{const source=repositories.find(r=>r.repository===p.repository);if(source)p.builder=source.builder;});return withSupportConfiguration(event);
}
function bindSetup() {
  bindSupportSetupHelp($<HTMLDetailsElement>('.support-settings'),t,creatorWalletAcknowledged,()=>{creatorWalletAcknowledged=true;});
  document.querySelector('#edit-current-town')?.addEventListener('click',()=>{loadConfiguration(bundle.event);usePrevious=true;navigate('setup');});
  landscape=imported ? imported.landscape||'flat' : landscape;
  const picker=document.createElement('div');picker.className='landscape-picker';
  picker.innerHTML='<label for="landscape">'+t('Town landscape','城镇地形')+'</label><select id="landscape" '+(usePrevious?'disabled':'')+'>'+(['flat','valley','clouds'] as Landscape[]).map((mode,i)=>'<option value="'+mode+'" '+(landscape===mode?'selected':'')+'>'+[t('Flat · concrete roads','平地 · 水泥路面'),t('Valley · slopes, gravel & water','山谷 · 缓坡、碎石与水流'),t('Clouds · floating districts & steps','云端 · 漂浮片区与云朵阶梯')][i]+'</option>').join('')+'</select><p class="helper">'+t('Chosen once for this town. Future snapshots keep the same landscape.','建镇时确定，之后的快照保持同一地形。')+'</p>';
  document.querySelector('.site-plan')!.after(picker);
  const landscapeChoices=document.createElement('div');landscapeChoices.className='landscape-choices';landscapeChoices.innerHTML=(['flat','valley','clouds'] as Landscape[]).map((mode,i)=>`<button type="button" class="button landscape-choice" data-landscape-choice="${mode}" aria-pressed="${landscape===mode}" ${usePrevious?'disabled':''}>${icon(['map','mountain','cloud'][i])}<span>${[t('Flat','平地'),t('Valley','山谷'),t('Clouds','云端')][i]}</span></button>`).join('');picker.append(landscapeChoices);picker.querySelector('select')!.classList.add('sr-only');picker.querySelector('select')!.tabIndex=-1;picker.querySelector('select')!.setAttribute('aria-hidden','true');landscapeChoices.setAttribute('role','group');landscapeChoices.setAttribute('aria-label',t('Town landscape','城镇地形'));
  const changeLandscape=(value:Landscape)=>{landscape=value;if(imported&&!usePrevious)imported.landscape=landscape;picker.querySelector('select')!.value=value;document.querySelector<HTMLElement>('.site-plan')!.dataset.landscape=landscape;updateTerrainThumbnail();landscapeChoices.querySelectorAll<HTMLElement>('button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.landscapeChoice===value)));};
  picker.querySelector('select')!.onchange=e=>changeLandscape((e.target as HTMLSelectElement).value as Landscape);landscapeChoices.querySelectorAll<HTMLElement>('button').forEach(el=>el.onclick=()=>changeLandscape(el.dataset.landscapeChoice as Landscape));
  updateTerrainThumbnail();
  const publishInput=$<HTMLInputElement>('#publish');
  publishInput.checked=canPublishHere()&&(publishDraft??true);publishInput.disabled=!canPublishHere();
  publishInput.onchange=()=>{publishDraft=publishInput.checked;$('#capture').textContent=captureLabel();};
  $<HTMLInputElement>('#town-name').oninput=e=>title=(e.target as HTMLInputElement).value;
  $<HTMLInputElement>('#snapshot-label').oninput=e=>snapshotLabel=(e.target as HTMLInputElement).value;
  document.querySelector<HTMLInputElement>('#support-recipient')?.addEventListener('input',e=>supportRecipient=(e.target as HTMLInputElement).value);
  document.querySelector<HTMLTextAreaElement>('#support-recipients')?.addEventListener('input',e=>supportRecipientsText=(e.target as HTMLTextAreaElement).value);
  if(collection==='hackathon')$<HTMLTextAreaElement>('#repositories').oninput=e=>{repoText=(e.target as HTMLTextAreaElement).value;imported=null;usePrevious=false;$('#capture').textContent=captureLabel();};
  else {
    $<HTMLInputElement>('#username').oninput=e=>username=(e.target as HTMLInputElement).value;
    const fetchRepos=async(page=1)=>{
      reposRequest?.abort();const request=new AbortController();reposRequest=request;const generation=++reposGeneration,owner=session.login||username;
      const button=$<HTMLButtonElement>('#load-repos');button.disabled=true;
      try{
        const data=githubToken||!serverAvailable?await listRepositories(owner,page,githubToken,fetch,{signal:request.signal}):await api('repos?owner='+encodeURIComponent(owner)+'&page='+page,undefined,request.signal);
        if(request.signal.aborted||generation!==reposGeneration||screen!=='setup'||collection!=='personal'||owner!==(session.login||username))return;
        if(page===1){repositories=[];checked.clear();imported=null;usePrevious=false;}
        const known=new Set(repositories.map(repo=>repo.repository));repositories.push(...data.repositories.filter((repo:{repository:string})=>!known.has(repo.repository)));
        nextPage=data.nextPage;username=data.owner;if(!title)title=username+"'s town";render();
      }catch(error){if(!request.signal.aborted&&generation===reposGeneration)notice((error as Error).message,true);}
      finally{button.disabled=false;if(reposRequest===request)reposRequest=undefined;}
    };
    $('#load-repos').onclick=()=>void fetchRepos();if(document.querySelector('#more'))$('#more').onclick=()=>void fetchRepos(nextPage!);
    $('#select-all').onclick=()=>{repositories.forEach(r=>checked.add(r.repository));imported=null;usePrevious=false;$('#repo-choices').innerHTML=repositoryChoices();$('#selected-count').textContent=`${checked.size} ${t('selected','已选择')}`;$('#capture').textContent=captureLabel();bindCheckboxes();};bindCheckboxes();
  }
  document.querySelectorAll<HTMLInputElement>('[data-weight]').forEach(e=>e.oninput=()=>{weights[e.dataset.weight as keyof typeof weights]=Number(e.value);if(imported)imported.rule={...defaultRule,mode:'weighted',version:`linear-${weights.commits}-${weights.stars}-${weights.forks}`,weights:{...weights}};});
  $('#export-config').onclick=()=>{try{download(currentConfiguration(),'town.config.json');}catch(e){notice((e as Error).message,true);}};
  $('#save-draft').onclick=()=>{
    try{download(planningDraft({kind:'buildergame-plan/v1',collection,landscape,title,username:session.login||username,repoText,selected:[...checked],weights,publish:publishInput.checked,configuration:imported,supportRecipient,supportRecipientsText}),'town.plan.json');notice(t('Plan saved. Load this file here to pick up where you left off.','草稿已保存。之后在此导入文件，即可继续填写。'));}
    catch(error){notice((error as Error).message,true);}
  };
  $('#capture').onclick=async()=>{
    if(captureBusy)return;
    try {
      const event=currentConfiguration();const publish=$<HTMLInputElement>('#publish').checked;
      captureBusy=true;document.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('button,input,textarea,select').forEach(e=>e.disabled=true);
      $('#capture').textContent=t('Building your snapshot…','正在建立快照…');notice(t('Reading repository metadata and full commit history counts. Large collections can take a few minutes.','正在读取仓库信息和累计提交数。大型合集可能需要几分钟。'));
      const result=githubToken||!serverAvailable?await captureTown(event,usePrevious?bundle:null,githubToken,{label:snapshotLabel.trim()||undefined}):await api('capture',{event,previous:usePrevious?bundle:null,publish,label:snapshotLabel.trim()||undefined});
      bundle=publicBundle(result.bundle) as Bundle;published=result.published;failures=result.failures.length;snapshotIndex=timelineSnapshots().length-1;imported=bundle.event;usePrevious=true;const saved=rememberTown();snapshotLabel='';navigate('success');
      if(!saved&&!published)notice(t('Browser storage is unavailable. Download your backup before leaving.','浏览器存储不可用，请在离开前下载备份。'),true);
    }catch(error){render();notice((error as Error).message,true);}finally{captureBusy=false;}
  };
}
function success() {
  const deployment=bundle.event.deployment,measured=bundle.history.snapshots.filter(s=>s.kind!=='baseline').length;
  return '<main class="success-page paper-panel"><span class="success-icon">'+objectArt('map')+'</span><p class="eyebrow">'+t('A NEW CHAPTER BEGINS','新的篇章开始了')+'</p><h1>'+t('Your town is ready.','你的小镇建好了。')+'</h1><p>'+escape(bundle.event.name)+' · '+bundle.event.projects.length+' '+t('projects','个项目')+' · '+measured+' '+t('recorded snapshots','张记录快照')+'</p><p class="success-status">'+(published?t('Saved on this site. Anyone with the town link can explore without signing in.','已保存在此站点。任何人都可以通过小镇链接免登录游览。'):t('Local preview. Download the backup to keep it and publish it from your GitHub repository.','本地预览。请下载备份留存，也可以从 GitHub 仓库部署发布。'))+'</p>'+
    (published&&deployment?'<div class="published-address"><a id="published-town-url" href="'+escape(townUrl(deployment.slug))+'">'+escape(townUrl(deployment.slug))+'</a><button id="copy-town-link" class="button">'+t('Copy town link','复制小镇链接')+'</button></div>':'')+
    (failures?'<p class="helper">'+failures+' '+t('repositories were unavailable; previous observations are retained when available.','个仓库暂不可用；已有的历史数据会被保留。')+'</p>':'')+
    '<div class="hero-buttons"><button class="button object-entry" data-enter>'+objectArt('map')+'<span class="entry-label">'+t('Enter my town','进入我的小镇')+'</span></button><button class="button light" data-export>↓ '+t('Export backup','导出备份')+'</button></div>'+
    '<details class="config-backup"><summary>'+t('Keep and deploy with GitHub','用 GitHub 保管与部署')+'</summary><ol><li>'+t('Download this town’s backup.','下载这座小镇的备份。')+'</li><li>'+t('In your Buildergame repository, upload it to ','在你的 Buildergame 仓库中，将文件上传至 ')+'<code>'+(deployment?'public/data/towns/'+escape(deployment.slug)+'.json':'public/data/town.json')+'</code>.</li><li>'+t('Commit the file. Vercel rebuilds connected repositories; on GitHub Pages, enable the included Actions workflow.','提交文件。Vercel 会重建关联仓库；GitHub Pages 则启用仓库自带的 Actions 工作流。')+'</li></ol><p class="helper">'+t('Keep the filename for future snapshots of this town. Each town has its own file and address.','同一座小镇的后续快照沿用此文件名；每座小镇拥有独立文件和地址。')+'</p><a href="https://github.com/ForOneIce/buildergame/blob/main/docs/deployment.md" target="_blank" rel="noopener noreferrer">'+t('Deployment guide','部署指南')+'</a></details></main>';
}
function town() {return gameLayout({...bundle,history:{...bundle.history,snapshots:timelineSnapshots()}},snapshotIndex,filter,t);}
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
  $('#project-list').innerHTML=projects.length?projects.map(p=>{const record=timelineSnapshots()[snapshotIndex].projects.find(r=>r.projectId===p.id)!;return `<button class="project-card ${selected===p.id?'selected':''}" data-project="${p.id}">${avatar(p)}<span><strong>${escape(p.name)}</strong><small>${escape(p.builder.name)}</small><em>${stage(record.stage)}${record.status==='stale'?t(' · Last known',' · 上次记录'):''}</em></span><b>↗</b></button>`;}).join(''):`<p class="helper">${t('No matching neighbors.','没有找到匹配的邻居。')}</p>`;
  document.querySelectorAll<HTMLElement>('[data-project]').forEach(e=>e.onclick=()=>details(e.dataset.project!));
}
function details(id: string) {
  selected=id;scene?.focus(id);returnFocus=document.activeElement as HTMLElement;
  const p=bundle.event.projects.find(p=>p.id===id)!;const r=timelineSnapshots()[snapshotIndex].projects.find(r=>r.projectId===id)!;
  const noSampleLinks=bundle.event.sampleData;
  const body=r.status==='baseline'?'<p class="helper">'+t('The town’s starting view. GitHub measurements begin in the next snapshot.','小镇的起始画面，GitHub 数据记录从下一张快照开始。')+'</p>':r.status==='stale'?'<p class="helper">'+t('Showing the last available snapshot.','展示最近一次可用快照。')+'</p>':!r.metrics?'<p class="helper">'+t('Repository data unavailable.','仓库数据暂不可用。')+'</p>':'';
  const supportLink=recipientForProject(bundle.event,p)?`<button type="button" class="button" data-support-project>${icon('coin')}${t('Support builder','支持开发者')}</button>`:'';
  const links=`<button class="button" data-visit ${noSampleLinks?'disabled':''}>${t('Visit project','访问项目')}</button>${supportLink}${noSampleLinks?`<p class="helper">${t('Fictional sample project','虚构示例项目')}</p>`:''}`;
  $('#detail-body').innerHTML=projectCard(p,body,links,'',t);
  document.querySelector('[data-visit]')?.addEventListener('click',()=>openProjectEntry(p));
  document.querySelector('[data-support-project]')?.addEventListener('click',()=>{$<HTMLDialogElement>('#detail').close();void openBuilderSupport(p);});
  markVisited(id);
  list();if(matchMedia('(max-width: 760px)').matches){$('#project-panel').hidden=true;$('#show-projects').setAttribute('aria-expanded','false');returnFocus=$('#show-projects');}else if(returnFocus?.dataset.project)returnFocus=document.querySelector<HTMLElement>('[data-project="'+id+'"]');document.body.classList.add('project-detail-open');$<HTMLDialogElement>('#detail').showModal();
}
function showSnapshot(index: number) {
  const snapshots=timelineSnapshots();if(index<0||index>=snapshots.length)return;
  const previous=snapshots[snapshotIndex];snapshotIndex=index;const snap=snapshots[index];scene?.update(snap);
  mailboxUI?.refresh();
  const baseline=snapshots[0]?.kind==='baseline',position=baseline?index:index+1,total=baseline?snapshots.length-1:snapshots.length;
  $<HTMLInputElement>('#timeline').value=String(index);$<HTMLInputElement>('#timeline').setAttribute('aria-valuetext',`${position} / ${total}, ${date(snap.capturedAt)} UTC`);
  $('#snapshot-date').textContent=snap.kind==='baseline'?t('Starting view','起始画面'):date(snap.capturedAt)+' UTC';$('#snapshot-count').textContent=`${position} / ${total}`;
  const changes=snap.projects.filter(r=>r.stage!==previous.projects.find(p=>p.projectId===r.projectId)?.stage).length;
  const sampleLabel=snap.kind==='baseline'?t('Town founded · visual starting point','建镇起点 · 初始画面'):lang==='zh'&&bundle.event.sampleData?['最初的地基','找到建设的节奏','邻里生机盎然'][index]:lang==='zh'?snap.label.replace(/^Snapshot (\d+)$/,'快照 $1'):snap.label;
  refreshProgress();$('#snapshot-label').textContent=`${sampleLabel}${changes?` · ${changes} ${t('buildings changed','栋建筑发生变化')}`:''}`;list();
}
function bindTown() {
  const support=cleanSupport(bundle.event.support,bundle.event.collectionType,bundle.event.projects);
  const recipients=new Map(bundle.event.projects.map(p=>[p.id,bundle.event.collectionType==='personal'?support?.recipient:support?.projectRecipients?.[repositoryKey(p.repository)]]));
  try{scene=createTown($('#scene'),bundle.event.projects,(id,open)=>{void interfaceAudio.play('open');const p=bundle.event.projects.find(p=>p.id===id)!;if(open){openProjectEntry(p);}else details(id);},bundle.event.landscape||'flat',{
    initialZoomSteps:bundle.event.sampleData?4:0,mailboxDemo:true,onHover:()=>void interfaceAudio.play('hover'),
    mailboxHint:id=>recipients.get(id)?t('Support this builder · Sepolia','支持这位开发者 · Sepolia'):undefined,
    onMailboxClick:id=>{const project=bundle.event.projects.find(p=>p.id===id);if(!project||!recipients.get(id))return false;void openBuilderSupport(project);return true;},
    onMailbox:id=>{if(paidCoinAnimations.delete(id))return;mailboxUI?.credit(id);void interfaceAudio.play('success');}
  });}catch{ $('#scene').innerHTML=`<div class="webgl-error">${t('3D is unavailable in this browser. Every project is still accessible in the directory.','此浏览器无法显示 3D，仍可通过项目列表访问所有项目。')}</div>`; }
  mailboxUI=mountMailboxUI({host:app,projects:bundle.event.projects,snapshot:()=>timelineSnapshots()[snapshotIndex],scene:()=>scene,t,stopHistory:()=>{stop();$('#play').innerHTML=icon('play');$('#play').setAttribute('aria-label',t('Play history','播放历史'));}});
  $('#reset').onclick=()=>scene?.reset();$('#zoom-in').onclick=()=>scene?.zoom(1);$('#zoom-out').onclick=()=>scene?.zoom(-1);
  visited=localProgress(bundle.event.id,null);progressStatus='local';
  $('#map-home').onclick=()=>scene?.reset();
  document.querySelectorAll<HTMLElement>('.map-nav button').forEach(button=>{const label=button.querySelector(':scope > span');if(label&&!button.hasAttribute('aria-label'))button.setAttribute('aria-label',label.textContent!);});
  $('#close-projects').onclick=()=>{$('#project-panel').hidden=true;$('#show-projects').setAttribute('aria-expanded','false');};
  const discover=()=>{const unseen=bundle.event.projects.filter(p=>!visited.has(p.id));const candidates=unseen.length?unseen:bundle.event.projects;const next=candidates[Math.floor(Math.random()*candidates.length)];if(next)details(next.id);};
  $('#random-explore').onclick=discover;
  $('#minimap').onclick=e=>{if(!scene)return;const b=(e.currentTarget as HTMLCanvasElement).getBoundingClientRect();const x=(e.clientX-b.left)/b.width*240,z=(e.clientY-b.top)/b.height*240;const points=minimapPoints();const nearest=points.sort((a,b)=>(a.x-x)**2+(a.z-z)**2-((b.x-x)**2+(b.z-z)**2))[0];if(nearest && Math.hypot(nearest.x-x,nearest.z-z)<26)details(nearest.id);};
  const panel=$('#project-panel');const toggle=$('#show-projects');panel.hidden=true;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.setAttribute('aria-controls','project-panel');
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));};
  document.querySelector('#scene canvas')?.setAttribute('aria-label',t('Interactive town. Use the project directory for keyboard access.','交互小镇。可通过项目列表使用键盘访问全部项目。'));
  document.querySelectorAll<HTMLButtonElement>('[data-tour-landscape]').forEach(button=>button.onclick=()=>{
    if(!bundle.event.sampleData)return;
    const mode=button.dataset.tourLandscape as Landscape;
    const sample=sampleTown() as Bundle;sample.event.landscape=mode;
    if(mode!=='flat'){sample.event.id+='-'+mode;sample.history.eventId=sample.event.id;}
    bundle=sample;published=false;snapshotIndex=Math.min(snapshotIndex,bundle.history.snapshots.length-1);filter='';selected='';navigate('town');
  });
  $<HTMLInputElement>('#search').oninput=e=>{filter=(e.target as HTMLInputElement).value;list();};
  $<HTMLInputElement>('#timeline').oninput=e=>{stop();$('#play').textContent='▶';showSnapshot(Number((e.target as HTMLInputElement).value));};
  $<HTMLButtonElement>('#play').disabled=timelineSnapshots().length<2;
  $('#play').onclick=()=>{if(timer){stop();$('#play').textContent='▶';return;}if(snapshotIndex===timelineSnapshots().length-1)showSnapshot(0);$('#play').textContent='Ⅱ';timer=setInterval(()=>{showSnapshot(snapshotIndex+1);if(snapshotIndex===timelineSnapshots().length-1){stop();$('#play').textContent='▶';}},2200);};
  showSnapshot(snapshotIndex);refreshProgress();mountMapArrival();
}

function minimapPoints(){
  const points=scene?.mapPoints||[];if(!points.length)return [];
  const xs=points.map(p=>p.x),zs=points.map(p=>p.z),minX=Math.min(...xs),minZ=Math.min(...zs),width=Math.max(...xs)-minX,depth=Math.max(...zs)-minZ,scale=155/Math.max(width,depth,16);
  return points.map(p=>({id:p.id,x:120+(p.x-minX-width/2)*scale,z:120+(p.z-minZ-depth/2)*scale}));
}
function refreshProgress(){
  if(screen!=='town')return;
  const count=bundle.event.projects.filter(p=>visited.has(p.id)).length,total=bundle.event.projects.length;
  const countElement=document.querySelector('#visited-count');if(countElement)countElement.textContent=count+' / '+total;
  const explorerCount=document.querySelector('#explorer-count');if(explorerCount)explorerCount.textContent=count+' / '+total+' '+t('projects discovered','个项目已探索');
  for(const id of ['visited-bar','explorer-bar']){const bar=document.querySelector<HTMLProgressElement>('#'+id);if(bar)bar.value=count;}
  const status=document.querySelector('#progress-status');if(status)status.textContent=progressStatus==='memory'?t('This session only · storage unavailable','仅本次会话 · 存储不可用'):t('Saved on this device','保存在当前设备');
  const explorerAvatar=document.querySelector('#explorer-avatar');if(session.avatar&&explorerAvatar)explorerAvatar.innerHTML='<img alt="" src="'+escape(session.avatar)+'" referrerpolicy="no-referrer">';
  const records=timelineSnapshots()[snapshotIndex].projects;
  const totals=[records.reduce((sum,r)=>sum+(r.metrics?.stars||0),0),records.reduce((sum,r)=>sum+(r.metrics?.forks||0),0),total];
  $('#town-stats').innerHTML=totals.map((value,i)=>{
    const key=['stars','forks','projects'][i],label=[t('Stars','星标'),t('Forks','分叉'),t('Projects','项目')][i];
    return `<span class="stat-token hud-glass hinted-control" tabindex="0" aria-label="${label}: ${value.toLocaleString()}" aria-describedby="total-${key}-hint"><b aria-hidden="true">${['★','⑂','⌂'][i]}</b> ${value.toLocaleString()}<span class="control-hint" id="total-${key}-hint" role="tooltip">${t('Totals across all projects.','为所有项目数据总和')}</span></span>`;
  }).join('');
  const canvas=$<HTMLCanvasElement>('#minimap'),ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,240,240);ctx.fillStyle=bundle.event.landscape==='clouds'?'#c1dff2':'#85ad8d';ctx.beginPath();ctx.arc(120,120,112,0,Math.PI*2);ctx.fill();
  const points=minimapPoints();for(const p of points){ctx.fillStyle=visited.has(p.id)?'#f5d783':'#f1f2dc';ctx.fillRect(p.x-7,p.z-7,14,14);if(selected===p.id){ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.strokeRect(p.x-11,p.z-11,22,22);}}
}
function markVisited(id:string){
  visited.add(id);progressStatus=saveProgress(bundle.event.id,null,visited)?'local':'memory';refreshProgress();
}
let startGeneration=0;
async function start() {
  if(supportInteractionLock.locked){deferredSupportNavigation=true;return;}
  const generation=++startGeneration,slug=requestedTown(),query=new URLSearchParams(location.search);
  // Keep in-flight navigation separate from the town used by an open wallet panel.
  let nextError='',nextPublished=false,nextServerAvailable=false,remoteSession:typeof session|undefined;
  let nextDirectory:typeof townDirectory=[];
  try{remoteSession=await api('session');nextServerAvailable=true;}catch{/* Static hosting remains usable without authentication. */}
  let loaded:Bundle|undefined,restoredDraft=false;
  try{
    if(nextServerAvailable){const remote=await api(slug===null?'town':'towns/'+encodeURIComponent(slug));if(remote)loaded=publicBundle(remote) as Bundle;}
    if(!loaded){const response=await fetch(siteUrl(slug===null?'data/town.json':'data/towns/'+encodeURIComponent(slug)+'.json'),{cache:'no-cache'});if(response.ok)loaded=publicBundle(await response.json()) as Bundle;}
    if(loaded)nextPublished=!loaded.event.sampleData;
  }catch{/* Fall back only to a matching local town, never a different public town. */}
  if(generation!==startGeneration)return;
  if(slug!==null&&loaded?.event.deployment?.slug!==slug){loaded=undefined;nextPublished=false;}
  const cachedSlug=slug??loaded?.event.deployment?.slug;
  try{
    const saved=localRead(cachedSlug?'bg-town:'+cachedSlug:'bg-town-backup')||(cachedSlug?localRead('bg-town-backup'):null);
    if(saved){
      const candidate=publicBundle(JSON.parse(saved)) as Bundle;
      const matchingAddress=slug===null||candidate.event.deployment?.slug===slug;
      if(matchingAddress){
        if(!loaded||loaded.event.sampleData){loaded=candidate;nextPublished=false;}
        else if(candidate.event.id===loaded.event.id&&candidate.history.snapshots.length>loaded.history.snapshots.length){
          // Preserve a newer local draft only when it extends this exact public town's recorded history.
          assertAppend(loaded,candidate);loaded=candidate;nextPublished=false;restoredDraft=true;
        }
      }
    }
  }catch{/* Unrelated, stale or rewritten local data never replaces a valid public town. */}
  if(slug!==null&&(!loaded||loaded.event.deployment?.slug!==slug)){
    loaded=undefined;nextPublished=false;nextError=t('This town address is unavailable. Check the link or import its backup.','此小镇地址暂不可用。请检查链接，或导入它的备份。');
  }
  try{const directory=nextServerAvailable?await api('towns'):await(await fetch(siteUrl('data/towns/index.json'),{cache:'no-cache'})).json();nextDirectory=Array.isArray(directory.towns)?directory.towns:[];}catch{/* An unavailable directory does not replace the displayed town early. */}
  if(generation!==startGeneration)return;
  if(supportInteractionLock.locked){deferredSupportNavigation=true;return;}
  startupError=nextError;published=nextPublished;serverAvailable=nextServerAvailable;townDirectory=nextDirectory;screen='welcome';
  if(remoteSession&&sessionSource!=='token'){session=remoteSession;sessionSource=session.authenticated?'server':'guest';}
  bundle=loaded||sampleTown() as Bundle;snapshotIndex=timelineSnapshots().length-1;
  if(slug!==null&&loaded)screen='town';
  if(query.get('town')==='1')screen='town';
  if(query.get('setup')==='personal'){screen='setup';collection='personal';username=session.login||'';title=username?username+"'s town":'';imported=null;usePrevious=false;supportRecipient='';supportRecipientsText='';}
  if(screen==='town'&&loaded?.event.deployment)history.replaceState(null,'',(published?townUrl:previewUrl)(loaded.event.deployment.slug));
  else if(query.has('town')||query.has('setup'))history.replaceState(null,'',location.pathname);
  render();
  if(startupError)notice(startupError,true);
  else if(restoredDraft)notice(t('Your newer local snapshot is restored. Export its backup to publish it.','已恢复较新的本地快照。导出备份后即可部署发布。'));
}

document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('popstate',()=>{stop();void start();});
void start();
