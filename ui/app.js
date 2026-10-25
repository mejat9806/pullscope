// GitHub pull request page renderer. Data arrives from the Rust backend (Tauri `fetch_pr`),
// or from a recorded bundle (`?fixture=file.json`) when previewed in a plain browser.
const tauri = window.__TAURI__ && window.__TAURI__.core;
// Clicking a native notification: open that PR and jump to the comment.
if (window.__TAURI__ && window.__TAURI__.event) window.__TAURI__.event.listen('notif-click', (e) => { const { ref, target } = e.payload || {}; if (!ref) return; S.nav = false; S.bell = false; S.focus = target || ''; openPr(ref); });
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, size = 16, cls = '') => {
  const k = name + (size === 24 ? '-24' : '');
  return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[k] || ''}</svg>`;
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function when(iso, lead = 'on ') {
  const d = new Date(iso), now = new Date(), diff = (now - d) / 1000;
  const abs = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() !== now.getUTCFullYear() ? ', ' + d.getUTCFullYear() : ''}`;
  const title = d.toUTCString();
  let t;
  if (diff < 30 * 86400 && diff >= 0) {
    const n = (v, u) => `${v} ${u}${v === 1 ? '' : 's'} ago`;
    t = diff < 60 ? 'now' : diff < 3600 ? n(Math.floor(diff / 60), 'minute') : diff < 86400 ? n(Math.floor(diff / 3600), 'hour') : n(Math.floor(diff / 86400), 'day');
    return `<span title="${title}">${t}</span>`;
  }
  return `<span title="${title}">${lead}${abs}</span>`;
}
function fullDate(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
const user = (u) => (u ? `<a class="actor" href="${esc(u.html_url)}">${esc(u.login)}</a>` : '<span class="actor">ghost</span>');
const avatar = (u, s = 40) => `<img class="av" src="${esc(u?.avatar_url || '')}${u?.avatar_url ? (u.avatar_url.includes('?') ? '&' : '?') + 's=' + s * 2 : ''}" width="${s}" height="${s}" alt="@${esc(u?.login || 'ghost')}" style="border-radius:50%;display:block">`;
const ASSOC = { CONTRIBUTOR: 'Contributor', MEMBER: 'Member', OWNER: 'Owner', COLLABORATOR: 'Collaborator', FIRST_TIME_CONTRIBUTOR: 'First-time contributor', FIRST_TIMER: 'First-timer', MANNEQUIN: 'Mannequin' };
const REACTS = [['+1', '👍'], ['-1', '👎'], ['laugh', '😄'], ['hooray', '🎉'], ['confused', '😕'], ['heart', '❤️'], ['rocket', '🚀'], ['eyes', '👀']];

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
let S = { profile: (() => { try { return JSON.parse(localStorage.getItem('profile') || 'null'); } catch { return null; } })(), bundle: null, tab: 'conversation', mode: localStorage.getItem('mode') || 'auto', error: '', loading: false, showAllReviewers: true, recent: [], hist: [], hi: -1, hasToken: false, sideTab: 'repos', repos: null, reposErr: '', repoFilter: '', repo: null, prs: null, prState: 'open', split: localStorage.getItem('split') === '1', sel: null, cdiff: {}, rdiff: {}, fr: null, lw: +(localStorage.getItem('lw') || 46), notes: load('notes', []), bell: false, fold: load('fold', {}), hide: load('hide', {}), draft: {}, sbw: +(localStorage.getItem('sbw') || 260), pf: '', psort: localStorage.getItem('psort') || 'updated', pgroup: localStorage.getItem('pgroup') || 'none', who: [], unres: false, unIdx: 0, nav: false, busy: '', actErr: '' };
S.recent = (() => { try { return JSON.parse(localStorage.getItem('recent')) || []; } catch { return []; } })();

const isDark = () => S.mode === 'dark' || (S.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
if (!/Mac/i.test(navigator.platform)) document.documentElement.classList.add('not-mac');
// Mirror the unread count into the menu-bar icon.
let lastUnread = -1;
function syncUnread() {
  const n = S.notes.filter((x) => !x.read).length;
  if (tauri && n !== lastUnread) { lastUnread = n; tauri.invoke('set_unread', { count: n }).catch(() => {}); }
}
// Offline: GitHub unreachable (or the machine is offline). The last saved copy is shown with a clear banner and a retry.
S.offline = typeof navigator !== 'undefined' && navigator.onLine === false;
const isOff = () => !!(S.offline || (S.bundle && S.bundle._cached));
const offlineBar = () => '';
addEventListener('offline', () => { S.offline = true; S.keepScroll = true; render(); S.keepScroll = false; });
addEventListener('online', () => { S.offline = false; if (S.bundle && S.view === 'pr') openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true }); else render(); });
function applyMode() {
  const d = document.documentElement, dark = isDark();
  d.setAttribute('data-color-mode', dark ? 'dark' : 'light'); d.setAttribute('data-light-theme', 'light'); d.setAttribute('data-dark-theme', 'dark'); d.setAttribute('data-t', dark ? 'dark' : 'light');
}

const KEY_RECENT = 'recent';
const compact = (n) => (n == null ? null : n < 1000 ? String(n) : n >= 5000 ? Math.floor(n / 1000) + 'k+' : (Math.floor(n / 100) / 10).toString().replace(/\.0$/, '') + 'k');

// Native-app chrome: toolbar (history, address bar, actions) and a recent-PRs sidebar.

// ---- Tabs: several PRs open at once. Each tab keeps only a small view state; the PR itself comes from the cache. ----
const KEY_TABS = 'tabs';
{ const t = load(KEY_TABS, {}); S.tabs = Array.isArray(t.list) ? t.list : []; S.closed = []; S.tabMenu = false; }
const curRef = () => (S.view === 'pr' && S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '');
const saveTabs = () => { try { localStorage.setItem(KEY_TABS, JSON.stringify({ list: S.tabs.map(({ ref, title, state, icon, tab, dot, scroll }) => ({ ref, title, state, icon, tab, dot, scroll })) })); } catch {} };
const tabIdx = () => S.tabs.findIndex((t) => t.ref === curRef());
function tabSnap() { const t = S.tabs[tabIdx()]; if (t) { t.tab = S.tab; t.scroll = $('.main')?.scrollTop || 0; } }
function tabPut(ref, p, opts = {}) {
  const [state, ic] = stateOf(p), item = { ref, title: p.title, state, icon: ic, tab: S.tab, dot: false };
  const have = S.tabs.findIndex((t) => t.ref === ref);
  if (have >= 0) Object.assign(S.tabs[have], item, { tab: S.tabs[have].tab });
  else if (opts.at >= 0 && !opts.newTab) S.tabs[opts.at] = item;
  else S.tabs.splice(opts.at >= 0 ? opts.at + 1 : S.tabs.length, 0, item);
  S.tabs = S.tabs.slice(-15); saveTabs();
}
function openTab(ref, { newTab = false } = {}) { if (!newTab && ref !== curRef() && fastTab(ref)) return; stashCurrent(); tabSnap(); S.fadeMain = true; S.tabMenu = false; return openPr(ref, { newTab, restore: newTab ? '' : S.tabs.find((t) => t.ref === ref)?.tab }); }
function closeTab(i) {
  const t = S.tabs[i]; if (!t) return; S.alive.delete(t.ref);
  const was = t.ref === curRef(); S.closed = [{ ref: t.ref, tab: t.tab }, ...S.closed.filter((c) => c.ref !== t.ref)].slice(0, 10);
  S.tabs.splice(i, 1); saveTabs();
  if (!was) return render();
  const n = S.tabs[Math.min(i, S.tabs.length - 1)]; S.fadeMain = true;
  if (n) openPr(n.ref, { restore: n.tab, nav: true }); else { S.view = 'home'; S.bundle = null; render(); }
}
function reopenTab() { const c = S.closed.shift(); if (c) { tabSnap(); openPr(c.ref, { newTab: true, restore: c.tab }); } }
function stepTab(d) { if (S.tabs.length < 2) return; const i = tabIdx(), n = S.tabs[(i + d + S.tabs.length) % S.tabs.length]; openTab(n.ref); }
function tabStrip() {
  const cur = S.tabPending || curRef();
  const tabs = S.tabs.map((t, i) => `<div class="ptab ${t.ref === cur ? 'on' : ''}" data-tab="${i}" title="${esc(t.ref + ' · ' + t.title)}"><span class="rc-i ${t.state}">${icon(t.icon)}</span><span class="pt-t"><i>${esc(t.ref.split('/').pop())}</i> ${esc(t.title)}</span>${t.dot ? '<span class="pt-dot"></span>' : ''}<button class="pt-x" data-tabx="${i}" aria-label="Close tab">${icon('x')}</button></div>`).join('');
  const open = new Set(S.tabs.map((t) => t.ref));
  const recents = S.recent.filter((r) => !open.has(r.ref)).slice(0, 8);
  const menu = S.tabMenu ? `<div class="pt-menu"><a data-tabhome>${icon('home')} Home</a>${recents.length ? '<h6>Recent</h6>' : ''}${recents.map((r) => `<a data-tabnew="${esc(r.ref)}"><span class="rc-i ${r.state}">${icon(r.icon)}</span><span class="pt-mt"><i>${esc(r.ref)}</i> ${esc(r.title)}</span></a>`).join('')}${S.closed.length ? `<h6>Closed</h6><a data-tabreopen>${icon('clock')} Reopen ${esc(S.closed[0].ref)} <kbd>⌘⇧T</kbd></a>` : ''}</div>` : '';
  return `<div class="ptabs">${tabs}<button class="pt-add" id="tabadd" title="New tab (⌘T)" aria-label="New tab">${icon('plus')}${S.tabs.length < 2 ? '<span>New tab</span>' : ''}</button>${menu}</div>`;
}
function toolbar() {
  const b = S.bundle, ref = b ? `${b.pull.base.repo.full_name}#${b.pull.number}` : '';
  return `<header class="toolbar" data-tauri-drag-region>
  <button class="tb-btn nav-btn" id="navbtn" title="Show or hide the sidebar">${icon('three-bars')}</button><div class="tb-group"><button class="tb-btn" id="back" ${S.hist.length < 2 || S.hi < 1 ? 'disabled' : ''} title="Back (⌘[)">${icon('chevron-left')}</button><button class="tb-btn" id="fwd" ${S.hi >= S.hist.length - 1 ? 'disabled' : ''} title="Forward (⌘])">${icon('chevron-right')}</button><button class="tb-btn" id="reload" ${b ? '' : 'disabled'} title="Reload (⌘R)">${icon('sync')}</button></div>
  <form id="addr" class="addr">${icon('search')}<input id="addrinput" value="${esc(ref)}" placeholder="Open a pull request: owner/repo#123 or URL  (⌘L)" spellcheck="false" autocomplete="off"></form>${S.update ? `<button class="upd" id="upd" title="Download and install the new version, then restart">${icon('sync')} ${S.update.busy ? 'Updating…' : 'Update to v' + esc(S.update.version)}</button>` : ''}
  <div class="tb-group"><button class="tb-btn off-ind ${isOff() ? 'on' : ''}" id="retry" data-tip="Offline — can't reach GitHub. Showing the saved copy. Click to retry." aria-label="Offline, click to retry" tabindex="${isOff() ? 0 : -1}">${icon('alert')}</button><button class="tb-btn" id="external" ${b ? '' : 'disabled'} title="Open on github.com">${icon('link-external')}</button><button class="tb-btn" id="newprbtn" title="New pull request">${icon('plus')}</button><button class="tb-btn" id="inboxbtn" title="Inbox: PRs that need you">${icon('checklist')}</button><button class="tb-btn bell" id="bell" title="Notifications">${icon('bell')}${S.notes.some((n) => !n.read) ? `<i class="dot">${S.notes.filter((n) => !n.read).length}</i>` : ''}</button><button class="theme-sw${isDark() ? ' dark' : ''}" id="mode" role="switch" aria-checked="${isDark()}" title="Switch to ${isDark() ? 'light' : 'dark'} mode"><i class="st"></i><i class="st s2"></i><i class="st s3"></i><i class="cl"></i><i class="cl c2"></i><span class="knob"><b class="cr"></b><b class="cr c2"></b><b class="cr c3"></b></span></button>${S.hasToken && S.profile ? `<button class="prof-btn" id="profbtn" title="${esc(S.profile.name || S.profile.login)} — account menu"><img src="${esc(avUrl(S.profile.avatar_url, 56))}" alt=""><span>${esc(S.profile.name || S.profile.login)}</span>${icon('chevron-down', 12)}</button>` : `<button class="tb-btn" id="signin" title="Access token">${icon('key')}</button>`}</div></header>`;
}
function sideRecent() {
  const tabs = `<div class="sb-tabs"><button data-side="repos" class="${S.sideTab === 'repos' ? 'on' : ''}">Repos</button>${S.repo ? `<button data-side="prs" class="${S.sideTab === 'prs' ? 'on' : ''}">PRs</button>` : ''}<button data-side="recent" class="${S.sideTab === 'recent' ? 'on' : ''}">Recent</button></div>`;
  let list;
  if (S.sideTab === 'prs' && S.repo) {
    list = prSide();
  } else if (S.sideTab === 'recent') {
    list = S.recent.map((r) => `<a class="rc ${S.bundle && r.ref === `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` ? 'on' : ''}" data-open="${esc(r.ref)}"><span class="rc-i ${r.state}">${icon(r.icon)}</span><span class="rc-t"><b>${esc(r.title)}</b><i>${esc(r.ref)}</i></span><button class="rc-x" data-rm="${esc(r.ref)}" title="Remove">${icon('x')}</button></a>`).join('') || '<div class="sb-empty">Pull requests you open appear here.</div>';
  } else if (!S.hasToken) {
    list = '<div class="sb-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="sb-btn" id="addtoken">Add token</button></div>';
  } else if (S.reposErr) {
    list = `<div class="sb-empty err">${esc(S.reposErr)}</div>`;
  } else if (!S.repos) {
    list = '<div class="sb-empty">Loading repositories…</div>';
  } else {
    const f = S.repoFilter.toLowerCase();
    list = `<input class="input sb-filter" id="repofilter" placeholder="Find a repository…" value="${esc(S.repoFilter)}">` + (S.repos.filter((r) => r.full_name.toLowerCase().includes(f)).map((r) => `<a class="rc ${S.repo === r.full_name ? 'on' : ''}" data-repo="${esc(r.full_name)}"><span class="rc-i ${r.private ? 'closed' : ''}" style="color:var(--fgColor-muted)">${icon(r.private ? 'lock' : 'repo')}</span><span class="rc-t"><b>${esc(r.full_name.split('/')[1])}</b><i>${esc(r.full_name.split('/')[0])}</i></span></a>`).join('') || '<div class="sb-empty">No matches.</div>');
  }
  return `<aside class="sidebar">${tabs}<div class="sb-list">${list}</div><div class="sb-foot">${S.hasToken ? 'Signed in with token' : 'Anonymous · 60 requests/hour'}</div></aside>`;
}

const PSORT = { updated: 'Recently updated', created: 'Newest', oldest: 'Oldest', number: 'Number', title: 'Title A–Z', author: 'Author' };
const PGROUP = { none: 'No grouping', status: 'Status', author: 'Author', label: 'Label', base: 'Base branch' };
const prStatus = (p) => (p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : p.draft ? 'draft' : 'open');
const PICON = { open: 'git-pull-request', draft: 'git-pull-request-draft', merged: 'git-merge', closed: 'git-pull-request-closed' };
function prSide() {
  const cur = S.bundle && S.view === 'pr' ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '';
  const f = S.pf.toLowerCase();
  const sel = (id, opts, v) => `<select class="input sb-sel" id="${id}">${Object.entries(opts).map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const head = `<div class="sb-repo"><button class="fold-btn" data-side="repos" title="All repositories">${icon('chevron-left')}</button><b title="${esc(S.repo)}">${esc(S.repo)}</b></div>
  <div class="seg sb-seg">${['open', 'closed', 'all'].map((s) => `<button data-sps="${s}" class="${S.prState === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
  <input class="input sb-filter" id="prfilter" placeholder="Filter by title, #, author, label…" value="${esc(S.pf)}">
  <div class="sb-ctl"><label>Sort${sel('prsort', PSORT, S.psort)}</label><label>Group${sel('prgroup', PGROUP, S.pgroup)}</label></div>`;
  if (!S.prs) return head + '<div class="sb-empty">Loading pull requests…</div>';
  const list = S.prs.filter((p) => !f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f));
  const by = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number }[S.psort];
  list.sort(by);
  const row = (p) => { const st = prStatus(p), ref = `${S.repo}#${p.number}`; return `<a class="rc ${ref === cur ? 'on' : ''}" data-open="${esc(ref)}"><span class="rc-i ${st}">${icon(PICON[st])}</span><span class="rc-t"><b>${esc(p.title)}</b><i>#${p.number} · ${esc(p.user.login)} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}</i></span></a>`; };
  if (!list.length) return head + `<div class="sb-empty">${S.pf ? 'No matches.' : 'No pull requests.'}</div>`;
  if (S.pgroup === 'none') return head + `<div class="sb-count">${list.length} pull request${list.length === 1 ? '' : 's'}</div>` + list.map(row).join('');
  const groups = new Map(), put = (k, p) => (groups.get(k) || groups.set(k, []).get(k)).push(p);
  list.forEach((p) => {
    if (S.pgroup === 'status') put({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }[prStatus(p)], p);
    else if (S.pgroup === 'author') put(p.user.login, p);
    else if (S.pgroup === 'base') put(p.base?.ref || '—', p);
    else if ((p.labels || []).length) p.labels.forEach((l) => put(l.name, p)); else put('No label', p);
  });
  const order = S.pgroup === 'status' ? ['Open', 'Draft', 'Merged', 'Closed'] : [...groups.keys()].sort((a, b) => (a === 'No label') - (b === 'No label') || a.localeCompare(b));
  return head + order.filter((k) => groups.has(k)).map((k) => { const key = 'pg:' + S.pgroup + ':' + k; return `<div class="pg${folded(key)}"><div class="pg-h" data-fold="${esc(key)}">${icon(isFolded(key) ? 'chevron-right' : 'chevron-down')}<span>${esc(k)}</span><i>${groups.get(k).length}</i></div><div class="pg-b">${groups.get(k).map(row).join('')}</div></div>`; }).join('');
}

function prFiltered() {
  const f = S.pf.toLowerCase();
  const list = (S.prs || []).filter((p) => (!f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f))
    && (!S.pAuthor || p.user.login === S.pAuthor) && (!S.pLabel || (p.labels || []).some((l) => l.name === S.pLabel))
    && (!S.pStatus || prStatus(p) === S.pStatus));
  return list.sort({ updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number }[S.psort]);
}
function prFilterBar() {
  if (!S.prs) return '';
  const authors = [...new Set(S.prs.map((p) => p.user.login))].sort((a, b) => a.localeCompare(b));
  const labels = [...new Set(S.prs.flatMap((p) => (p.labels || []).map((l) => l.name)))].sort((a, b) => a.localeCompare(b));
  const opt = (arr, v, all) => `<option value="">${all}</option>` + arr.map((x) => `<option value="${esc(x)}"${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const sts = { open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' };
  const n = prFiltered().length, active = S.pf || S.pAuthor || S.pLabel || S.pStatus;
  return `<div class="prl-filters"><span class="pf-search">${icon('search')}<input class="input" id="mainfilter" placeholder="Filter by title, #, author, branch, label…" value="${esc(S.pf)}" spellcheck="false"></span>
  <select class="input" id="pfauthor">${opt(authors, S.pAuthor, 'Author: all')}</select>
  <select class="input" id="pflabel">${opt(labels, S.pLabel, 'Label: all')}</select>
  <select class="input" id="pfstatus"><option value="">Status: any</option>${Object.entries(sts).map(([k, t]) => `<option value="${k}"${k === S.pStatus ? ' selected' : ''}>${t}</option>`).join('')}</select>
  <select class="input" id="pfsort">${Object.entries(PSORT).map(([k, t]) => `<option value="${k}"${k === S.psort ? ' selected' : ''}>Sort: ${t}</option>`).join('')}</select>
  <span class="pf-count">${n} of ${S.prs.length}</span>${active ? '<button class="btn" id="pfclear">Clear</button>' : ''}</div>`;
}
function prList() {
  const head = `<div class="prl-head"><div><span class="repo-ic">${icon('repo', 16)}</span> <b>${esc(S.repo)}</b></div><div class="seg">${['open', 'closed', 'all'].map((s) => `<button data-ps="${s}" class="${S.prState === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div></div>`;
  let body;
  const pb = pushBanners(S.repo);
  if (S.error) body = `<div class="err" style="padding:16px">${esc(S.error)}</div>`;
  else if (!S.prs) body = '<div class="spinner" style="margin:48px auto">Loading pull requests…</div>';
  else body = prFiltered().map((p) => {
    const st = p.merged_at ? ['merged', 'git-merge'] : p.state === 'closed' ? ['closed', 'git-pull-request-closed'] : p.draft ? ['draft', 'git-pull-request-draft'] : ['open', 'git-pull-request'];
    const lbl = (p.labels || []).map((l) => `<span class="pill-label" style="background:#${esc(l.color)}33;color:#${esc(l.color)};border-color:#${esc(l.color)};margin:0 0 0 4px">${esc(l.name)}</span>`).join('');
    return `<a class="prl-row" data-open="${esc(S.repo)}#${p.number}"><span class="rc-i ${st[0]}">${icon(st[1])}</span><span class="prl-main"><b>${esc(p.title)}</b>${lbl}<i>#${p.number} ${p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : 'opened'} ${when(p.merged_at || p.closed_at || p.created_at).replace(/<\/?span[^>]*>/g, '')} by ${esc(p.user.login)}</i></span><img src="${esc(p.user.avatar_url)}&s=40" width="20" height="20" style="border-radius:50%"></a>`;
  }).join('') || `<div class="diff-empty">${S.prs.length ? 'No pull requests match the filters.' : 'No pull requests.'}</div>`;
  return `<div class="pr-page"><div class="repoline" style="padding-bottom:16px"></div>${pb}<div class="prl">${head}${prFilterBar()}${body}</div></div>`;
}

// Breadcrumbs for every page: Home › (owner / repo) › … ; the last item is the current page.
function crumbs(repo, trail = [], extra = '') {
  const sep = `<span class="crumb-sep">${icon('chevron-right', 12)}</span>`;
  const homeCur = !repo && !trail.length;
  const parts = [homeCur ? `<span class="crumb cur home">${icon('home', 14)}<span>Home</span></span>` : `<a class="crumb" data-home="1" title="Home">${icon('home', 14)}<span>Home</span></a>`];
  if (repo) {
    const [owner, name] = repo.split('/');
    parts.push(`<span class="crumb-grp"><a class="crumb" data-owner="${esc(owner)}" title="Repositories of ${esc(owner)}">${esc(owner)}</a><span class="crumb-slash">/</span><a class="crumb strong" data-repo="${esc(repo)}" title="All pull requests in ${esc(repo)}">${esc(name)}</a></span>`);
  }
  trail.forEach((t, i) => parts.push(i === trail.length - 1 ? `<span class="crumb cur">${esc(t.t)}</span>` : `<a class="crumb" ${t.repo ? `data-repo="${esc(t.repo)}"` : ''}>${esc(t.t)}</a>`));
  return `<nav class="repoline crumbs" aria-label="Breadcrumb">${parts.join(sep)}${extra}</nav>`;
}
function repoHeader(p) {
  const r = p.base.repo;
  return crumbs(r.full_name, [{ t: 'Pull requests', repo: r.full_name }, { t: `#${p.number}` }], `<a class="crumb gh" href="${esc(r.html_url)}" data-ext title="Open on GitHub">${icon('link-external', 12)}</a>${S.refreshing ? '<span class="stale">Refreshing…</span>' : ''}`);
}

function stateOf(p) {
  if (p.merged) return ['merged', 'git-merge', 'Merged'];
  if (p.state === 'closed') return ['closed', 'git-pull-request-closed', 'Closed'];
  if (p.draft) return ['draft', 'git-pull-request-draft', 'Draft'];
  return ['open', 'git-pull-request', 'Open'];
}

function prHeader(b) {
  const p = b.pull, [st, ic, label] = stateOf(p), n = p.number;
  const commentsTotal = p.comments + p.review_comments + b.timeline.filter((e) => e.event === 'reviewed').length;
  const sq = (() => { const t = p.additions + p.deletions || 1; const small = t <= 5; const a = small ? p.additions : Math.round((p.additions / t) * 5); const d = small ? p.deletions : 5 - a; const arr = []; for (let i = 0; i < 5; i++) arr.push(i < a ? 'a' : i < a + d ? 'd' : ''); return arr.map((c) => `<i class="${c}"></i>`).join(''); })();
  const who = st === 'merged' ? `<a class="author" style="text-decoration:underline;text-underline-offset:2px" href="${esc(p.merged_by.html_url)}">${esc(p.merged_by.login)}</a> merged ${p.commits} commit${p.commits === 1 ? '' : 's'} into` : `<a class="author" href="${esc(p.user.html_url)}">${esc(p.user.login)}</a> wants to merge ${p.commits} commit${p.commits === 1 ? '' : 's'} into`;
  const at = st === 'merged' ? p.merged_at : st === 'closed' ? p.closed_at : p.created_at;
  const splitOk = S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline';
  const tabs = [['conversation', 'comment-discussion', 'Conversation', commentsTotal + 0], ['timeline', 'clock', 'Timeline', b.timeline.length],['commits', 'git-commit', 'Commits', p.commits], ['checks', 'checklist', 'Checks', (b.checks || []).length], ['files', 'file-diff', 'Files changed', p.changed_files]];
  return `<div class="pr-title-area"><h1 class="pr-title"><span>${esc(p.title)}</span><span class="num">#${n}</span>${p.state === 'open' && !p.merged ? `<button class="copy-btn" id="editpr" title="Edit title and description">${icon('pencil')}</button>` : ''}</h1>
  <div class="pr-meta"><span class="state-pill state-${st}">${icon(ic)} ${label}</span><span>${who}</span> <span class="branch" title="${esc(p.base.repo.full_name)}:${esc(p.base.ref)}">${esc(p.base.label)}</span> <span>from</span> <span class="branch">${esc(p.head.label)}</span><button class="copy-btn" id="copybranch" aria-label="Copy head branch name to clipboard">${icon('copy')}</button><span>${when(at)}</span></div></div>
  <div class="pr-tabs"><span class="mini" title="${esc(p.title)}"><b>#${n}</b> ${esc(p.title)}</span><nav>${tabs.map(([k, i, t, c]) => `<a data-tab="${k}" class="${S.tab === k || (k === 'commits' && false) ? 'sel' : ''}">${icon(i)}${t}<span class="counter">${c}</span></a>`).join('')}</nav>
  <div class="tools"><button class="split-btn" id="review" title="Submit a review">${icon('eye')}<span>Review</span></button><button class="split-btn ${S.hide.side || S.split ? '' : 'on'}" id="sidetoggle" title="Show or hide the details panel" ${S.tab !== 'conversation' || S.split ? 'disabled' : ''} style="${S.tab !== 'conversation' ? 'visibility:hidden' : ''}">${icon('sidebar-expand')}<span>Details</span></button><button class="split-btn ${splitOk && S.split ? 'on' : ''}" id="split" title="${splitOk ? 'Split view: commits beside conversation' : 'Split view is available on the Conversation and Commits tabs'}" ${splitOk ? '' : 'disabled'}>${icon('columns')}<span>Split view</span></button><div class="diffstat"><span class="add">+${p.additions}</span><span class="del">-${p.deletions}</span><span class="sq">${sq}</span></div></div></div>`;
}

const isFolded = (k, def = false) => (k in S.fold ? S.fold[k] : def);
const folded = (k, def = false) => (isFolded(k, def) ? ' folded' : '');
const foldBtn = (k, title = 'Collapse / expand', def = false) => `<button class="fold-btn" data-fold="${esc(k)}" data-def="${def ? 1 : 0}" title="${title}">${icon(isFolded(k, def) ? 'chevron-right' : 'chevron-down')}</button>`;

function reactionsHtml(r, kind, id) {
  r = r || {};
  const items = REACTS.filter(([k]) => r[k] > 0).map(([k, e]) => `<span class="reaction${kind && id ? ' rc-btn' : ''}" ${kind && id ? `data-rck="${kind}" data-rcid="${id}" data-rcc="${k}" title="Click to add or remove your reaction"` : ''}><span class="e">${e}</span><span>${r[k]}</span></span>`);
  const add = kind && id ? `<span class="react-wrap"><button class="react-add" data-rk="${kind}" data-rid="${id}" title="Add reaction">${icon('smiley')}</button></span>` : '';
  return items.length || add ? `<div class="reactions">${items.join('')}${add}</div>` : '';
}

function commentBox(c, { isPr = false } = {}) {
  const u = c.user || c.actor;
  const assoc = ASSOC[c.author_association];
  const body = c.body_html && c.body_html.trim() ? `<div class="markdown-body">${c.body_html}</div>` : '<span class="empty">No description provided.</span>';
  return `<div class="tl-comment${folded('c:' + c.id)}" id="c-${esc(c.id ?? '')}"><div class="avatar-col"><a href="${esc(u?.html_url)}">${avatar(u, 40)}</a></div>
  <div class="cbox"><div class="chead"><div>${foldBtn('c:' + c.id, 'Hide this comment')} <a class="author u" href="${esc(u?.html_url)}"><span class="author" style="font-weight:600;color:var(--fgColor-default)">${esc(u?.login || 'ghost')}</span></a> ${isPr ? 'commented' : 'commented'} <a class="ts" href="${esc(c.html_url || '#')}">${when(c.created_at || c.submitted_at)}</a></div>
  <div class="rt">${assoc ? `<span class="assoc">${assoc}</span>` : ''}<button class="cm-btn" data-cm="${esc(c.id)}" title="Comment actions">⋯</button></div></div>
  <div class="cbody">${body}</div>${reactionsHtml(c.reactions, isPr ? 'pr' : 'issue_comment', c.id)}</div></div>`;
}

function diffHunkTable(hunk) {
  const rows = []; let o = 0, n = 0;
  for (const line of hunk.split('\n')) {
    if (line.startsWith('@@')) { const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/); if (m) { o = +m[1]; n = +m[2]; } rows.push(`<tr class="hunk"><td class="num">…</td><td class="num">…</td><td class="code">${esc(line)}</td></tr>`); continue; }
    const t = line[0], txt = line.slice(1);
    if (t === '+') rows.push(`<tr class="add"><td class="num"></td><td class="num">${n++}</td><td class="code" data-marker="+">${esc(txt)}</td></tr>`);
    else if (t === '-') rows.push(`<tr class="del"><td class="num">${o++}</td><td class="num"></td><td class="code" data-marker="-">${esc(txt)}</td></tr>`);
    else if (t === '\\') rows.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(line)}</td></tr>`);
    else rows.push(`<tr><td class="num">${o++}</td><td class="num">${n++}</td><td class="code" data-marker=" ">${esc(txt)}</td></tr>`);
  }
  return `<table class="diff"><colgroup><col style="width:50px"><col style="width:50px"><col></colgroup>${rows.join('')}</table>`;
}


// ---- File diffs: unified or side-by-side, syntax highlighted, with line comments for a draft review ----
S.diffMode = localStorage.getItem('diffmode') || 'unified';
S.pending = load('pending', {});
const pendKey = () => (S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '');
const pendList = () => S.pending[pendKey()] || [];
const savePending = () => localStorage.setItem('pending', JSON.stringify(S.pending));
function parsePatch(patch) {
  const rows = []; let o = 0, n = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) { const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/); if (m) { o = +m[1]; n = +m[2]; } rows.push({ t: 'hunk', text: line }); continue; }
    const c = line[0], txt = line.slice(1);
    if (c === '+') rows.push({ t: 'add', n: n++, text: txt });
    else if (c === '-') rows.push({ t: 'del', o: o++, text: txt });
    else if (c === '\\') rows.push({ t: 'note', text: line });
    else rows.push({ t: 'ctx', o: o++, n: n++, text: txt });
  }
  return rows;
}
const codeHtml = (text, path) => (window.hlLine && window.hlLine(text, path)) ?? esc(text);
// "+" button + inline editor + saved draft comments for one line
const lineKey = (path, line, side) => `${path}\u001f${side}\u001f${line}`;
// Pending comments are Markdown; show code fences (incl. suggestions) as blocks, everything else as plain text.
const lcBody = (md) => String(md).split(/```/).map((p, i) => i % 2 ? (() => { const m = p.match(/^(\w*)\n?([\s\S]*)$/); return `<pre class="lc-code${m[1] === 'suggestion' ? ' sug' : ''}">${m[1] === 'suggestion' ? '<b>Suggested change</b>\n' : ''}${esc(m[2].replace(/\n$/, ''))}</pre>`; })() : esc(p).replace(/\n/g, '<br>')).join('');
// Existing review threads for one line, shown read-only under it (reply / resolve live in the Conversation tab).
function threadsFor(path) { return (S.bundle?.review_comments || []).filter((c) => c.path === path); }
function lineThreads(path, line, side, cols) {
  const all = threadsFor(path); if (!all.length) return '';
  const roots = all.filter((c) => !c.in_reply_to_id && (c.line ?? c.original_line) === line && (c.side || 'RIGHT') === side); if (!roots.length) return '';
  const res = new Set(S.bundle.resolved_ids || []);
  const b = S.bundle, card = (c, rootId) => `<div class="tc"><a href="${esc(c.user?.html_url || '#')}">${avatar(c.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">${esc(c.user?.login || 'ghost')}</span> <span>${when(c.created_at)}</span>${S.hasToken ? `<button class="cm-btn" data-cm="${esc(c.id)}" data-root="${rootId}" title="Comment actions">⋯</button>` : ''}</div><div class="markdown-body" style="margin-top:8px">${c.body_html || esc(c.body || '')}</div>${reactionsHtml(c.reactions, 'review_comment', c.id)}</div></div>`;
  return roots.map((r) => {
    const isRes = res.has(r.id), tid = (b.thread_ids || {})[r.id], list = [r, ...all.filter((c) => c.in_reply_to_id === r.id)];
    const act = tid && S.hasToken ? `<button class="thread-act" data-thread="${esc(tid)}" data-res="${isRes ? 'unresolve' : 'resolve'}">${isRes ? 'Unresolve conversation' : 'Resolve conversation'}</button>` : '';
    const reply = S.hasToken ? `<div class="reply">${draftBox('reply-' + r.id, 'Write a reply', 2)}${errLine('reply-' + r.id)}<button class="btn small" data-sendreply="${r.id}">Reply</button></div>` : '';
    return `<tr class="lc-row th-row"><td colspan="${cols}"><div class="thread inl${folded('t:' + r.id, isRes)}"><div class="thread-head">${foldBtn('t:' + r.id, 'Hide this thread', isRes)}<span class="th-t">Comment on line <b>${side === 'LEFT' ? 'L' : 'R'}${line}</b></span>${r.line == null ? '<span class="res out">Outdated</span>' : ''}${isRes ? '<span class="res">Resolved</span>' : ''}</div>${list.map((c) => card(c, r.id)).join('')}${reply}${act ? `<div class="th-foot">${act}</div>` : ''}</div></td></tr>`;
  }).join('');
}
function lineExtras(path, line, side, cols, canComment, text) {
  const k = lineKey(path, line, side), th = lineThreads(path, line, side, cols), mine = pendList().filter((c) => c.path === path && c.line === line && c.side === side);
  const cards = mine.map((c) => `<div class="lc-card"><span class="lc-tag">Pending</span><div class="lc-body">${lcBody(c.body)}</div><button class="lc-x" data-lcdel="${c.id}" title="Delete draft comment">${icon('x')}</button></div>`).join('');
  const open = canComment && S.lcOpen === k ? `<div class="lc-edit">${draftBox('lc', 'Leave a comment on this line', 3)}<div class="lc-btns">${side === 'RIGHT' && text !== undefined ? `<button class="btn small" id="lcsuggest" data-code="${esc(text)}" title="Insert a suggested change for this line">± Suggest change</button>` : ''}<span class="sp"></span><button class="btn small" id="lccancel">Cancel</button><button class="btn small primary" id="lcadd">Add to review</button></div></div>` : '';
  return th + (cards || open ? `<tr class="lc-row"><td colspan="${cols}"><div class="lc">${cards}${open}</div></td></tr>` : '');
}
// Built diff HTML is cached per file, so redraws, tab switches and returning to a PR do not rebuild thousands of rows.
const diffCache = new Map();
function diffTable(patch, path, canComment) {
  const open = S.lcOpen && String(S.lcOpen).includes(path);
  if (open) return diffTableBuild(patch, path, canComment);
  const key = `${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((c) => c.path === path))}|${threadsFor(path).map((c) => c.id + ':' + (c.updated_at || '') + JSON.stringify(c.reactions || {}) + ((S.bundle.resolved_ids || []).includes(c.id) ? 'r' : '') + (isFolded('t:' + c.id, (S.bundle.resolved_ids || []).includes(c.id)) ? 'f' : '')).join(',')}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith('reply-') ? S.actErr.k + S.actErr.m : ''}`, hit = diffCache.get(key);
  if (hit && hit.patch === patch) return hit.html;
  const html = diffTableBuild(patch, path, canComment);
  diffCache.set(key, { patch, html });
  if (diffCache.size > 400) diffCache.delete(diffCache.keys().next().value);
  return html;
}
function diffTableBuild(patch, path, canComment) {
  const rows = parsePatch(patch), plus = (line, side) => canComment ? `<button class="lc-plus" data-lc="${esc(lineKey(path, line, side))}" title="Add a comment on this line">+</button>` : '';
  const out = [];
  if (S.diffMode === 'split') {
    let i = 0;
    while (i < rows.length) {
      const r = rows[i];
      if (r.t === 'hunk') { out.push(`<tr class="hunk"><td class="num"></td><td class="code" colspan="3">${esc(r.text)}</td></tr>`); i++; continue; }
      if (r.t === 'note') { i++; continue; }
      if (r.t === 'ctx') { out.push(`<tr><td class="num">${r.o}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td><td class="num">${r.n}${plus(r.n, 'RIGHT')}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n, 'RIGHT', 4, canComment, r.text)}`); i++; continue; }
      const dels = [], adds = [];
      while (rows[i] && rows[i].t === 'del') dels.push(rows[i++]);
      while (rows[i] && rows[i].t === 'add') adds.push(rows[i++]);
      for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
        const d = dels[k], a = adds[k];
        out.push(`<tr><td class="num${d ? ' del' : ' empty'}">${d ? d.o + plus(d.o, 'LEFT') : ''}</td><td class="code${d ? ' del' : ' empty'}" ${d ? 'data-marker="-"' : ''}>${d ? codeHtml(d.text, path) : ''}</td><td class="num${a ? ' add' : ' empty'}">${a ? a.n + plus(a.n, 'RIGHT') : ''}</td><td class="code${a ? ' add' : ' empty'}" ${a ? 'data-marker="+"' : ''}>${a ? codeHtml(a.text, path) : ''}</td></tr>${d ? lineExtras(path, d.o, 'LEFT', 4, canComment) : ''}${a ? lineExtras(path, a.n, 'RIGHT', 4, canComment, a.text) : ''}`);
      }
    }
    return chunkTables(out, 'diff sbs', '<colgroup><col style="width:64px"><col><col style="width:64px"><col></colgroup>');
  }
  for (const r of rows) {
    if (r.t === 'hunk') out.push(`<tr class="hunk"><td class="num">…</td><td class="num">…</td><td class="code">${esc(r.text)}</td></tr>`);
    else if (r.t === 'note') out.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(r.text)}</td></tr>`);
    else if (r.t === 'add') out.push(`<tr class="add"><td class="num"></td><td class="num">${r.n}${plus(r.n, 'RIGHT')}</td><td class="code" data-marker="+">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n, 'RIGHT', 3, canComment, r.text)}`);
    else if (r.t === 'del') out.push(`<tr class="del"><td class="num">${r.o}${plus(r.o, 'LEFT')}</td><td class="num"></td><td class="code" data-marker="-">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.o, 'LEFT', 3, canComment)}`);
    else out.push(`<tr><td class="num">${r.o}</td><td class="num">${r.n}${plus(r.n, 'RIGHT')}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n, 'RIGHT', 3, canComment, r.text)}`);
  }
  return chunkTables(out, 'diff', '<colgroup><col style="width:64px"><col style="width:64px"><col></colgroup>');
}
// Diffs render as one table per file (no lazy blocks: skipping off-screen rows made scrolling janky).
function chunkTables(out, cls, cols, size = Infinity) {
  if (out.length <= size) return `<table class="${cls}">${cols}${out.join('')}</table>`;
  let h = '';
  for (let i = 0; i < out.length; i += size) { const n = Math.min(size, out.length - i); h += `<div class="dchunk" style="contain-intrinsic-size:auto ${n * 22}px"><table class="${cls}">${cols}${out.slice(i, i + size).join('')}</table></div>`; }
  return h;
}


// ```suggestion blocks in a review comment can be applied as a commit on the PR branch
const sugOf = (c) => { const m = (c.body || '').match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/); return m ? m[1] : null; };
function suggestBtn(c, b, list) {
  const t = sugOf(c); if (t !== null && S.applied?.has(String(c.id))) return '<div class="sug-row"><span class="sug-note">Applying suggestion…</span></div>';
  if (t === null || !b0open() || list.some((x) => (b.resolved_ids || []).includes(x.id))) return '';
  const p = b.pull, mine = p.head.repo && !p.head.repo.fork || (p.head.repo && p.head.repo.full_name === p.base.repo.full_name);
  if (!c.line) return '<div class="sug-row"><span class="sug-note">Outdated suggestion — the lines have changed.</span></div>';
  return `<div class="sug-row"><button class="btn small primary" data-sug="${c.id}" ${p.head.repo ? '' : 'disabled'}>Apply suggestion</button><span class="sug-note">Commits to <code>${esc(p.head.ref)}</code>${mine ? '' : ' (fork — needs push access)'}</span></div>`;
}
function reviewBlock(e, b) {
  const resolved = new Set(b.resolved_ids || []), isRes = (list) => list.some((c) => resolved.has(c.id));
  const stateMap = { approved: ['check', 'success', 'approved these changes'], changes_requested: ['file-diff', 'danger', 'requested changes'], commented: ['eye', '', 'reviewed'], dismissed: ['x', '', 'dismissed a review'] };
  const [ic, kind, verb] = stateMap[e.state.toLowerCase()] || ['eye', '', 'reviewed'];
  const cs = b.review_comments.filter((c) => c.pull_request_review_id === e.id && (!S.who.length || S.who.includes(e.user?.login) || S.who.includes(c.user?.login)));
  const hasBody = e.body_html && e.body_html.trim();
  const byPath = {};
  cs.forEach((c) => (byPath[`${c.path}\u0000${c.original_position ?? c.position}`] ||= []).push(c));
  const all = Object.values(byPath), allRes = all.length > 0 && all.every(isRes), nres = all.filter(isRes).length, rk = 'r:' + e.id;
  const lists = S.unres ? all.filter((l) => !isRes(l)) : all;
  if (S.unres && !lists.length) return '';
  const threads = lists.map((list) => `<div class="thread${folded('t:' + list[0].id, isRes(list))}"><div class="thread-head">${foldBtn('t:' + list[0].id, 'Hide this thread', isRes(list))}${esc(list[0].path)}${isRes(list) ? '<span class="res">Resolved</span>' : ''}${(b.thread_ids || {})[list[0].id] ? `<button class="thread-act" data-thread="${esc(b.thread_ids[list[0].id])}" data-res="${isRes(list) ? 'unresolve' : 'resolve'}">${isRes(list) ? 'Unresolve' : 'Resolve conversation'}</button>` : ''}</div><div class="diffhunk">${diffHunkTable(list[0].diff_hunk || '')}</div>${list.map((c) => `<div class="tc" id="c-${esc(c.id)}"><a href="${esc(c.user.html_url)}">${avatar(c.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">${esc(c.user.login)}</span> <span>${when(c.created_at)}</span><button class="cm-btn" data-cm="${esc(c.id)}" data-root="${list[0].id}" title="Comment actions">⋯</button></div><div class="markdown-body" style="margin-top:8px">${c.body_html || ''}</div>${suggestBtn(c, b, list)}${reactionsHtml(c.reactions, 'review_comment', c.id)}</div></div>`).join('')}<div class="reply">${draftBox('reply-' + list[0].id, 'Reply…', 2)}${errLine('reply-' + list[0].id)}<button class="btn small" data-sendreply="${list[0].id}">Reply</button></div></div>`).join('');
  const sum = all.length ? `<span class="rev-sum${allRes ? ' ok' : ''}">${allRes ? icon('check') + ' All resolved' : `${all.length} thread${all.length === 1 ? '' : 's'}${nres ? ` · ${nres} resolved` : ''}`}</span>` : '';
  return `<div class="TLI rev${folded(rk, allRes)}"><div class="TLI-badge ${kind}">${icon(ic)}</div><div class="TLI-avatar">${avatar(e.user, 20)}</div><div class="TLI-body"><div class="row">${foldBtn(rk, 'Collapse / expand this review', allRes)}${user(e.user)} <span>${verb}</span> <a class="time" href="${esc(e.html_url)}">${when(e.submitted_at).replace(/<\/?span[^>]*>/g, '')}</a>${sum}</div>
  ${hasBody ? `<div class="cbox nocaret" style="margin-top:8px;color:var(--fgColor-default)"><div class="cbody"><div class="markdown-body">${e.body_html}</div></div></div>` : ''}${threads ? `<div>${threads}</div>` : ''}</div></div>`;
}

function commitRow(msg, sha, author, url, verification, trailing = '') {
  const first = String(msg || '').split('\n')[0];
  const unv = verification && !verification.verified;
  return `<div class="commit-row">${author ? `<span class="TLI-avatar" style="margin-right:8px">${avatar(author, 20)}</span>` : ''}<span class="msg" style="flex:0 1 auto"><a href="${esc(url || '#')}">${esc(first)}</a></span>${trailing}<span class="cm-ic">${icon('comment')}</span><span style="flex:1"></span>${verification ? `<span class="label-pill ${unv ? 'warn' : 'ok'}">${unv ? 'Unverified' : 'Verified'}</span>` : ''}<a class="sha" href="${esc(url || '#')}">${esc(String(sha).slice(0, 7))}</a></div>`;
}

function timeline(b) {
  const p = b.pull, out = [];
  const evUser = (e) => { const u = e.user || e.actor || e.author; return u?.login || u?.name || ''; };
  const people = new Map(), bump = (u) => { if (!u?.login) return; const r = people.get(u.login) || { u, n: 0 }; r.n++; people.set(u.login, r); };
  bump(p.user); b.timeline.forEach((e) => { if (e.event === 'commented' || e.event === 'reviewed') bump(e.user); }); b.review_comments.forEach((c) => bump(c.user));
  S.who = S.who.filter((w) => people.has(w));
  const who = S.who, on = who.length > 0;
  const byUser = on ? b.timeline.filter((e) => who.includes(evUser(e)) || (e.event === 'reviewed' && b.review_comments.some((c) => c.pull_request_review_id === e.id && who.includes(c.user?.login)))) : b.timeline;
  const keep = S.unres ? byUser.filter((e) => e.event === 'reviewed') : byUser;
  const bar = people.size > 1 ? `<div class="who-bar"><span class="who-l">${icon('person')}Show</span><button class="who-chip ${on ? '' : 'on'}" data-whoclear="1">Everyone</button>${[...people.values()].sort((x, y) => y.n - x.n).map(({ u, n }) => `<button class="who-chip ${who.includes(u.login) ? 'on' : ''}" data-who="${esc(u.login)}" title="${n} comment${n === 1 ? '' : 's'}">${avatar(u, 18)}<span>${esc(u.login)}</span><i>${n}</i></button>`).join('')}</div>` : '';
  if (!S.unres && (!on || who.includes(p.user.login))) out.push(commentBox({ ...p, created_at: p.created_at, html_url: p.html_url, reactions: p.reactions }, { isPr: true }).replace('class="tl-comment"', 'class="tl-comment" style="margin-bottom:0"'));
  // Long runs of commits collapse into one row (the Commits tab lists them), so comments stay reachable.
  const evs = [];
  for (let i = 0; i < keep.length;) {
    let j = i; while (j < keep.length && keep[j].event === 'committed') j++;
    if (j - i >= 6) { evs.push({ event: 'commit-run', n: j - i, first: keep[i], last: keep[j - 1] }); i = j; } else { evs.push(keep[i]); i++; }
  }
  const info = b.commit_info || {};
  let merged = false;
  for (const e of evs) {
    switch (e.event) {
      case 'commented': out.push(commentBox(e)); break;
      case 'commit-run': out.push(`<div class="TLI"><div class="TLI-badge">${icon('git-commit')}</div><div class="TLI-body"><div class="row"><a data-tab="commits" class="run"><b>${e.n} commits</b> <span class="mono">${esc(e.first.sha.slice(0, 7))} … ${esc(e.last.sha.slice(0, 7))}</span> · view in Commits</a></div></div></div>`); break;
      case 'reviewed': out.push(reviewBlock(e, b)); break;
      case 'committed': out.push(`<div class="TLI"><div class="TLI-badge">${icon('git-commit')}</div><div class="TLI-body">${commitRow(e.message, e.sha, info[e.sha]?.author || (e.author?.avatar_url ? e.author : null), e.html_url, e.verification)}</div></div>`); break;
      case 'referenced': {
        const ci = info[e.commit_id];
        const ml = ci ? ci.message.split('\n')[0] : '';
        const linked = esc(ml).replace(/#(\d+)/, '</a><a href="#" style="color:var(--fgColor-accent)">#$1</a><a href="#">');
        out.push(`<div class="TLI"><div class="TLI-badge">${icon('cross-reference')}</div><div class="TLI-body stack"><div class="row" style="min-height:32px">${user(e.actor)} <span>added a commit that referenced this pull request</span> <a class="time">${when(e.created_at).replace(/<\/?span[^>]*>/g, '')}</a></div>${ci ? `<div class="line2"><div class="commit-row"><span class="TLI-avatar" style="margin:0 8px 0 0">${avatar(ci.author || e.actor, 20)}</span><span class="msg" style="flex:0 1 auto"><a href="${esc(ci.html_url)}">${linked}</a></span><span class="mono" style="background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px">…</span><span class="cm-ic">${icon('comment')}</span><span style="flex:1"></span><a class="sha" href="${esc(ci.html_url)}">${esc(ci.sha.slice(0, 7))}</a></div></div>` : ''}</div></div>`);
        break;
      }
      case 'merged': merged = true; out.push(`<div class="TLI mergedrow"><div class="TLI-badge done">${icon('git-merge')}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>merged commit <b class="mono" style="color:var(--fgColor-default);font-size:12px">${esc((e.commit_id || '').slice(0, 7))}</b> into <span class="branch">${esc(p.base.label)}</span></span> <a class="time">${when(e.created_at).replace(/<\/?span[^>]*>/g, '')}</a></div></div></div>`); out.push('<div class="TLI-break"></div>'); break;
      case 'closed': if (!p.merged) out.push(simple(e, 'git-pull-request-closed', 'closed this', 'danger')); break;
      case 'reopened': out.push(simple(e, 'git-pull-request', 'reopened this', 'success')); break;
      case 'cross-referenced': {
        const i = e.source?.issue; if (!i) break;
        const isPr = !!i.pull_request;
        out.push(`<div class="TLI"><div class="TLI-badge">${icon('cross-reference')}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>mentioned this ${isPr ? 'pull request' : 'issue'}</span> <a class="time">${when(e.created_at).replace(/<\/?span[^>]*>/g, '')}</a></div>
        <div class="ref-card"><span style="color:var(--fgColor-${i.state === 'open' ? 'success' : 'done'});margin-top:2px">${icon(isPr ? (i.state === 'open' ? 'git-pull-request' : 'git-merge') : 'issue-opened')}</span><div><a class="t" href="${esc(i.html_url)}" style="color:var(--fgColor-default)">${esc(i.title.split('\n')[0].slice(0, 120))}</a><span class="r">${esc(i.repository?.full_name || '')}#${i.number}</span></div></div></div></div>`);
        break;
      }
      case 'labeled': case 'unlabeled': out.push(`<div class="TLI condensed"><div class="TLI-badge">${icon('tag')}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body">${user(e.actor)} <span>${e.event === 'labeled' ? 'added' : 'removed'}</span> <span class="pill-label" style="background:#${esc(e.label?.color)};color:#fff;margin:0">${esc(e.label?.name)}</span> <span>label</span> <a class="time">${when(e.created_at).replace(/<\/?span[^>]*>/g, '')}</a></div></div>`); break;
      case 'assigned': case 'unassigned': out.push(simple(e, 'person', `${e.event} ${e.assignee ? esc(e.assignee.login) : ''}`)); break;
      case 'review_requested': out.push(simple(e, 'eye', `requested a review from ${esc(e.requested_reviewer?.login || e.requested_team?.name || '')}`)); break;
      case 'renamed': out.push(simple(e, 'pencil', `changed the title <s>${esc(e.rename?.from)}</s> ${esc(e.rename?.to)}`)); break;
      case 'head_ref_force_pushed': out.push(simple(e, 'repo-push', 'force-pushed the head branch')); break;
      case 'head_ref_deleted': out.push(simple(e, 'git-branch', 'deleted the head branch')); break;
      case 'ready_for_review': out.push(simple(e, 'eye', 'marked this pull request as ready for review')); break;
      case 'convert_to_draft': out.push(simple(e, 'git-pull-request-draft', 'marked this pull request as draft')); break;
      case 'milestoned': out.push(simple(e, 'milestone', `added this to the ${esc(e.milestone?.title)} milestone`)); break;
      case 'locked': out.push(simple(e, 'lock', 'locked this conversation')); break;
      default: break; // subscribed, unsubscribed, mentioned: hidden by GitHub as well
    }
  }
  const foldAll = `<div class="fold-bar"><button class="btn small" id="foldallconv" title="Collapse or expand every comment, review and thread">${icon('chevron-down')} <span>Collapse all conversations</span></button></div>`;
  return `${bar}${foldAll}<div class="TL">${out.join('')}${on && out.length === 0 ? '<div class="diff-empty">Nothing from the selected accounts.</div>' : ''}</div>${on ? '' : mergeBox(b)}${mergeActions(b)}${composer(b)}`;
}
const checkState = (c) => (c.status !== 'completed' ? 'pending' : c.conclusion === 'success' ? 'pass' : ['skipped', 'neutral'].includes(c.conclusion) ? 'skip' : 'fail');
const CK = { pass: ['check-circle-fill', 'Passed'], fail: ['x-circle-fill', 'Failed'], pending: ['dot-fill', 'In progress'], skip: ['circle-slash', 'Skipped'] };
const reqBadge = (c) => ((S.bundle?.required_checks || []).includes(c.name) ? '<span class="ck-req" title="Required by branch protection">Required</span>' : '');
function checksView(b) {
  const list = (b.checks || []).map((c) => ({ ...c, st: checkState(c) }));
  if (!list.length) return '<div class="diff-empty">No checks reported for the latest commit.</div>';
  const n = (s) => list.filter((c) => c.st === s).length;
  const rank = { fail: 0, pending: 1, pass: 2, skip: 3 };
  list.sort((x, y) => rank[x.st] - rank[y.st] || String(x.name).localeCompare(String(y.name)));
  const head = n('fail') ? ['fail', `${n('fail')} failing`] : n('pending') ? ['pending', `${n('pending')} in progress`] : ['pass', 'All checks passed'];
  const dur = (c) => { const s = Date.parse(c.started_at), e = Date.parse(c.completed_at); if (!s || !e || e < s) return ''; const t = Math.round((e - s) / 1000); return t >= 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t}s`; };
  return `<div class="checks"><div class="ck-head ${head[0]}">${icon(CK[head[0]][0], 20)}<div><b>${head[1]}</b><span>${[n('fail') && `${n('fail')} failing`, n('pending') && `${n('pending')} in progress`, n('pass') && `${n('pass')} passed`, n('skip') && `${n('skip')} skipped`].filter(Boolean).join(' · ')}</span></div></div>${list.map((c) => `<a class="ck-row ${c.st}" ${c.url ? `href="${esc(c.url)}"` : ''}><span class="ck-i">${icon(CK[c.st][0])}</span><span class="ck-n"><b>${esc(c.name)}</b>${reqBadge(c)}<i>${esc(c.description || (c.app ? c.app : ''))}</i></span><span class="ck-s">${c.st === 'fail' && c.conclusion && c.conclusion !== 'failure' ? esc(c.conclusion.replace(/_/g, ' ')) : CK[c.st][1]}</span><span class="ck-d">${dur(c)}</span></a>`).join('')}</div>`;
}

function unresolvedRoots(b) {
  const res = new Set(b.resolved_ids || []);
  return b.review_comments.filter((c) => !c.in_reply_to_id && !res.has(c.id));
}
function attention(b) {
  const p = b.pull, rc = b.review_comments, roots = rc.filter((c) => !c.in_reply_to_id), open = unresolvedRoots(b);
  const known = S.hasToken || (b.resolved_ids || []).length > 0;
  const latest = new Map();
  b.timeline.filter((e) => e.event === 'reviewed' && e.user).forEach((e) => { const st = e.state.toLowerCase(); if (st === 'commented' && latest.has(e.user.login)) return; latest.set(e.user.login, st); });
  const cr = [...latest.values()].filter((s) => s === 'changes_requested').length, ap = [...latest.values()].filter((s) => s === 'approved').length;
  const ck = (b.checks || []).map(checkState), fail = ck.filter((s) => s === 'fail').length, pend = ck.filter((s) => s === 'pending').length, pass = ck.filter((s) => s === 'pass').length;
  const it = [];
  const add = (k, ic, text, attr = '') => it.push(`<button class="att-i ${k}" ${attr}>${icon(ic)}<span>${text}</span></button>`);
  if (roots.length) {
    if (!known) add('', 'comment', `${roots.length} review thread${roots.length === 1 ? '' : 's'}`);
    else if (open.length) add('bad', 'comment', `${open.length} unresolved thread${open.length === 1 ? '' : 's'}`, 'id="nextun" title="Jump to the next unresolved thread"');
    else add('ok', 'check-circle-fill', 'All threads resolved');
  }
  add(cr ? 'bad' : ap ? 'ok' : '', cr ? 'file-diff' : ap ? 'check' : 'eye', cr ? `${cr} requesting changes` : ap ? `${ap} approved` : 'No approvals yet');
  if (ck.length) add(fail ? 'bad' : pend ? 'warn' : 'ok', fail ? 'x-circle-fill' : pend ? 'dot-fill' : 'check-circle-fill', fail ? `${fail} check${fail === 1 ? '' : 's'} failing` : pend ? `${pend} check${pend === 1 ? '' : 's'} running` : `${pass} check${pass === 1 ? '' : 's'} passed`, 'data-tab="checks" title="Open checks"');
  if (p.merged) add('done', 'git-merge', 'Merged'); else if (p.state === 'closed') add('bad', 'git-pull-request-closed', 'Closed');
  else if (p.mergeable === false || p.mergeable_state === 'dirty') add('bad', 'alert', 'Has conflicts');
  else if (p.mergeable_state === 'clean') add('ok', 'git-merge', 'Ready to merge');
  else if (p.draft) add('', 'git-pull-request-draft', 'Draft');
  return `<div class="attn">${it.join('')}${roots.length ? `<span class="sp"></span><button class="att-tog ${S.unres ? 'on' : ''}" id="unres" title="Hide everything except review threads that are still open">${icon('comment')}Unresolved only</button>` : ''}</div>`;
}
function jumpUnresolved() {
  const b = S.bundle, list = unresolvedRoots(b); if (!list.length) return;
  const c = list[S.unIdx % list.length]; S.unIdx++;
  const first = b.review_comments.find((x) => x.pull_request_review_id === c.pull_request_review_id && x.path === c.path && (x.original_position ?? x.position) === (c.original_position ?? c.position)) || c;
  S.fold['r:' + c.pull_request_review_id] = false; S.fold['t:' + first.id] = false; S.fold['c:' + c.id] = false;
  localStorage.setItem('fold', JSON.stringify(S.fold));
  S.keepScroll = true; render(); S.keepScroll = false;
  const el = document.getElementById('c-' + c.id);
  if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}

function simple(e, ic, text, kind = '') {
  return `<div class="TLI"><div class="TLI-badge ${kind}">${icon(ic)}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>${text}</span> <a class="time">${when(e.created_at).replace(/<\/?span[^>]*>/g, '')}</a></div></div></div>`;
}

function mergeBox(b) {
  const p = b.pull;
  const head = p.head.label.split(':')[1];
  if (p.merged) {
    return `<div class="TL"><div class="TLI-break" style="margin-left:0"></div><div class="merge-box"><div class="badge"><span class="state-merged" style="background:var(--bgColor-done-emphasis)">${icon('git-merge')}</span></div><div class="merge-card merged-card"><div class="row"><div><h3>Pull request successfully merged and closed</h3><p style="font-size:14px;margin-top:4px">You're all set — the <span class="branch">${esc(head)}</span> branch can be safely deleted.</p></div></div></div></div></div>`;
  }
  if (p.state === 'closed') {
    return `<div class="merge-box"><div class="badge"><span class="state-closed" style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))">${icon('git-pull-request-closed')}</span></div><div class="merge-card"><div class="row"><div><h3>Closed with unmerged commits</h3><p style="font-size:14px;margin-top:4px">This pull request is closed, but the <span class="branch">${esc(head)}</span> branch has unmerged commits.</p></div></div></div></div>`;
  }
  const clean = p.mergeable_state === 'clean' || p.mergeable !== false;
  const latest = new Map();
  b.timeline.filter((e) => e.event === 'reviewed' && e.user).forEach((e) => { const st = e.state.toLowerCase(); if (st === 'commented' && latest.has(e.user.login)) return; latest.set(e.user.login, st); });
  const ap = [...latest.values()].filter((x) => x === 'approved').length, cr = [...latest.values()].filter((x) => x === 'changes_requested').length, pendRev = (p.requested_reviewers || []).length;
  const rvHead = cr ? ['bad', 'x-circle-fill', 'Changes requested', `${cr} reviewer${cr === 1 ? '' : 's'} requested changes`] : ap ? ['ok', 'check-circle-fill', 'Changes approved', `${ap} approving review${ap === 1 ? '' : 's'}`] : ['', 'eye', 'Review not yet submitted', pendRev ? `${pendRev} pending review${pendRev === 1 ? '' : 's'}` : 'No reviews yet'];
  const list = (b.checks || []).map((c) => ({ ...c, st: checkState(c) })), cnt = (k) => list.filter((c) => c.st === k).length;
  const ckHead = cnt('fail') ? ['bad', 'x-circle-fill', `${cnt('fail')} check${cnt('fail') === 1 ? '' : 's'} failing`] : cnt('pending') ? ['', 'dot-fill', `${cnt('pending')} check${cnt('pending') === 1 ? '' : 's'} in progress`] : ['ok', 'check-circle-fill', 'All checks have passed'];
  const ckSub = [cnt('skip') && `${cnt('skip')} neutral`, cnt('pass') && `${cnt('pass')} successful`, cnt('fail') && `${cnt('fail')} failing`, cnt('pending') && `${cnt('pending')} pending`].filter(Boolean).join(', ');
  const grp = (k, title) => { const g = list.filter((c) => c.st === k); if (!g.length) return ''; const open = S.mbOpen?.has('g' + k) ?? k !== 'pass';
    return `<button class="mb-grp" data-mb="g${k}">${title} ${icon(open ? 'chevron-up' : 'chevron-down', 12)}</button>${open ? g.map((c) => `<a class="mb-ck ${c.st}" ${c.url ? `href="${esc(c.url)}"` : ''}>${icon(CK[c.st][0], 14)}<b>${esc(c.name)}</b>${reqBadge(c)}<i>${esc(c.description || c.app || '')}</i></a>`).join('') : ''}`; };
  const rerunable = list.some((c) => c.st === 'fail' && /\/actions\/runs\//.test(c.url || ''));
  const sec = (k, h, body) => { const open = S.mbOpen?.has(k); return `<div class="mb-sec"><button class="mb-h ${h[0]}" data-mb="${k}"><span class="mb-ic">${icon(h[1], 22)}</span><span class="mb-t"><b>${h[2]}</b><i>${h[3] || ''}</i></span>${k === 'ck' && rerunable ? '<span class="btn small" id="rerunck" role="button">Re-run failed</span>' : ''}${icon(open ? 'chevron-up' : 'chevron-down', 16)}</button>${open && body ? `<div class="mb-body">${body}</div>` : ''}</div>`; };
  const rvBody = `<div class="mb-line">${icon('check', 14)} ${ap} approval${ap === 1 ? '' : 's'}</div>${cr ? `<div class="mb-line bad">${icon('x-circle-fill', 14)} ${cr} requested changes</div>` : ''}<div class="mb-line">${icon('person', 14)} ${pendRev} pending review${pendRev === 1 ? '' : 's'}${pendRev ? `: ${p.requested_reviewers.map((u) => esc(u.login)).join(', ')}` : ''}</div>`;
  const behind = p.mergeable_state === 'behind';
  const upd = behind ? `<div class="mb-sec mb-warn"><div class="mb-h"><span class="mb-ic">${icon('alert', 22)}</span><span class="mb-t"><b>This branch is out-of-date with the base branch</b><i>Merge the latest changes from ${esc(p.base.ref)} into this branch.</i></span><button class="btn" id="updbranch">${S.busy === 'update_branch' ? 'Updating…' : 'Update branch'}</button></div></div>` : '';
  const st = p.draft ? `<div class="mb-sec"><div class="mb-h"><span class="mb-ic">${icon('git-pull-request-draft', 22)}</span><span class="mb-t"><b>This pull request is still a work in progress</b><i>Draft pull requests cannot be merged.</i></span><button class="btn primary" id="doready">${S.busy === 'ready' ? 'Updating…' : 'Ready for review'}</button></div></div>${errLine('ready')}` : '';
  const conf = `<div class="mb-sec"><div class="mb-h ${clean ? 'ok' : 'bad'}"><span class="mb-ic">${icon(clean ? 'check-circle-fill' : 'alert', 22)}</span><span class="mb-t"><b>${clean ? 'This branch has no conflicts with the base branch' : 'This branch has conflicts that must be resolved'}</b><i>${clean ? 'Merging can be performed automatically.' : 'Use the web editor or the command line to resolve conflicts.'}</i></span></div></div>`;
  return `<div class="merge-box"><div class="badge"><span style="background:var(--bgColor-success-emphasis)">${icon('git-pull-request')}</span></div><div class="merge-card mb-card">${st}${sec('rv', rvHead, rvBody)}${list.length ? sec('ck', ckHead.concat(ckSub), grp('fail', 'Failing checks') + grp('pending', 'In progress') + grp('skip', 'Neutral checks') + grp('pass', 'Successful checks')) : ''}${upd}${conf}${errLine('update_branch')}</div></div>`;
}

function sidebar(b) {
  const p = b.pull;
  const reviewers = new Map();
  p.requested_reviewers.forEach((u) => reviewers.set(u.login, { u, st: 'req' }));
  b.timeline.filter((e) => e.event === 'reviewed').forEach((e) => { const st = e.state.toLowerCase(); const cur = reviewers.get(e.user.login); if (!cur || st === 'approved' || st === 'changes_requested' || cur.st === 'req') reviewers.set(e.user.login, { u: e.user, st }); });
  const rv = [...reviewers.values()];
  const canRe = !p.merged && p.state === 'open';
  const rvHtml = (r) => `<div class="reviewer"><a href="${esc(r.u.html_url)}">${avatar(r.u, 20)}</a><a class="nm" href="${esc(r.u.html_url)}">${esc(r.u.login)}</a><span class="st ${r.st === 'approved' ? 'ok' : r.st === 'changes_requested' ? 'bad' : ''}">${icon(r.st === 'approved' ? 'check' : r.st === 'changes_requested' ? 'file-diff' : r.st === 'req' ? 'dot-fill' : 'comment')}</span>${canRe && r.st !== 'req' && r.u.login !== p.user.login ? `<button class="rerequest" data-rerequest="${esc(r.u.login)}" title="Ask ${esc(r.u.login)} to review again">${icon('sync')}</button>` : ''}</div>`;
  const first = rv.length > 1 ? `<button class="sb-toggle" id="rvtoggle"><span>${rv.length - 0} reviewers</span>${icon(S.showAllReviewers ? 'chevron-up' : 'chevron-down')}</button>` : '';
  const rvSection = rv.length ? `${rv.length > 1 ? `<button class="sb-toggle" id="rvtoggle"><span>${rv.length} more reviewers</span>${icon(S.showAllReviewers ? 'chevron-up' : 'chevron-down')}</button>` : ''}${S.showAllReviewers || rv.length === 1 ? rv.map(rvHtml).join('') : ''}` : '<div class="sb-none">No reviews</div>';
  const people = new Map();
  [p.user, ...b.timeline.map((e) => e.user || e.actor || e.author)].forEach((u) => u && u.login && !people.has(u.login) && people.set(u.login, u));
  const labels = p.labels.length ? p.labels.map((l) => `<span class="pill-label" style="background:#${esc(l.color)}33;color:#${esc(l.color)};border-color:#${esc(l.color)}">${esc(l.name)}</span>`).join('') : '<span class="sb-none">None yet</span>';
  const assignees = p.assignees.length ? p.assignees.map((u) => `<div class="reviewer"><a href="${esc(u.html_url)}">${avatar(u, 20)}</a><a class="nm" href="${esc(u.html_url)}">${esc(u.login)}</a></div>`).join('') : '<span class="sb-none">No one—</span>';
  const head = (t) => `<div class="sb-head">${foldBtn('sb:' + t, 'Hide section')}<span>${t}</span>${icon('gear', 16, 'gear')}</div>`;
  const item = (k, inner) => `<div class="sb-item${folded('sb:' + k)}">${inner}</div>`;
  return `<div class="pr-side-inner">${item('Reviewers', `<div class="sb-head">${foldBtn('sb:Reviewers', 'Hide section')}<span>Reviewers</span></div>${rvSection}`)}
  ${item('Assignees', head('Assignees') + assignees)}
  ${item('Labels', head('Labels') + labels)}
  ${item('Milestone', head('Milestone') + (p.milestone ? `<a class="sb-link" href="${esc(p.milestone.html_url)}">${esc(p.milestone.title)}</a>` : '<span class="sb-none">No milestone</span>'))}
  <div class="sb-item${folded('sb:people')}"><div class="sb-head">${foldBtn('sb:people', 'Hide section')}<span>${people.size} participant${people.size === 1 ? '' : 's'}</span></div><div class="participants">${[...people.values()].slice(0, 30).map((u) => `<a href="${esc(u.html_url)}" title="${esc(u.login)}">${avatar(u, 32)}</a>`).join('')}</div></div></div>`;
}

// Files changed can show all commits, one commit, or a consecutive range (indices into commitList, oldest first).
const frKey = (cs, r) => r.a === r.b ? cs[r.a].sha : `${cs[r.a].parent}..${cs[r.b].sha}`;
function frDiff(b) {
  const cs = commitList(b), r = S.fr; if (!r || !cs[r.a] || !cs[r.b]) return b.files;
  return r.a === r.b ? S.cdiff[cs[r.a].sha] : S.rdiff[frKey(cs, r)];
}
async function loadFr() {
  const b = S.bundle, r = S.fr; if (!b || !r) return;
  const cs = commitList(b), single = r.a === r.b, k = frKey(cs, r), store = single ? S.cdiff : S.rdiff, repo = b.pull.base.repo.full_name;
  if (store[k] !== undefined && store[k] !== 'loading') return;
  store[k] = 'loading'; render();
  try {
    if (!tauri) throw new Error('Per-commit diffs are available in the desktop app.');
    if (!single && !cs[r.a].parent) throw new Error('This range has no parent commit to compare against.');
    store[k] = (single ? await tauri.invoke('fetch_commit', { repo, sha: k }) : await tauri.invoke('fetch_range', { repo, base: cs[r.a].parent, head: cs[r.b].sha })).files || [];
  } catch (e) { store[k] = String(e).replace(/^Error: /, ''); }
  render();
}
function setFr(r) { S.fr = r; S.dialog = ''; render(); loadFr(); }
function sinceReview(b) {
  const cs = commitList(b), mine = b.timeline.filter((e) => e.event === 'reviewed' && e.user?.login === S.me && e.commit_id);
  if (!S.me || !mine.length) return null;
  const at = cs.findIndex((c) => c.sha === mine[mine.length - 1].commit_id);
  return at < 0 ? null : { at, n: cs.length - 1 - at };
}
function commitsDialog() {
  const b = S.bundle, cs = commitList(b), pick = S.cpick || S.fr, sr = sinceReview(b);
  const on = (i) => pick && i >= pick.a && i <= pick.b;
  const rows = cs.map((c, i) => `<label class="cp-row${on(i) ? ' on' : ''}" data-cp="${i}"><input type="checkbox" ${on(i) ? 'checked' : ''} tabindex="-1"><span class="cp-t"><b>${esc(String(c.message).split('\n')[0])}</b><i>${esc(c.name || c.author?.login || '')} committed ${when(c.date).replace(/<\/?span[^>]*>/g, '')}</i></span><code>${esc(c.sha.slice(0, 7))}</code></label>`).reverse().join('');
  const q = (S.cfilter || '').toLowerCase();
  return `<div class="dlg-bg" id="dlgbg"><div class="dlg cp-dlg"><div class="cp-h"><h2>Select commits to view</h2><button class="icon-btn" id="cpx" title="Close">${icon('x')}</button></div>
  <button class="cp-opt${S.fr ? '' : ' on'}" id="cpall"><b>All commits</b><i>${cs.length} commit${cs.length === 1 ? '' : 's'}</i></button>
  ${sr ? `<button class="cp-opt${S.fr && S.fr.a === sr.at + 1 && S.fr.b === cs.length - 1 ? ' on' : ''}" id="cpsince" ${sr.n ? '' : 'disabled'}><b>Changes since your last review</b><i>${sr.n ? `${sr.n} commit${sr.n === 1 ? '' : 's'}` : 'No new commits'}</i></button>` : ''}
  <div class="cp-sub">Select a commit, or click a second one to view the range between them</div>
  <input class="input cp-q" id="cpq" placeholder="Filter commits…" value="${esc(S.cfilter || '')}">
  <div class="cp-list" id="cplist" data-q="${esc(q)}">${rows}</div>
  <div class="btns"><span class="cp-sel">${pick ? (pick.a === pick.b ? '1 commit selected' : `${pick.b - pick.a + 1} commits selected`) : 'Nothing selected'}</span><span class="sp"></span><button class="btn" id="cpcancel">Cancel</button><button class="btn primary" id="cpsave" ${pick ? '' : 'disabled'}>Save</button></div></div></div>`;
}
function openCommits() { S.cpick = S.fr ? { ...S.fr } : null; S.cfilter = ''; S.dialog = commitsDialog(); render(); }
function filesView(b) {
  const cs = commitList(b), r = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = r && r.a === r.b;
  const label = !r ? `All commits <span class="counter">${cs.length}</span>` : single ? `Commit <code>${esc(cs[r.a].sha.slice(0, 7))}</code>` : `${r.b - r.a + 1} commits <code>${esc(cs[r.a].sha.slice(0, 7))}…${esc(cs[r.b].sha.slice(0, 7))}</code>`;
  const nav = single ? `<div class="seg-ctl"><button data-fstep="-1" ${r.a <= 0 ? 'disabled' : ''}>‹ Prev</button><button data-fstep="1" ${r.a >= cs.length - 1 ? 'disabled' : ''}>Next ›</button></div>` : '';
  const bar = `<div class="fc-bar"><button class="btn small" id="fcbtn" title="Choose which commits to view">${icon('git-commit')} ${label} ▾</button>${nav}${r ? `<span class="fc-t">${single ? esc(String(cs[r.a].message).split('\n')[0]) : ''}</span><button class="link-btn" id="fcall">Show all commits</button>` : ''}</div>`;
  if (!r) return bar + filesList(b.files, true);
  const d = frDiff(b);
  return bar + (d === undefined || d === 'loading' ? '<div class="diff-empty">Loading…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d));
}
const b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === 'open';
function filesList(files, canComment = false) {
  if (!files.length) return '<div class="diff-empty">No files changed.</div>';
    const pid = S.bundle?.pull?.id;
  const hasC = (f) => (S.bundle?.review_comments || []).some((c) => c.path === f.filename) || pendList().some((p) => p.path === f.filename);
  // Big PRs open with the heavy files collapsed (like GitHub); a folded file renders no rows at all until it is opened.
  if (S.autoFoldFor !== pid) {
    S.autoFoldFor = pid; let budget = 1200;
    for (const f of files) { const n = f.additions + f.deletions, key = 'f:' + f.filename; if (key in S.fold || hasC(f)) continue; if (n > 400 || n > budget) S.fold[key] = true; else budget -= n; }
  }
  const shown = (f) => !S.fold['f:' + f.filename];
  const srt = S.fileSort || 'path', cnt = (f) => (S.bundle?.review_comments || []).filter((c) => c.path === f.filename && !c.in_reply_to_id).length;
  const so = { path: null, pathz: (x, y) => y.filename.localeCompare(x.filename), most: (x, y) => (y.additions + y.deletions) - (x.additions + x.deletions), least: (x, y) => (x.additions + x.deletions) - (y.additions + y.deletions), comments: (x, y) => cnt(y) - cnt(x), status: (x, y) => String(x.status).localeCompare(String(y.status)) || x.filename.localeCompare(y.filename) };
  if (so[srt]) files = [...files].sort(so[srt]);
  const all = files.every((f) => S.fold['f:' + f.filename]);
  return `<div class="files-bar"><div class="seg-ctl"><button class="${S.diffMode === 'unified' ? 'on' : ''}" data-dmode="unified">Unified</button><button class="${S.diffMode === 'split' ? 'on' : ''}" data-dmode="split">Split</button></div><select class="input fsort" id="fsort" title="Sort files">${[['path', 'GitHub order'], ['pathz', 'Path Z–A'], ['most', 'Most changed'], ['least', 'Least changed'], ['comments', 'Most comments'], ['status', 'By status']].map(([v, t]) => `<option value="${v}" ${srt === v ? 'selected' : ''}>${t}</option>`).join('')}</select>${pendList().length ? `<button class="btn small primary" id="finishrev">Finish review · ${pendList().length} comment${pendList().length === 1 ? '' : 's'}</button>` : ''}<button class="link-btn" data-foldall="${all ? 'open' : 'close'}" data-files="${esc(files.map((f) => f.filename).join('\n'))}">${all ? 'Expand all files' : 'Collapse all files'}</button></div>` + files.map((f, i) => {
    const t = f.additions + f.deletions || 1, a = Math.round((f.additions / t) * 5), d = Math.min(5 - a, Math.round((f.deletions / t) * 5));
    const sq = Array.from({ length: 5 }, (_, i) => `<i class="${i < a ? 'a' : i < a + d ? 'd' : ''}"></i>`).join('');
    return `<div class="file${folded('f:' + f.filename)}"><div class="file-head" data-fold="f:${esc(f.filename)}"><span class="tgl">${icon(S.fold['f:' + f.filename] ? 'chevron-right' : 'chevron-down')}</span><span class="stat"><span class="a">+${f.additions}</span> <span class="d">−${f.deletions}</span></span><span class="sq">${sq}</span><span class="path">${esc(f.filename)}</span></div>${!shown(f) ? '' : f.patch ? diffTable(f.patch, f.filename, canComment && b0open()) : '<div class="diff-empty">Binary file or diff too large to display.</div>'}</div>`;
  }).join('');
}

function commitsView(b) {
  const info = b.commit_info || {};
  const c = b.timeline.filter((e) => e.event === 'committed');
  return `<div style="border:1px solid var(--borderColor-default);border-radius:6px">${c.map((e) => `<div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">${commitRow(e.message, e.sha, e.author?.avatar_url ? e.author : null, e.html_url, e.verification)}</div>`).join('') || '<div class="diff-empty">No commits listed.</div>'}</div>`;
}

function commitList(b) {
  if (b.commits && b.commits.length) return b.commits.map((c) => ({ sha: c.sha, message: c.commit.message, author: c.author, name: c.commit.author?.name, date: c.commit.author?.date, url: c.html_url, parent: c.parents?.[0]?.sha }));
  return b.timeline.filter((e) => e.event === 'committed').map((e) => ({ sha: e.sha, message: e.message, author: e.author?.avatar_url ? e.author : null, name: e.author?.name, date: e.author?.date, url: e.html_url }));
}

S.flip = localStorage.getItem('flip') === '1';
function flipSides() { S.flip = !S.flip; localStorage.setItem('flip', S.flip ? '1' : '0'); document.querySelector('.split')?.classList.toggle('flip', S.flip); }
function splitView(b) {
  const cs = commitList(b), sha = S.sel;
  const cnt = (c) => b.review_comments.filter((r) => r.original_commit_id === c || r.commit_id === c).length;
  const row = (c) => `<div class="cm ${sha === c.sha ? 'on' : ''}" data-sha="${esc(c.sha)}"><span class="cm-av">${c.author ? avatar(c.author, 24) : `<i>${esc((c.name || '?')[0])}</i>`}</span><span class="cm-t"><b>${esc(String(c.message).split('\n')[0])}</b><i>${esc(c.name || c.author?.login || '')} · ${when(c.date).replace(/<\/?span[^>]*>/g, '')}</i></span>${cnt(c.sha) ? `<span class="cm-n">${icon('comment')}${cnt(c.sha)}</span>` : ''}<code>${esc(c.sha.slice(0, 7))}</code></div>`;
  const all = `<div class="cm all ${sha ? '' : 'on'}" data-sha=""><span class="cm-av"><i>${icon('diff')}</i></span><span class="cm-t"><b>All changes</b><i>${b.pull.changed_files} files · +${b.pull.additions} −${b.pull.deletions}</i></span></div>`;
  let diff;
  if (!sha) diff = filesList(b.files, true);
  else {
    const d = S.cdiff[sha];
    diff = d === undefined || d === 'loading' ? '<div class="diff-empty">Loading commit…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d);
  }
  const hl = S.hide.l, hr = S.hide.r;
  const rail = (k, label, ic) => `<button class="pane-rail" data-show="${k}" title="Show ${label}">${icon(ic)}<span>${label}</span></button>`;
  const left = hl ? rail('l', 'Commits', 'git-commit') : `<section class="pane pane-l"><div class="fold-sec${folded('cm-list')}"><div class="pane-h">${icon('git-commit')}<span>Commits</span><span class="counter">${cs.length}</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">⇄</button>${foldBtn('cm-list', 'Collapse commit list')}<button class="fold-btn" data-hide="l" title="Hide this panel">${icon('x')}</button></div><div class="cm-list">${all}${cs.map(row).join('')}</div></div><div class="fold-sec${folded('cm-diff')}"><div class="pane-h sub">${icon('file-diff')}<span>${sha ? 'Commit ' + esc(sha.slice(0, 7)) : 'All changes'}</span><span class="sp"></span>${foldBtn('cm-diff', 'Collapse changes')}</div><div class="pane-body">${diff}</div></div></section>`;
  const right = hr ? rail('r', 'Conversation', 'comment-discussion') : `<section class="pane pane-r"><div class="pane-h">${icon('comment-discussion')}<span>Conversation</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">⇄</button><button class="fold-btn" data-hide="r" title="Hide this panel">${icon('x')}</button></div><div class="pane-body">${attention(b)}${timeline(b)}</div></section>`;
  return `<div class="split ${hl ? 'hl' : ''} ${hr ? 'hr' : ''} ${S.flip ? 'flip' : ''}" style="--lw:${S.lw}%">${left}${hl || hr ? '' : '<div class="gutter" id="gutter" title="Drag to resize"></div>'}${right}</div>`;
}

async function selectCommit(sha) {
  S.sel = sha || null; render();
  if (!sha || S.cdiff[sha] !== undefined) return;
  S.cdiff[sha] = 'loading';
  try {
    if (!tauri) throw new Error('Per-commit diffs are available in the desktop app.');
    S.cdiff[sha] = (await tauri.invoke('fetch_commit', { repo: S.bundle.pull.base.repo.full_name, sha })).files || [];
  } catch (e) { S.cdiff[sha] = String(e).replace(/^Error: /, ''); }
  if (S.sel === sha) render();
}

// Notifications: poll watched PRs and report new comments, commits, reviews and state changes.
const snap = (p) => ({ commits: p.commits, comments: p.comments, rc: p.review_comments, state: p.merged ? 'merged' : p.state });
const seen = load('seen', {});
function noteAdd(ref, title, text, target = '') {
  { const t = S.tabs.find((x) => x.ref === ref); if (t && ref !== curRef()) { t.dot = true; saveTabs(); } }
  S.notes = [{ id: Date.now() + Math.random(), ref, title, text, target, at: new Date().toISOString(), read: false }, ...S.notes].slice(0, 200);
  localStorage.setItem('notes', JSON.stringify(S.notes));
  if (tauri) tauri.invoke('notify', { title: `${ref} · ${title}`.slice(0, 80), body: text, prRef: ref, target }).catch(() => {});
}
function noteDiff(ref, title, was, now, fresh = []) {
  const out = [], d = (a, b) => b - a;
  if (d(was.commits, now.commits) > 0) out.push(`${d(was.commits, now.commits)} new commit${d(was.commits, now.commits) > 1 ? 's' : ''}`);
  if (d(was.comments, now.comments) > 0) out.push(`${d(was.comments, now.comments)} new comment${d(was.comments, now.comments) > 1 ? 's' : ''}`);
  if (d(was.rc, now.rc) > 0) out.push(`${d(was.rc, now.rc)} new review comment${d(was.rc, now.rc) > 1 ? 's' : ''}`);
  if (was.state !== now.state) out.push(`now ${now.state}`);
  const last = fresh.filter((f) => !was.at || f.created_at > was.at).sort((x, y) => (x.created_at < y.created_at ? -1 : 1)).pop();
  if (last) out.push(`“${last.body.replace(/\s+/g, ' ').slice(0, 60)}” — ${last.user}`);
  if (out.length) noteAdd(ref, title, out.join(', '), last ? String(last.id) : '');
}
function remember(ref, p) { seen[ref] = { ...snap(p), at: p.updated_at || new Date().toISOString() }; localStorage.setItem('seen', JSON.stringify(seen)); }
let polling = false;
// Background fetch: the full PR is loaded as soon as a change is noticed, so opening it from a notification needs no wait.
// Tiny TanStack-Query-style cache: in-flight de-duplication, staleTime, stale-while-revalidate, invalidation.
const qc = {
  m: new Map(), inflight: new Map(), STALE: 30000,
  peek(k) { return this.m.get(k); },
  fresh(k, ms = this.STALE) { const e = this.m.get(k); return !!e && Date.now() - e.at < ms; },
  set(k, data) { this.m.set(k, { data, at: Date.now() }); },
  invalidate(k) { const e = this.m.get(k); if (e) e.at = 0; },
  fetch(k, fn) {
    if (this.inflight.has(k)) return this.inflight.get(k);
    const p = fn().then((d) => { this.set(k, d); return d; }).finally(() => this.inflight.delete(k));
    this.inflight.set(k, p); return p;
  },
};
const loadPr = (input) => (tauri ? tauri.invoke('fetch_pr', { url: input }) : fetch(new URL(input, location.href)).then((r) => r.json()));
function prefetch(ref) { if (tauri && !qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref)).catch(() => {}); }
async function pollNotes() {
  if (!tauri || polling) return;
  polling = true; const before = S.notes.length;
  const cur = S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : null;
  // Watch what matters without having to open it: open tabs, recent PRs, and the PRs you wrote or were asked to review (refreshed every 4 minutes).
  if (S.hasToken && Date.now() - (S.watchAt || 0) > 240000) {
    S.watchAt = Date.now();
    try { const d = await tauri.invoke('inbox', { force: false }); S.watch = [...(d.mine || []), ...(d.requested || [])].map((i) => `${i.repo}#${i.number}`); } catch { /* keep the previous list */ }
  }
  const refs = S.hasToken ? [...new Set([...S.tabs.map((t) => t.ref), ...S.recent.slice(0, 8).map((r) => r.ref), ...(S.watch || [])])].slice(0, 40) : (cur ? [cur] : []);
  for (const ref of refs) {
    const m = ref.match(/^(.+)#(\d+)$/); if (!m) continue;
    try {
      const p = await tauri.invoke('check_pr', { repo: m[1], number: +m[2], since: seen[ref]?.at || null });
      const now = snap(p);
      const n0 = S.notes.length;
      if (seen[ref]) noteDiff(ref, p.title, seen[ref], now, p.fresh);
      if (S.notes.length !== n0) prefetch(ref); // warm it now so clicking the notification is instant
      remember(ref, p);
    } catch { /* offline or rate limited: try again next round */ }
  }
  await pollBranches(refs, cur);
  polling = false; if (S.notes.length !== before && !document.activeElement?.closest?.('.tt')) render();
}

// "had recent pushes — Compare & pull request" prompts, like github.com shows for branches without a PR.
S.pushes = {}; const pushDis = load('pushdismiss', {});
const ago = (t) => { const m = Math.max(1, Math.round((Date.now() - new Date(t)) / 60000)); return m < 60 ? `${m} minute${m === 1 ? '' : 's'} ago` : `${Math.round(m / 60)} hour${m >= 90 ? 's' : ''} ago`; };
const pushList = (repo) => Object.entries(S.pushes).filter(([r]) => !repo || r === repo).flatMap(([, l]) => l).filter((p) => !pushDis[`${p.repo}@${p.branch}@${p.at}`] && Date.now() - new Date(p.at) < 6 * 3600e3);
function pushBanners(repo) {
  return pushList(repo).slice(0, 3).map((p) => `<div class="push-banner">${icon('git-branch')}<span><b>${esc(p.branch)}</b> had recent pushes ${ago(p.at)}${repo ? '' : ` <i>· ${esc(p.repo)}</i>`}</span><span class="sp"></span><button class="btn small primary" data-compare="${esc(p.repo)}@${esc(p.branch)}">Compare &amp; pull request</button><button class="push-x" data-pdismiss="${esc(`${p.repo}@${p.branch}@${p.at}`)}" title="Dismiss">${icon('x')}</button></div>`).join('');
}
async function refreshPushes(repo) {
  if (!tauri || !S.hasToken || !repo) return;
  try {
    const l = await tauri.invoke('recent_pushes', { repo }), was = JSON.stringify(S.pushes[repo] || []);
    S.pushes[repo] = l; if (JSON.stringify(l) !== was && (S.view === 'repo' || (!S.bundle && S.view !== 'newpr' && S.view !== 'inbox' && S.view !== 'notes')) && !document.activeElement?.closest?.('.tt')) rerender();
  } catch { /* no access */ }
}

// New branches pushed to repos you follow (the ones behind your recent pull requests). The first look at a repo only records its branches.
const branchSeen = load('branches', {});
async function pollBranches(refs, cur) {
  if (!S.hasToken) return;
  const repos = [...new Set([...refs, cur].filter(Boolean).map((r) => r.replace(/#\d+$/, '')))].slice(0, 6);
  for (const repo of repos) {
    try {
      const b = await tauri.invoke('list_branches', { repo }), names = b.branches || [];
      if (branchSeen[repo]) names.filter((n) => !branchSeen[repo].includes(n) && n !== b.default).forEach((n) => noteAdd(`${repo}@${n}`, repo, `New branch pushed: ${n} — click to open a pull request`, ''));
      refreshPushes(repo);
      branchSeen[repo] = names; localStorage.setItem('branches', JSON.stringify(branchSeen));
    } catch { /* no access or offline */ }
  }
}
function notePanel() {
  const rows = S.notes.map((n) => `<a class="note ${n.read ? '' : 'new'}" data-open="${esc(n.ref)}" data-target="${esc(n.target || '')}"><b>${esc(n.title)}</b><span>${esc(n.text)}</span><i>${esc(n.ref)} · ${when(n.at).replace(/<\/?span[^>]*>/g, '')}</i></a>`).join('') || '<div class="note-empty">No notifications yet. New comments, commits and reviews on PRs you opened will show up here.</div>';
  return `<div class="note-panel${S.bell ? ' open' : ''}"><div class="note-h"><b>Notifications</b><span><button id="noteall">View all</button> <button id="notecheck">Check now</button> <button id="noteclear">Clear all</button></span></div>${rows}</div>`;
}


// ---- Fun: entrance stagger, ripples, confetti ----
function enterAnim() {
  document.querySelectorAll('.tl-comment, .TLI, .thread, .sb-item, .merge-card, .composer, .pr-title-area').forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 14)); el.classList.add('enter-in'); });
  clearTimeout(enterAnim.t); enterAnim.t = setTimeout(() => document.querySelectorAll('.enter-in').forEach((el) => el.classList.remove('enter-in')), 1800);
}
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, rip = document.createElement('span');
  rip.className = 'ripple'; rip.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  b.style.overflow = 'hidden'; b.appendChild(rip); setTimeout(() => rip.remove(), 650);
  if (b.matches('.reaction, .react-add')) burst(e.clientX, e.clientY, b.textContent.trim().slice(0, 2) || '✨', 6);
});
function burst(x, y, ch, n) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span'); p.className = 'burst'; p.textContent = ch;
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.6, v = 40 + Math.random() * 50;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * v}px;--dy:${Math.sin(a) * v - 30}px`;
    document.body.appendChild(p); setTimeout(() => p.remove(), 900);
  }
}
function confetti() {
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const g = c.getContext('2d'), cols = ['#0969da', '#1f883d', '#8250df', '#f2cc60', '#cf222e', '#ff8fb1'];
  const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * cols.length) | 0] }));
  let t = 0;
  (function f() {
    g.clearRect(0, 0, c.width, c.height); t++;
    ps.forEach((p) => { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - t / 130); g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
    if (t < 130) requestAnimationFrame(f); else c.remove();
  })();
}

// ---- Keyboard shortcuts: j/k comments, r reply, [ ] unresolved threads, cmd+K quick open, ? help ----
const typing = (t) => t && (t.closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || t.isContentEditable);
const kbItems = () => [...document.querySelectorAll('.main .tl-comment, .main .tc')].filter((e) => e.offsetParent);
function kbGo(el) {
  if (!el) return;
  document.querySelectorAll('.kb').forEach((x) => x.classList.remove('kb'));
  el.classList.add('kb'); S.kbId = el.id; el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}
const kbCur = () => (S.kbId && document.getElementById(S.kbId)) || null;
function kbStep(dir, pick = kbItems) {
  const items = pick(), cur = kbCur(); if (!items.length) return;
  let i = cur ? items.indexOf(cur) : -1;
  if (i === -1 && cur) i = items.findIndex((e) => cur.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
  kbGo(items[Math.min(items.length - 1, Math.max(0, i + dir))]);
}
const openThreads = () => [...document.querySelectorAll('.main .thread')].filter((t) => !t.querySelector('.thread-head .res') && t.offsetParent).map((t) => t.querySelector('.tc')).filter(Boolean);
function openPalette() {
  if (document.querySelector('.palette')) return;
  const el = document.createElement('div'); el.className = 'dlg-bg palette';
  el.innerHTML = '<div class="dlg pal"><input class="pal-in" placeholder="Jump to a pull request — owner/repo#123, a URL, or search recent…" autofocus><div class="pal-list"></div></div>';
  document.body.appendChild(el);
  const inp = el.querySelector('input'), list = el.querySelector('.pal-list'); let sel = 0, rows = [];
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    rows = S.recent.filter((r) => !q || `${r.ref} ${r.title}`.toLowerCase().includes(q)).slice(0, 8).map((r) => ({ ref: r.ref, label: r.title, sub: r.ref }));
    if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q)) rows.unshift({ ref: inp.value.trim(), label: `Open ${inp.value.trim()}`, sub: 'Go to this pull request' });
    sel = Math.min(sel, Math.max(0, rows.length - 1));
    list.innerHTML = rows.map((r, i) => `<div class="pal-row${i === sel ? ' on' : ''}" data-i="${i}"><b>${esc(r.label)}</b><i>${esc(r.sub)}</i></div>`).join('') || '<div class="pal-none">No matches</div>';
  };
  const go = (r) => { el.remove(); if (r) { S.nav = false; S.focus = ''; openPr(r.ref); } };
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') el.remove();
    else if (e.key === 'ArrowDown') { sel = Math.min(rows.length - 1, sel + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') go(rows[sel]);
  });
  list.addEventListener('mousedown', (e) => { const r = e.target.closest('.pal-row'); if (r) go(rows[+r.dataset.i]); });
  el.addEventListener('mousedown', (e) => { if (e.target === el) el.remove(); });
  draw(); inp.focus();
}
function showHelp() {
  if (document.querySelector('.palette')) return;
  const el = document.createElement('div'); el.className = 'dlg-bg palette';
  const k = (a, b) => `<div class="kb-r"><span>${a}</span><kbd>${b}</kbd></div>`;
  el.innerHTML = `<div class="dlg pal"><h2>Keyboard shortcuts</h2>${k('Jump to any pull request', '⌘ K')}${k('Next / previous comment', 'j / k')}${k('Next / previous unresolved thread', '] / [')}${k('Reply to the selected comment', 'r')}${k('New pull request', 'n')}${k('New tab / close tab / reopen closed', '⌘T · ⌘W · ⌘⇧T')}${k('Go to tab 1–9 / next tab', '⌘1–9 · ⌃Tab')}${k('Open a PR in a new tab', '⌘-click')}${k('Turn Split view on / off', 's')}${k('Swap the two sides of Split view', 'f')}${k('Diff: unified ⇄ side-by-side', 'd')}${k('Show this help', '?')}${k('Close dialogs and menus', 'Esc')}</div>`;
  document.body.appendChild(el); el.addEventListener('mousedown', () => el.remove());
  const esc2 = (e) => { if (e.key === 'Escape') { el.remove(); removeEventListener('keydown', esc2); } }; addEventListener('keydown', esc2);
}
document.addEventListener('mousedown', (e) => { if (S.tabMenu && !e.target.closest('.pt-menu, #tabadd')) { S.tabMenu = false; rerender(); } });
document.addEventListener('keydown', (e) => {
  if (S.tabMenu && e.key === 'Escape') { S.tabMenu = false; rerender(); return; }
  if ((e.metaKey || e.ctrlKey) && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 't' && !e.shiftKey) { e.preventDefault(); S.tabMenu = !S.tabMenu; if (!S.tabs.length) S.tabMenu = true; rerender(); return; }
    if (k === 't' && e.shiftKey) { e.preventDefault(); reopenTab(); return; }
    if (k === 'w' && S.tabs.length && tabIdx() >= 0) { e.preventDefault(); closeTab(tabIdx()); return; }
    if (/^[1-9]$/.test(k) && S.tabs[+k - 1]) { e.preventDefault(); openTab(S.tabs[+k - 1].ref); return; }
    if (e.key === 'Tab' && e.ctrlKey) { e.preventDefault(); stepTab(e.shiftKey ? -1 : 1); return; }
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('.palette, .dlg-bg')) return;
  if (e.key === 'j') kbStep(1); else if (e.key === 'k') kbStep(-1);
  else if (e.key === ']') kbStep(1, openThreads); else if (e.key === '[') kbStep(-1, openThreads);
  else if (e.key === '?') showHelp();
  else if (e.key === 'n') { e.preventDefault(); openNewPr(); }
  else if (e.key === 'f' && document.querySelector('.split')) flipSides();
  else if (e.key === 's' && S.bundle) { $('#split')?.click(); }
  else if (e.key === 'd' && S.bundle) { const b = document.querySelector(`[data-dmode="${S.diffMode === 'split' ? 'unified' : 'split'}"]`); if (b) b.click(); else { S.diffMode = S.diffMode === 'split' ? 'unified' : 'split'; localStorage.setItem('diffmode', S.diffMode); } }
  else if (e.key === 'r') {
    const cur = kbCur(), host = (cur?.closest('.thread')?.querySelector('.reply .tt')) || document.querySelector('[data-draft="comment"]');
    if (!host) return; e.preventDefault(); host.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let tries = 0; const t = setInterval(() => { const pm = host.querySelector('.ProseMirror'); if (pm) { pm.focus(); clearInterval(t); } else if (++tries > 20) clearInterval(t); }, 80);
  }
});
// ---- Write actions (comment, reply, review, merge, close/reopen) ----
const peopleList = () => { const b = S.bundle; if (!b) return []; const s = new Set(); [b.pull.user, ...b.timeline.map((e) => e.user || e.actor || e.author), ...b.review_comments.map((c) => c.user)].forEach((u) => u?.login && s.add(u.login)); return [...s]; };
const drafts = load('drafts', {});
function saveDrafts() { if (!S.draftRef) return; const d = Object.fromEntries(Object.entries(S.draft).filter(([, v]) => v && v.trim())); if (Object.keys(d).length) drafts[S.draftRef] = d; else delete drafts[S.draftRef]; try { localStorage.setItem('drafts', JSON.stringify(drafts)); } catch { /* storage full */ } }
const prRef = () => ({ repo: S.bundle.pull.base.repo.full_name, number: S.bundle.pull.number });
const draftBox = (key, ph, rows = 4) => `<div class="tt" data-draft="${key}" data-ph="${esc(ph)} — type / for blocks" style="--rows:${rows}"></div>`;
const errLine = (k) => (S.actErr && S.actErr.k === k ? `<div class="act-err">${esc(S.actErr.m)}</div>` : '');

function composer(b) {
  const p = b.pull, closed = p.state === 'closed', busy = S.busy === 'comment';
  return `<div class="composer"><div class="composer-h">${icon('comment')}<b>Add a comment</b></div>${draftBox('comment', 'Write a comment… (Markdown supported)')}${errLine('comment')}
  <div class="composer-f"><span class="hint">⌘↵ to send</span><span style="flex:1"></span>
  ${p.merged ? '' : `<button class="btn ghost" id="doclose">${closed ? 'Reopen pull request' : 'Close pull request'}</button>`}
  <button class="btn primary" id="docomment" ${busy ? 'disabled' : ''}>${busy ? 'Sending…' : 'Comment'}</button></div></div>`;
}

function mergeActions(b) {
  const p = b.pull; if (p.merged || p.state === 'closed') return '';
  const busy = S.busy === 'merge', am = p.auto_merge, blocked = p.mergeable_state !== 'clean' && p.mergeable_state !== 'unstable';
  const opts = (sel) => [['merge', 'Create a merge commit'], ['squash', 'Squash and merge'], ['rebase', 'Rebase and merge']].map(([v, t]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${t}</option>`).join('');
  const cur = am ? ({ MERGE: 'merge', SQUASH: 'squash', REBASE: 'rebase' }[am.merge_method] || 'merge') : 'merge';
  if (p.draft) return `<div class="merge-act"><button class="btn ghost" id="doclose">Close pull request</button>${errLine('merge')}</div>`;
  return `<div class="merge-act"><select class="sel" id="mmethod">${opts(cur)}</select><button class="btn primary" id="domerge" ${busy ? 'disabled' : ''}>${busy ? 'Merging…' : 'Merge pull request'}</button>
  ${am ? `<button class="btn" id="noauto" title="Auto-merge is on (${esc(am.merge_method.toLowerCase())})">${S.busy === 'disable_automerge' ? 'Turning off…' : 'Disable auto-merge'}</button>` : blocked ? `<button class="btn" id="doauto" title="Merge automatically once required checks and reviews pass">${S.busy === 'automerge' ? 'Enabling…' : 'Enable auto-merge'}</button>` : ''}
  <button class="btn ghost" id="todraft" title="Mark as draft again">Convert to draft</button>${errLine('merge')}${errLine('automerge')}</div>`;
}

function reviewDialog() {
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Finish your review</h2>${draftBox('review', pendList().length ? `Leave a review comment (${pendList().length} line comment${pendList().length === 1 ? '' : 's'} will be included)` : 'Leave a review comment (required unless approving)', 5)}
  <div class="radios"><label><input type="radio" name="rev" value="COMMENT" checked> <b>Comment</b> <span>Submit general feedback without explicit approval.</span></label>
  <label><input type="radio" name="rev" value="APPROVE"> <b>Approve</b> <span>Submit feedback and approve merging these changes.</span></label>
  <label><input type="radio" name="rev" value="REQUEST_CHANGES"> <b>Request changes</b> <span>Submit feedback that must be addressed before merging.</span></label></div>
  <div id="reverr"></div><div class="btns"><button class="btn" id="revcancel">Cancel</button><button class="btn primary" id="revsubmit">Submit review</button></div></div></div>`;
  render();
  $('#revcancel').onclick = () => { S.dialog = ''; render(); };
  $('#revsubmit').onclick = async () => {
    const ev = document.querySelector('input[name=rev]:checked').value;
    const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
    const r = await act('review', { body: S.draft.review || '', event: ev, extra: lines }, 'review', true);
    if (r === undefined) return;
    delete S.draft.review; delete S.pending[pendKey()]; savePending(); S.dialog = ''; await refreshPr(); 
  };
}

function editPrDialog() {
  const p = S.bundle.pull; S.draft.prbody = p.body || '';
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit pull request</h2><label class="np-l">Title</label><input class="input" id="eptitle" value="${esc(p.title)}" style="width:100%;box-sizing:border-box;height:34px"><label class="np-l">Description</label>${draftBox('prbody', 'Describe your changes', 8)}<div id="reverr">${errLine('editpr')}</div><div class="btns"><button class="btn" id="epcancel">Cancel</button><button class="btn primary" id="epsave">Save</button></div></div></div>`;
  render();
  $('#epcancel').onclick = () => { delete S.draft.prbody; S.dialog = ''; render(); };
  $('#epsave').onclick = async () => {
    const title = $('#eptitle').value;
    const r = await act('edit', { body: S.draft.prbody ?? '', extra: { title } }, 'editpr', true);
    if (r === undefined) return;
    delete S.draft.prbody; S.dialog = ''; await refreshPr();
  };
}

// Write / Preview tabs on a rich editor; the preview is rendered by GitHub so it matches what gets posted.
function addPreview(host, key) {
  const tabs = document.createElement('div'); tabs.className = 'tt-tabs';
  tabs.innerHTML = '<button class="on" data-pv="write">Write</button><button data-pv="preview">Preview</button>';
  const pv = document.createElement('div'); pv.className = 'tt-preview markdown-body'; pv.hidden = true;
  host.prepend(tabs); host.append(pv);
  const show = async (mode) => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.pv === mode));
    const prev = mode === 'preview';
    host.querySelectorAll('.tt-bar, .tt-body').forEach((el) => { el.hidden = prev; });
    pv.hidden = !prev; host.classList.toggle('previewing', prev);
    if (!prev) { host.querySelector('.tt-content')?.focus(); return; }
    const md = (S.draft[key] || '').trim();
    if (!md) { pv.innerHTML = '<span class="empty">Nothing to preview</span>'; return; }
    pv.innerHTML = '<span class="empty">Loading preview…</span>';
    try {
      if (!tauri) throw new Error('offline');
      const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
      const html = await tauri.invoke('render_markdown', { text: md, repo });
      if (!pv.hidden) pv.innerHTML = html;
    } catch (e) { if (!pv.hidden) pv.innerHTML = `<pre class="pv-raw"></pre><div class="act-err">Couldn't render the preview (${esc(String(e).replace(/^Error: /, ''))}). Showing the raw Markdown.</div>`, pv.querySelector('.pv-raw').textContent = md; }
  };
  tabs.addEventListener('click', (e) => { const m = e.target.closest('[data-pv]')?.dataset.pv; if (m) show(m); });
}

function confirmDlg(title, text, label, danger, fn) {
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btns"><button class="btn" id="cfcancel">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfok">${esc(label)}</button></div></div></div>`;
  render();
  $('#cfcancel').onclick = () => { S.dialog = ''; render(); };
  $('#cfok').onclick = async () => { S.dialog = ''; render(); await fn(); };
}

// Runs a write action. Returns the API response, or undefined after showing an error under `key`.
// Any write action puts a spinner in the button that started it and disables it until the request settles.
document.addEventListener('click', (e) => { S.lastBtn = e.target.closest?.('button') || null; }, true);
const btnSel = (b) => { if (b.id) return '#' + b.id; const a = [...b.attributes].find((x) => x.name.startsWith('data-')); return a ? `button[${a.name}="${CSS.escape(a.value)}"]` : null; };
const setBusy = (b, on) => { if (!b) return; b.classList.toggle('is-busy', on); b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); };
// Add a reaction, or remove it when you already left it (clicking the same emoji again), like github.com.
S.mine = {}; // `${kind}:${id}` -> Promise of the Set of reactions you have left there
const getMine = (kind, rid) => (S.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke('my_reactions', { ...prRef(), kind, id: +rid }).then((l) => new Set(l)).catch(() => { delete S.mine[`${kind}:${rid}`]; return new Set(); }) : Promise.resolve(new Set()));
async function toggleReact(kind, rid, c) {
  const mine = (await getMine(kind, rid)).has(c);
  const b = S.bundle, tgt = kind === 'pr' ? b.pull : [...b.timeline, ...b.review_comments].find((x) => String(x.id) === String(rid));
  const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null, base = prev ? prev[c] || 0 : 0;
  const bump = (n) => { if (tgt) tgt.reactions = { ...(tgt.reactions || {}), [c]: Math.max(0, base + n) }; };
  bump(mine ? -1 : 1); S.refreshing = true; rerender();
  const r = await act('react', { kind, id: +rid, content: c }, 'react');
  if (r === undefined) { if (tgt && prev) tgt.reactions = prev; S.refreshing = false; rerender(); return; }
  const set = await getMine(kind, rid); r.added === false ? set.delete(c) : set.add(c);
  await refreshPr(kind === 'pr' ? '' : rid);
}
async function act(action, args, key, inDialog = false) {
  const btn = S.lastBtn && document.contains(S.lastBtn) ? S.lastBtn : null; S.busySel = btn ? btnSel(btn) : null; setBusy(btn, true);
  try { return await act2(action, args, key, inDialog); } finally { S.busySel = null; setBusy(btn, false); }
}
async function act2(action, args, key, inDialog = false) {
  S.actErr = '';
  if (!tauri) { S.actErr = { k: key, m: 'Writing needs the desktop app.' }; if (inDialog) $('#reverr').innerHTML = `<div class="act-err">${S.actErr.m}</div>`; else render(); return undefined; }
  S.busy = key; if (!inDialog) render();
  try {
    const r = action === 'react' ? await tauri.invoke('toggle_reaction', { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri.invoke('pr_action', { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
    S.busy = ''; if (action === 'merge' || (action === 'review' && args.event === 'APPROVE')) confetti(); return r ?? {};
  } catch (e) {
    S.busy = ''; S.actErr = { k: key, m: String(e).replace(/^Error: /, '') };
    if (inDialog) { const el = $('#reverr'); if (el) el.innerHTML = `<div class="act-err">${esc(S.actErr.m)}</div>`; } else render();
    return undefined;
  }
}
const refreshPr = (focus = '') => { qc.invalidate(`${prRef().repo}#${prRef().number}`); saveDrafts(); S.focus = focus ? String(focus) : ''; return openPr(`${prRef().repo}#${prRef().number}`, { nav: true, keepTab: true }); };

function cmAction(id, root, how) {
  const b = S.bundle, c = [...b.timeline, ...b.review_comments].find((x) => String(x.id) === String(id)) || (String(b.pull.id) === String(id) ? b.pull : null); if (!c) return;
  if (how === 'link') return navigator.clipboard?.writeText(c.html_url || '');
  if (how === 'md') return navigator.clipboard?.writeText(c.body || '');
  const key = root ? 'reply-' + root : 'comment', q = (c.body || '').split('\n').map((l) => '> ' + l).join('\n');
  S.draft[key] = (S.draft[key] ? S.draft[key] + '\n\n' : '') + `@${(c.user || c.actor || {}).login || ''}\n\n${q}\n\n`;
  saveDrafts(); S.eds = []; S.keepScroll = true; render(); S.keepScroll = false;
  setTimeout(() => document.querySelector(`[data-draft="${key}"]`)?.scrollIntoView({ block: 'center' }), 50);
}
// Show a just-posted comment from the API reply instead of re-fetching the whole PR.
function addLocal(kind, r, rootId) {
  const b = S.bundle; if (!b || !r || !r.id || !r.body_html) return false;
  if (kind === 'commented') b.timeline.push({ ...r, event: 'commented', actor: r.user });
  else { const root = b.review_comments.find((c) => c.id === rootId); if (!root) return false; b.review_comments.push({ ...r, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position }); }
  qc.set(`${prRef().repo}#${prRef().number}`, b); qc.invalidate(`${prRef().repo}#${prRef().number}`); qc.m.get(`${prRef().repo}#${prRef().number}`).at = Date.now() - 20000;
  S.focus = ''; S.keepScroll = true; render(); S.keepScroll = false;
  const el = document.getElementById('c-' + r.id); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash', 'pop-in'); }
  return true;
}
// Opening/closing the drawer only toggles a class — no page redraw, so nothing underneath moves.
function setBell(open) {
  S.bell = open;
  $('.note-panel')?.classList.toggle('open', open);
  if (!open && S.notes.some((n) => !n.read)) {
    S.notes.forEach((n) => (n.read = true)); saveNotes();
    document.querySelectorAll('.note-panel .note.new').forEach((el) => el.classList.remove('new'));
    $('#bell .dot')?.remove();
  }
}
// Click outside (or Esc) closes the notifications drawer; opening it marks everything read, as closing via the bell does.
document.addEventListener('mousedown', (e) => {
  if (!S.bell || e.target.closest('.note-panel, #bell')) return;
  setBell(false);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.bell) setBell(false); });
const rerender = () => { S.keepScroll = true; render(); S.keepScroll = false; };
function bindWrite() {
  document.querySelectorAll('.cm-btn').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation(); document.querySelector('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop cm-pop';
    pop.innerHTML = '<button data-h="link">Copy link</button><button data-h="md">Copy Markdown</button><button data-h="quote">Quote reply</button>';
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left - 100, innerWidth - 180) + 'px'; pop.style.top = r.bottom + 4 + 'px';
    pop.onclick = (ev) => { const h = ev.target.dataset.h; if (h) { pop.remove(); cmAction(btn.dataset.cm, btn.dataset.root, h); } };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
  }));
  document.querySelectorAll('.tt[data-draft]').forEach((host) => {
    const key = host.dataset.draft;
    if (!window.createEditor) { host.innerHTML = '<div class="act-err">Editor failed to load.</div>'; return; }
    const send = () => (key === 'comment' ? $('#docomment') : key === 'lc' ? $('#lcadd') : key === 'newpr' ? $('#npcreate') : key.startsWith('reply-') ? document.querySelector(`[data-sendreply="${key.slice(6)}"]`) : $('#revsubmit'))?.click();
    const mount = () => { (S.eds ||= []).push(window.createEditor(host, { value: S.draft[key] || '', placeholder: host.dataset.ph, people: peopleList(), onChange: (md) => { S.draft[key] = md; saveDrafts(); }, onSubmit: send })); addPreview(host, key); };
    // Editors are heavy: build each one only when its box is near the viewport.
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); if (host.isConnected) mount(); } }, { rootMargin: '300px' });
    io.observe(host);
  });
  document.querySelectorAll('[data-rerequest]').forEach((b) => b.addEventListener('click', async (e) => {
    e.stopPropagation(); b.disabled = true; b.classList.add('spin');
    const r = await act('rerequest', { body: b.dataset.rerequest }, 'rerequest'); if (r === undefined) { b.disabled = false; b.classList.remove('spin'); alert(S.actErr?.m || 'Could not re-request review.'); return; }
    await refreshPr();
  }));
  document.querySelectorAll('[data-thread]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    // Optimistic: flip the thread locally right away, sync with GitHub in the background, undo on failure.
    const b = S.bundle, node = btn.dataset.thread, root = Object.keys(b.thread_ids || {}).find((k) => b.thread_ids[k] === node);
    const ids = [Number(root), ...b.review_comments.filter((c) => String(c.in_reply_to_id) === String(root)).map((c) => c.id)].filter(Boolean);
    const prev = [...(b.resolved_ids || [])], res = btn.dataset.res === 'resolve';
    b.resolved_ids = res ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x));
    rerender();
    const r = await act(btn.dataset.res, { body: node }, 'thread', true);
    if (r === undefined) { b.resolved_ids = prev; rerender(); alert(S.actErr?.m || 'Could not update the thread.'); return; }
    refreshPr();
  }));
  document.querySelectorAll('[data-sug]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation(); const b = S.bundle, c = b.review_comments.find((x) => String(x.id) === btn.dataset.sug); if (!c) return;
    confirmDlg('Apply suggestion?', `This commits the change to ${c.path} on ${b.pull.head.ref}.`, 'Commit suggestion', false, async () => {
      (S.applied ||= new Set()).add(String(c.id)); rerender();
      const r = await act('suggest', { extra: { head_repo: b.pull.head.repo.full_name, branch: b.pull.head.ref, path: c.path, line: c.line, start_line: c.start_line || null, text: sugOf(c) } }, 'sug', true);
      if (r === undefined) { S.applied.delete(String(c.id)); rerender(); alert(S.actErr?.m || 'Could not apply the suggestion.'); return; }
      refreshPr().finally(() => { S.applied.delete(String(c.id)); });
    });
  }));
  document.querySelectorAll('[data-dmode]').forEach((b) => b.addEventListener('click', () => { S.diffMode = b.dataset.dmode; localStorage.setItem('diffmode', S.diffMode); S.keepScroll = true; render(); S.keepScroll = false; }));
  document.querySelectorAll('[data-lc]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.lcOpen = b.dataset.lc; S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 200); }));
  $('#lccancel')?.addEventListener('click', () => { S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#lcsuggest')?.addEventListener('click', (ev) => {
    const cur = (S.draft.lc || '').trimEnd(); S.draft.lc = `${cur}${cur ? '\n\n' : ''}\`\`\`suggestion\n${ev.currentTarget.dataset.code}\n\`\`\`\n`; saveDrafts();
    S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 150);
  });
  $('#lcadd')?.addEventListener('click', () => {
    const body = (S.draft.lc || '').trim(); if (!body || !S.lcOpen) return;
    const [path, side, line] = S.lcOpen.split('\u001f'); (S.pending[pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body }); savePending();
    S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false;
  });
  document.querySelectorAll('[data-lcdel]').forEach((b) => b.addEventListener('click', () => { S.pending[pendKey()] = pendList().filter((c) => String(c.id) !== b.dataset.lcdel); savePending(); S.keepScroll = true; render(); S.keepScroll = false; }));
  $('#finishrev')?.addEventListener('click', reviewDialog);
  $('#docomment')?.addEventListener('click', async () => {
    const r = await act('comment', { body: S.draft.comment || '' }, 'comment'); if (r === undefined) return;
    delete S.draft.comment; if (!addLocal('commented', r)) await refreshPr(r.id);
  });
  document.querySelectorAll('[data-sendreply]').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.sendreply, r = await act('reply', { id: +id, body: S.draft['reply-' + id] || '' }, 'reply-' + id); if (r === undefined) return;
    delete S.draft['reply-' + id]; if (!addLocal('reply', r, +id)) await refreshPr(r.id);
  }));
  document.querySelectorAll('.react-add').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation(); document.querySelector('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop';
    pop.innerHTML = REACTS.map(([k, em]) => `<button data-c="${k}">${em}</button>`).join('');
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left, innerWidth - 300) + 'px'; pop.style.top = Math.min(r.bottom + 4, innerHeight - 60) + 'px';
    document.body.appendChild(pop);
    pop.addEventListener('click', (ev) => { const c = ev.target.closest('[data-c]')?.dataset.c; if (!c) return; pop.remove(); toggleReact(btn.dataset.rk, btn.dataset.rid, c); });
    setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }), 0);
  }));
  document.querySelectorAll('.rc-btn').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rck, el.dataset.rcid)));
  document.querySelectorAll('.react-add').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rk, el.dataset.rid)));
  document.querySelectorAll('.rc-btn').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); toggleReact(el.dataset.rck, el.dataset.rcid, el.dataset.rcc); }));
  $('#doclose')?.addEventListener('click', () => {
    const closed = S.bundle.pull.state === 'closed';
    confirmDlg(closed ? 'Reopen this pull request?' : 'Close this pull request?', closed ? 'It will be open for review again.' : 'It will be closed without merging. You can reopen it later.', closed ? 'Reopen' : 'Close pull request', !closed, async () => { const r = await act(closed ? 'reopen' : 'close', {}, 'close'); if (r !== undefined) await refreshPr(); });
  });
  document.querySelectorAll('[data-mb]').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('#rerunck')) return; S.mbOpen = S.mbOpen || new Set(); const k = el.dataset.mb; S.mbOpen.has(k) ? S.mbOpen.delete(k) : S.mbOpen.add(k); rerender(); }));
  $('#rerunck')?.addEventListener('click', async (e) => { e.stopPropagation(); const urls = (S.bundle.checks || []).filter((c) => checkState(c) === 'fail' && c.url).map((c) => c.url); setBusy(e.currentTarget, true); const r = await act('rerun', { extra: urls }, 'rerun'); if (r !== undefined) { S.actErr = null; await refreshPr(); } else setBusy(e.currentTarget, false); });
  $('#updbranch')?.addEventListener('click', async () => { const r = await act('update_branch', {}, 'update_branch'); if (r !== undefined) await refreshPr(); });
  $('#doready')?.addEventListener('click', async () => { const r = await act('ready', {}, 'ready'); if (r !== undefined) await refreshPr(); });
  $('#todraft')?.addEventListener('click', () => confirmDlg('Convert to draft?', 'Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.', 'Convert to draft', false, async () => { const r = await act('draft', {}, 'merge'); if (r !== undefined) await refreshPr(); }));
  $('#doauto')?.addEventListener('click', async () => { const r = await act('automerge', { method: $('#mmethod').value }, 'automerge'); if (r !== undefined) await refreshPr(); });
  $('#noauto')?.addEventListener('click', async () => { const r = await act('disable_automerge', {}, 'automerge'); if (r !== undefined) await refreshPr(); });
  $('#editpr')?.addEventListener('click', editPrDialog);
  $('#domerge')?.addEventListener('click', () => {
    const m = $('#mmethod').value, p = S.bundle.pull, names = { merge: 'merge commit', squash: 'squash and merge', rebase: 'rebase and merge' };
    confirmDlg('Merge this pull request?', `${p.head.label} will be merged into ${p.base.label} using ${names[m]}. This changes the repository and cannot be undone from here.`, 'Merge', false, async () => { const r = await act('merge', { method: m }, 'merge'); if (r !== undefined) await refreshPr(); });
  });
  $('#review')?.addEventListener('click', reviewDialog);
}

function homePage() {
  const tab = S.homeTab || 'repos', owner = S.homeOwner || '';
  const tabs = `<div class="np-tabs"><button class="${tab === 'repos' ? 'sel' : ''}" data-htab="repos">${icon('repo')} Repositories${S.repos ? `<span>${S.repos.filter((r) => !owner || r.full_name.startsWith(owner + '/')).length}</span>` : ''}</button><button class="${tab === 'recent' ? 'sel' : ''}" data-htab="recent">${icon('clock')} Recent<span>${S.recent.length}</span></button></div>`;
  let body;
  if (tab === 'recent') {
    const q = (S.recentFilter || '').toLowerCase(), st = S.recentState || 'all';
    const list = S.recent.filter((r) => (st === 'all' || r.state === st) && (!q || (r.title + ' ' + r.ref).toLowerCase().includes(q)));
    const bar = S.recent.length ? `<div class="hm-fbar"><input class="input hm-filter" id="hmrfilter" placeholder="Filter by title or repo…" value="${esc(S.recentFilter || '')}"><div class="seg-ctl">${['all', 'open', 'merged', 'closed'].map((x) => `<button class="${st === x ? 'on' : ''}" data-rstate="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>` : '';
    body = bar + (list.length ? `<div class="hm-grid">${list.map((r) => `<a class="hm-card" data-open="${esc(r.ref)}"><span class="rc-i ${r.state}">${icon(r.icon)}</span><span class="hm-t"><b>${esc(r.title)}</b><i>${esc(r.ref)}</i></span><button class="rc-x" data-rm="${esc(r.ref)}" title="Remove">${icon('x')}</button></a>`).join('')}</div>` : `<div class="diff-empty">${S.recent.length ? 'No matching pull requests.' : 'Pull requests you open appear here.'}</div>`);
  }
  else if (!S.hasToken) body = '<div class="diff-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="btn primary" id="addtoken">Add token</button></div>';
  else if (S.reposErr) body = `<div class="diff-empty err">${esc(S.reposErr)}</div>`;
  else if (!S.repos) body = '<div class="spinner" style="margin:48px auto">Loading repositories…</div>';
  else {
    const f = (S.repoFilter || '').toLowerCase();
    const vis = S.hmVis || 'all', srt = S.hmSort || 'pushed', grp = S.hmGroup || 'none';
    let list = S.repos.filter((r) => (!owner || r.full_name.startsWith(owner + '/')) && r.full_name.toLowerCase().includes(f) && (vis === 'all' || (vis === 'private') === !!r.private));
    const nm = (r) => r.full_name.split('/')[1], pushed = (r) => Date.parse(r.pushed_at || 0) || 0;
    const sorters = { name: (a, b) => nm(a).localeCompare(nm(b)), namez: (a, b) => nm(b).localeCompare(nm(a)), issues: (a, b) => (b.open_issues_count || 0) - (a.open_issues_count || 0) || nm(a).localeCompare(nm(b)), oldest: (a, b) => pushed(a) - pushed(b), owner: (a, b) => a.full_name.localeCompare(b.full_name), ownerz: (a, b) => b.full_name.split('/')[0].localeCompare(a.full_name.split('/')[0]) || nm(a).localeCompare(nm(b)) };
    if (sorters[srt]) list = [...list].sort(sorters[srt]);
    const card = (r) => `<a class="hm-card" data-repo="${esc(r.full_name)}"><span class="rc-i" style="color:var(--fgColor-muted)">${icon(r.private ? 'lock' : 'repo')}</span><span class="hm-t"><b>${esc(r.full_name.split('/')[1])}</b><i>${esc(r.full_name.split('/')[0])}${r.archived ? ' · archived' : ''}${r.open_issues_count ? ` · ${r.open_issues_count} open` : ''}</i>${r.description ? `<em>${esc(r.description)}</em>` : ''}</span></a>`;
    let grid;
    if (!list.length) grid = '<div class="diff-empty">No matching repositories.</div>';
    else if (grp === 'owner') { const by = new Map(); list.forEach((r) => { const o = r.full_name.split('/')[0]; if (!by.has(o)) by.set(o, []); by.get(o).push(r); }); grid = [...by].map(([o, rs]) => `<h3 class="hm-grp">${esc(o)}<span>${rs.length}</span></h3><div class="hm-grid">${rs.map(card).join('')}</div>`).join(''); }
    else grid = `<div class="hm-grid">${list.map(card).join('')}</div>`;
    const opt = (v, cur, t) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`;
    body = `<div class="hm-fbar"><input class="input hm-filter" id="hmfilter" placeholder="Find a repository…" value="${esc(S.repoFilter || '')}"><div class="seg-ctl">${['all', 'public', 'private'].map((x) => `<button class="${vis === x ? 'on' : ''}" data-hvis="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div><select class="input" id="hmsort" title="Sort">${opt('pushed', srt, 'Recently pushed')}${opt('oldest', srt, 'Least recently pushed')}${opt('name', srt, 'Name A–Z')}${opt('namez', srt, 'Name Z–A')}${opt('owner', srt, 'Owner A–Z')}${opt('ownerz', srt, 'Owner Z–A')}${opt('issues', srt, 'Most open issues')}</select><select class="input" id="hmgroup" title="Group">${opt('none', grp, 'No grouping')}${opt('owner', grp, 'Group by owner')}</select></div>` + grid;
  }
  return `<div class="notes-page hm-page"><div class="np-head"><h1>${icon('home')} ${owner ? esc(owner) : 'Home'}</h1></div>
  <p class="hm-hint">Open a pull request: type <code>owner/repo#123</code> or paste a URL in the bar above.</p>${pushBanners() ? `<div class="push-wrap">${pushBanners()}</div>` : ''}${S.error ? `<div class="err">${esc(S.error)}</div>` : ''}${tabs}${body}</div>`;
}
function landing() {
  return `<div class="landing">${pushBanners() ? `<div class="push-wrap">${pushBanners()}</div>` : ''}${icon('git-pull-request', 24).replace('width="24" height="24"', 'width="40" height="40"')}<h1>Open a pull request</h1><p>Type <code>owner/repo#123</code> or paste a pull request URL in the bar above.<br>Shortcuts: ⌘L address bar · ⌘R reload · ⌘[ ⌘] history</p>${S.error ? `<div class="err">${esc(S.error)}</div>` : ''}</div>`;
}

const saveNotes = () => localStorage.setItem('notes', JSON.stringify(S.notes));
function notesPage() {
  const f = S.nf || 'all', unread = S.notes.filter((n) => !n.read).length;
  const list = S.notes.filter((n) => f === 'all' || (f === 'unread' ? !n.read : n.read));
  const rows = list.map((n) => `<div class="np-row ${n.read ? '' : 'new'}"><button class="np-dot" data-nread="${n.id}" title="${n.read ? 'Mark as unread' : 'Mark as read'}"></button>
    <a class="np-main" data-open="${esc(n.ref)}" data-target="${esc(n.target || '')}" data-note="${n.id}"><b>${esc(n.title)}</b><span>${esc(n.text)}</span><i>${esc(n.ref)} · ${when(n.at).replace(/<\/?span[^>]*>/g, '')}</i></a>
    <button class="np-act" data-nread="${n.id}">${n.read ? 'Mark unread' : 'Mark read'}</button><button class="np-act del" data-ndel="${n.id}" title="Delete">${icon('x')}</button></div>`).join('')
    || `<div class="note-empty np-empty">${f === 'unread' ? 'You are all caught up.' : f === 'read' ? 'Nothing read yet.' : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}</div>`;
  return `<div class="notes-page"><div class="np-head"><h1>${icon('bell')} Notifications</h1><div class="np-tools"><button class="btn small" id="npcheck">Check now</button><button class="btn small" id="npreadall" ${unread ? '' : 'disabled'}>Mark all as read</button><button class="btn small ghost" id="npclear" ${S.notes.length ? '' : 'disabled'}>Clear all</button></div></div>
  <div class="np-tabs">${[['all', 'All', S.notes.length], ['unread', 'Unread', unread], ['read', 'Read', S.notes.length - unread]].map(([k, l, c]) => `<button class="${f === k ? 'sel' : ''}" data-nf="${k}">${l}<span>${c}</span></button>`).join('')}</div>
  <div class="np-list">${rows}</div></div>`;
}

// ---- Inbox: PRs that need you ----
async function loadInbox(force = false) {
  S.inbox = S.inbox || { data: null, err: '', loading: true };
  S.inbox.loading = true; S.inbox.err = ''; render();
  try { S.inbox.data = tauri ? await tauri.invoke('inbox', { force }) : { requested: [], mine: [], ready: [] }; }
  catch (e) { S.inbox.err = String(e).replace(/^Error: /, ''); }
  S.inbox.loading = false; S.keepScroll = true; render(); S.keepScroll = false;
}

// ---- New pull request ----
const npHuman = (s) => s.replace(/^[a-z]+\//i, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
function newPrPage() {
  const n = S.np, repos = (S.repos || []).filter((r) => !r.archived), br = n.branches[n.repo];
  const opts = (list, cur) => list.map((x) => `<option value="${esc(x)}" ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const repoSel = repos.length ? `<select class="sel" id="nprepo">${opts(repos.map((r) => r.full_name), n.repo)}${repos.some((r) => r.full_name === n.repo) ? '' : `<option selected>${esc(n.repo || 'Choose a repository')}</option>`}</select>` : `<input class="input" id="nprepoin" placeholder="owner/repo" value="${esc(n.repo)}">`;
  const same = n.base && n.base === n.head;
  const cmp = n.cmp === 'loading' ? '<span class="np-note">Comparing…</span>' : !n.cmp ? '' : typeof n.cmp === 'string' ? `<span class="np-note err">${esc(n.cmp)}</span>`
    : n.cmp.ahead_by ? `<span class="np-note ok">${icon('git-commit')} ${n.cmp.ahead_by} commit${n.cmp.ahead_by === 1 ? '' : 's'} · ${n.cmp.files} file${n.cmp.files === 1 ? '' : 's'} changed${n.cmp.behind_by ? ` · ${n.cmp.behind_by} behind ${esc(n.base)}` : ''}</span>` : '<span class="np-note err">These branches are identical — there is nothing to compare.</span>';
  const ready = n.title.trim() && n.repo && n.base && n.head && !same && n.cmp && typeof n.cmp === 'object' && n.cmp.ahead_by > 0;
  return `<div class="notes-page np-new"><div class="np-head"><h1>${icon('git-pull-request')} New pull request</h1></div>
  <div class="np-card">
    <label class="np-l">Repository</label>${repoSel}
    <div class="np-branches"><div><label class="np-l">Base <i>merge into</i></label><select class="sel" id="npbase" ${br ? '' : 'disabled'}>${br ? opts(br.branches, n.base) : '<option>Loading…</option>'}</select></div>
      <button class="tb-btn" id="npswap" title="Swap base and head">⇄</button>
      <div><label class="np-l">Head <i>changes from</i></label><select class="sel" id="nphead" ${br ? '' : 'disabled'}>${br ? opts(br.branches, n.head) : '<option>Loading…</option>'}</select></div></div>
    <div class="np-cmp">${same ? '<span class="np-note err">Base and head are the same branch.</span>' : cmp}</div>
    <label class="np-l">Title</label><input class="input" id="nptitle" placeholder="Title" value="${esc(n.title)}">
    <label class="np-l">Description</label>${draftBox('newpr', 'Describe your changes', 8)}
    ${npMeta(n)}
    <label class="np-check"><input type="checkbox" id="npdraft" ${n.draft ? 'checked' : ''}> Create as draft <span>(not ready for review yet)</span></label>
    ${n.err ? `<div class="act-err">${esc(n.err)}</div>` : ''}
    <div class="np-btns"><button class="btn" id="npcancel">Cancel</button><button class="btn primary" id="npcreate" ${ready ? '' : 'disabled'}>${n.draft ? 'Create draft pull request' : 'Create pull request'}</button></div>
  </div></div>`;
}
// Reviewers / assignees / labels / milestone / linked issues pickers
function npMeta(n) {
  const m = n.meta?.[n.repo]; if (!m) return '';
  const ppl = m.people.map((x) => x.login), me = S.me || '';
  const chips = (k, label) => `<span class="np-chip" data-npdel="${k}" data-v="${esc(label)}" title="Remove">${esc(label)} ×</span>`;
  const add = (k, title, list) => { const free = list.filter((x) => !n[k].includes(x)); return free.length ? `<select class="sel np-add" data-npadd="${k}"><option value="">${title}</option>${free.map((x) => `<option>${esc(x)}</option>`).join('')}</select>` : ''; };
  const row = (k, name, list) => `<div class="np-meta"><label class="np-l">${name}</label><div class="np-chips">${n[k].map((x) => chips(k, x)).join('')}${add(k, `Add ${name.toLowerCase()}…`, list)}</div></div>`;
  return `<div class="np-metas">${row('reviewers', 'Reviewers', ppl.filter((x) => x !== me))}${row('assignees', 'Assignees', ppl)}${row('labels', 'Labels', m.labels.map((x) => x.name))}
    <div class="np-meta"><label class="np-l">Milestone</label><select class="sel" id="npmile"><option value="">None</option>${m.milestones.map((x) => `<option value="${x.number}" ${String(n.milestone) === String(x.number) ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select></div>
    <div class="np-meta"><label class="np-l">Linked issues <i>closed when this merges</i></label><input class="input" id="npissues" placeholder="e.g. 12, 15" value="${esc(n.issues)}"></div></div>`;
}
async function npLoadMeta(repo) {
  const n = S.np; if (!repo || !tauri || n.meta[repo]) return;
  try { n.meta[repo] = await tauri.invoke('repo_meta', { repo }); } catch { n.meta[repo] = { people: [], labels: [], milestones: [] }; }
  if (S.np === n) rerender();
}
async function npLoadBranches(repo) {
  const n = S.np; npLoadMeta(repo); if (!repo || n.branches[repo]) return npPickDefaults();
  if (!tauri) { n.err = 'Creating pull requests needs the desktop app.'; return render(); }
  try { n.branches[repo] = await tauri.invoke('list_branches', { repo }); n.err = ''; } catch (e) { n.err = String(e).replace(/^Error: /, ''); n.branches[repo] = { default: '', branches: [] }; }
  npPickDefaults();
}
function npPickDefaults() {
  const n = S.np, b = n.branches[n.repo]; if (!b) return render();
  if (!b.branches.includes(n.base)) n.base = b.default || b.branches[0] || '';
  if (!b.branches.includes(n.head) || n.head === n.base) n.head = b.branches.find((x) => x !== n.base) || '';
  npCompare();
}
async function npCompare() {
  const n = S.np; n.cmp = null;
  if (!n.repo || !n.base || !n.head || n.base === n.head) return rerender();
  const key = `${n.repo}|${n.base}|${n.head}`; n.key = key; n.cmp = 'loading'; rerender();
  try {
    const r = await tauri.invoke('compare_branches', { repo: n.repo, base: n.base, head: n.head }); if (S.np.key !== key) return;
    n.cmp = r;
    if (!n.titleTouched) n.title = r.commits.length === 1 ? r.commits[0] : npHuman(n.head);
  } catch (e) { if (S.np.key !== key) return; n.cmp = String(e).replace(/^Error: /, ''); }
  rerender();
}
function openNewPr(repo, head) {
  const cur = (typeof repo === 'string' && repo) || S.bundle?.pull.base.repo.full_name || S.repo || '';
  S.view = 'newpr'; S.nav = false; S.np = { repo: cur, base: '', head: (typeof head === 'string' && head) || '', branches: {}, meta: {}, reviewers: [], assignees: [], labels: [], milestone: '', issues: '', cmp: null, title: '', titleTouched: false, draft: false, err: '', key: '' };
  delete S.draft.newpr; render();
  if (tauri && !S.repos) loadRepos().then(() => { if (!S.np.repo && S.repos?.[0]) S.np.repo = S.repos[0].full_name; npLoadBranches(S.np.repo); }); else npLoadBranches(cur);
}

function openInbox() { S.view = 'inbox'; S.nav = false; render(); if (!S.inbox?.data || !qc.fresh('inbox', 45000)) { qc.set('inbox', 1); loadInbox(); } }
function inboxPage() {
  const I = S.inbox || { loading: true }, d = I.data;
  const row = (p) => { const ref = `${p.repo}#${p.number}`, was = seen[ref]?.at, fresh = was && p.updated_at > was;
    return `<a class="ib-row" data-open="${esc(ref)}"><img src="${esc(p.avatar)}" alt=""><span class="ib-t"><b>${esc(p.title)}</b><i>${esc(ref)} · ${esc(p.user)} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}${p.draft ? ' · Draft' : ''}</i></span>${fresh ? '<span class="ib-new">New activity</span>' : ''}${p.comments ? `<span class="ib-c">${icon('comment')} ${p.comments}</span>` : ''}</a>`; };
  const sec = (title, sub, list) => `<section class="ib-sec"><h2>${title}<span>${list.length}</span></h2><p>${sub}</p>${list.length ? list.map(row).join('') : '<div class="ib-none">Nothing here. Nice.</div>'}</section>`;
  const body = I.err ? `<div class="diff-empty err">${esc(I.err)}</div>` : !d ? '<div class="skel"><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>'
    : sec('Review requested', 'Waiting on you', d.requested) + sec('Ready to merge', 'Your approved pull requests', d.ready) + sec('Your pull requests', 'Open PRs you opened', d.mine);
  return `<div class="notes-page"><div class="np-head"><h1>${icon('checklist')} Inbox</h1><div class="np-tools"><button class="btn small" id="ibrefresh" ${I.loading ? 'disabled' : ''}>${I.loading ? 'Loading…' : 'Refresh'}</button></div></div>${body}</div>`;
}

function page() {
  const b = S.bundle;
  if (S.loading) return `<div class="skel" aria-busy="true"><div class="sk sk-crumb"></div><div class="sk sk-title"></div><div class="sk sk-pill"></div><div class="sk sk-line w60"></div><div class="sk-tabs"><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>${[0, 1, 2].map((i) => `<div class="sk-row" style="--i:${i}"><div class="sk sk-av"></div><div class="sk-card"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div></div>`).join('')}</div>`;
  if (S.view === 'newpr') return crumbs(S.np?.repo, [{ t: 'New pull request' }]) + newPrPage();
  if (S.view === 'inbox') return crumbs('', [{ t: 'Inbox' }]) + inboxPage();
  if (S.view === 'notes') return crumbs('', [{ t: 'Notifications' }]) + notesPage();
  if (S.view === 'repo') return crumbs(S.repo, [{ t: 'Pull requests' }]) + prList();
  if (S.view === 'home' || !b) return crumbs('', S.homeOwner ? [{ t: S.homeOwner }] : []) + homePage();
  if (S.split && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') return `<div class="pr-page is-split">${repoHeader(b.pull)}${prHeader(b)}${splitView(b)}</div>`;
  const body = S.tab === 'files' ? filesView(b) : S.tab === 'commits' ? commitsView(b) : S.tab === 'checks' ? checksView(b) : S.tab === 'timeline' ? `<div class="rail">${timeline(b)}</div>` : attention(b) + timeline(b);
  const side = S.tab !== 'conversation' ? '' : S.hide.side ? `<button class="pane-rail side-rail" data-show="side" title="Show details">${icon('columns')}<span>Details</span></button>` : `<aside class="pr-side"><div class="side-top"><span>Details</span><button class="fold-btn" data-hide="side" title="Hide this panel">${icon('x')}</button></div>${sidebar(b)}</aside>`;
  return `<div class="pr-page">${repoHeader(b.pull)}${prHeader(b)}<div class="pr-layout"><main class="pr-main">${body}</main>${side}</div></div>`;
}

// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
const needSignIn = () => (tauri && S.authChecked && !S.hasToken) || new URLSearchParams(location.search).get('gate') === '1';
function gateHtml() {
  return `<div class="gate"><div class="gate-card"><img src="logo.png" alt="" width="72" height="72"><h1>Sign in to Pullscope</h1>
  <p class="gate-err">${icon('alert')} No GitHub sign-in or token was found.</p>
  <p>Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing.</p>
  ${S.gateErr ? `<p class="gate-err">${esc(S.gateErr)}</p>` : ''}
  <div class="btns" style="justify-content:center"><button class="btn primary" id="gatego">Sign in with GitHub</button><button class="btn" id="gatetok">Use a token instead</button></div>
  <small>Tip: running <code>gh auth login</code> in a terminal also works.</small></div></div>`;
}
function render() {
  applyMode();
  if (needSignIn()) {
    (S.eds || []).forEach((e) => e.destroy()); S.eds = []; S.lastHtml = '';
    $('#app').innerHTML = `${gateHtml()}${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}`;
    $('#gatego')?.addEventListener('click', () => { tokenDialog(); setTimeout(() => $('#oauthgo')?.click(), 50); });
    $('#gatetok')?.addEventListener('click', tokenDialog);
    bindTokenDialog(); return;
  }
  const html = `${S.refreshing ? '<div class="refreshing-bar"></div>' : ''}${toolbar()}${offlineBar()}${tabStrip()}<div class="shell ${S.nav ? 'nav-open' : ''} ${S.hide.nav ? 'nav-hidden' : ''}" style="--sbw:${S.sbw}px">${sideRecent()}<div class="sb-grip" id="sbgrip" title="Drag to resize · double-click to reset"></div><div class="scrim" id="scrim"></div><div class="main">${S.mainStub ? '' : page()}</div></div>${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}${notePanel()}`;
  const scroll = $('.main')?.scrollTop || 0;
  const viewKey = () => `${S.bundle?.pull?.id ?? ''}|${S.tab}|${$('.main > *')?.className ?? ''}`, before = viewKey();
  const same = () => viewKey() === before;
  // Anchor on the first element with an id that is on screen, so a redraw keeps *it* where it was
  // (heights above the viewport can change between renders, which made the view creep upward).
  let anchor = null;
  { const mn = $('.main'); if (mn) { const top = mn.getBoundingClientRect().top; for (const el of mn.querySelectorAll('[id]')) { const r = el.getBoundingClientRect(); if (r.bottom > top + 4) { anchor = { id: el.id, off: r.top - top }; break; } } } }
  const inner = true ? [...document.querySelectorAll('.pane-body, .cm-list, .sb-list')].map((e) => [e.parentElement.className + e.className, e.scrollTop]) : [];
  if (html === S.lastHtml && $('#app').firstElementChild && !S.fadeMain) return;
  (S.eds || []).forEach((e) => e.destroy()); S.eds = [];
  $('#app').innerHTML = html; S.lastHtml = html;
  document.querySelectorAll('.sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement.className + e.className); if (m) e.scrollTop = m[1]; });
  if (S.keepScroll || same()) { $('.main').scrollTop = scroll; if (anchor) { const el = document.getElementById(anchor.id), mn = $('.main'); if (el) mn.scrollTop += el.getBoundingClientRect().top - mn.getBoundingClientRect().top - anchor.off; } document.querySelectorAll('.pane-body, .cm-list, .sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement.className + e.className); if (m) e.scrollTop = m[1]; }); }
  bind(); bindTokenDialog();
  if (S.fadeMain) { S.fadeMain = false; $('.main')?.classList.add('tab-in'); }
  if (S.busy && S.busySel) setBusy($(S.busySel), true);
  syncUnread();
  // A re-render (fresh data arriving) must not wipe the highlight of the comment we just jumped to.
  if (S.flashId && Date.now() < S.flashUntil) document.getElementById('c-' + S.flashId)?.classList.add('flash'); else S.flashId = '';
  document.title = S.bundle ? `${S.bundle.pull.title} · ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : 'GitHub PR View';
}

const go = (n) => { const t = S.hi + n; if (t < 0 || t >= S.hist.length) return; S.hi = t; (S.hist[t].startsWith('repo:') ? openRepo(S.hist[t].slice(5), { nav: true }) : openPr(S.hist[t], { nav: true })); };
function focusAddr() { const i = $('#addrinput'); i?.focus(); i?.select(); }
const avUrl = (u, n) => `${u}${u.includes('?') ? '&' : '?'}s=${n}`;
function loadProfile() {
  if (!tauri) return;
  tauri.invoke('viewer_profile').then((p) => { S.me = p.login; S.profile = p; try { localStorage.setItem('profile', JSON.stringify(p)); } catch { /* storage full */ } render(); }).catch(() => {});
}
const openExternal = (url) => (tauri ? tauri.invoke('open_external', { url }) : window.open(url, '_blank'));

// Opening a PR that already has a tab goes to that tab instead of making another page.
function openFromList(ref, newTab) {
  const have = S.tabs.some((t) => t.ref === ref);
  if (have && !S.focus) { if (ref === curRef()) { S.tabMenu = false; return; } return openTab(ref); }
  return newTab ? openTab(ref, { newTab: true }) : openPr(ref);
}
function bindSticky() {
  const ta = $('.pr-title-area'), tb = $('.pr-tabs');
  if (ta && tb && !$('.is-split')) { const io = new IntersectionObserver(([en]) => tb.classList.toggle('stuck', !en.isIntersecting && en.boundingClientRect.bottom < 0), { root: $('.main'), threshold: 0 }); io.observe(ta); S.ios.push(io); }
}

// Browser-style tabs: leaving a PR tab keeps its page (DOM, scroll, open editors) alive; coming back swaps it in with no redraw.
S.alive = new Map();
const aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join('|');
function stashCurrent() { S.openSeq = (S.openSeq || 0) + 1;
  const ref = S.view === 'pr' && S.bundle ? curRef() : '', m = $('.main');
  if (!ref || !m || !m.firstElementChild || !S.tabs.some((t) => t.ref === ref)) return;
  S.alive.set(ref, { el: m, eds: S.eds || [], bundle: S.bundle, tab: S.tab, key: aliveKey(), scroll: m.scrollTop });
  S.eds = [];
  while (S.alive.size > 6) S.alive.delete(S.alive.keys().next().value);
}
function fastTab(ref) { S.openSeq = (S.openSeq || 0) + 1;
  const a = S.alive.get(ref); if (!a) return false;
  const mem = qc.peek(ref);
  if (!mem || mem.data !== a.bundle || a.key !== aliveKey()) { S.alive.delete(ref); return false; }
  tabSnap(); stashCurrent(); S.alive.delete(ref);
  const p = a.bundle.pull;
  S.view = 'pr'; S.bundle = a.bundle; S.tab = a.tab; S.sel = null; S.fr = null; S.error = ''; S.loading = false; S.refreshing = false; S.tabPending = ''; S.tabMenu = false;
  localStorage.setItem('last', ref);
  const ti = S.tabs.find((t) => t.ref === ref); if (ti) { ti.dot = false; saveTabs(); }
  if (S.repo !== p.base.repo.full_name) { S.repo = p.base.repo.full_name; S.sideTab = 'prs'; setTimeout(loadPrs, 0); }
  if (S.draftRef !== ref) { saveDrafts(); S.draftRef = ref; S.draft = { ...(drafts[ref] || {}) }; }
  S.mainStub = true; render(); S.mainStub = false;
  $('.main').replaceWith(a.el);
  a.el.scrollTop = a.scroll; S.eds = a.eds;
  bindSticky();
  // Quietly check for newer data; only redraw if something actually changed.
  if (!qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref)).then((d) => {
    if (JSON.stringify(d) === JSON.stringify(a.bundle)) { qc.m.set(ref, { data: a.bundle, at: Date.now() }); return; }
    if (curRef() === ref) openPr(ref, { keepTab: true, nav: true });
  }).catch(() => {});
  return true;
}
function bind() {
  bindWrite();
  document.querySelectorAll('[data-side]').forEach((el) => el.addEventListener('click', () => { S.sideTab = el.dataset.side; render(); }));
  $('#mainfilter')?.addEventListener('input', (e) => { S.pf = e.target.value; const p = e.target.selectionStart; render(); const n = $('#mainfilter'); n.focus(); n.setSelectionRange(p, p); });
  [['#pfauthor', 'pAuthor'], ['#pflabel', 'pLabel'], ['#pfstatus', 'pStatus']].forEach(([id, k]) => $(id)?.addEventListener('change', (e) => { S[k] = e.target.value; render(); }));
  $('#pfsort')?.addEventListener('change', (e) => { S.psort = e.target.value; localStorage.setItem('psort', S.psort); render(); });
  $('#pfclear')?.addEventListener('click', () => { S.pf = S.pAuthor = S.pLabel = S.pStatus = ''; render(); });
  $('#prfilter')?.addEventListener('input', (e) => { S.pf = e.target.value; const p = e.target.selectionStart; render(); const n = $('#prfilter'); n.focus(); n.setSelectionRange(p, p); });
  $('#prsort')?.addEventListener('change', (e) => { S.psort = e.target.value; localStorage.setItem('psort', S.psort); render(); });
  $('#prgroup')?.addEventListener('change', (e) => { S.pgroup = e.target.value; localStorage.setItem('pgroup', S.pgroup); render(); });
  document.querySelectorAll('[data-sps]').forEach((el) => el.addEventListener('click', () => { S.prState = el.dataset.sps; loadPrs(); }));
  $('#upd')?.addEventListener('click', async () => {
    const u = S.update; if (!u || u.busy) return; u.busy = true; render();
    try { await u.obj.downloadAndInstall(); await window.__TAURI__.process.relaunch(); }
    catch (e) { u.busy = false; S.actErr = 'Update failed: ' + String(e); render(); }
  });
  $('#addtoken')?.addEventListener('click', tokenDialog);
  document.querySelectorAll('[data-hvis]').forEach((b) => b.addEventListener('click', () => { S.hmVis = b.dataset.hvis; render(); }));
  $('#hmsort')?.addEventListener('change', (e) => { S.hmSort = e.target.value; render(); });
  $('#hmgroup')?.addEventListener('change', (e) => { S.hmGroup = e.target.value; render(); });
  $('#fcbtn')?.addEventListener('click', openCommits);
  $('#fcall')?.addEventListener('click', () => setFr(null));
  document.querySelectorAll('[data-fstep]').forEach((el) => el.addEventListener('click', () => { const cs = commitList(S.bundle), i = (S.fr?.a ?? 0) + Number(el.dataset.fstep); if (cs[i]) setFr({ a: i, b: i }); }));
  if ($('.cp-dlg')) {
    const close = () => { S.dialog = ''; S.cpick = null; render(); };
    $('#cpx').onclick = close; $('#cpcancel').onclick = close; $('#cpall').onclick = () => setFr(null);
    $('#dlgbg').addEventListener('mousedown', (e) => { if (e.target.id === 'dlgbg') close(); });
    $('#cpsince') && ($('#cpsince').onclick = () => { const sr = sinceReview(S.bundle); if (sr?.n) setFr({ a: sr.at + 1, b: commitList(S.bundle).length - 1 }); });
    $('#cpsave').onclick = () => { if (S.cpick) setFr({ ...S.cpick }); };
    const filt = () => { const q = ($('#cpq').value || '').toLowerCase(); S.cfilter = q; document.querySelectorAll('.cp-row').forEach((r) => { r.hidden = !!q && !r.textContent.toLowerCase().includes(q); }); };
    $('#cpq').addEventListener('input', filt); filt();
    document.querySelectorAll('.cp-row').forEach((row) => row.addEventListener('click', (e) => {
      e.preventDefault(); const i = Number(row.dataset.cp), p = S.cpick;
      S.cpick = !p || (p.a !== p.b) ? { a: i, b: i } : { a: Math.min(p.a, i), b: Math.max(p.b, i) };
      const keep = $('#cplist').scrollTop; S.dialog = commitsDialog(); render(); const l = $('#cplist'); if (l) l.scrollTop = keep;
    }));
  }
  $('#fsort')?.addEventListener('change', (e) => { S.fileSort = e.target.value; rerender(); });
  $('#hmrfilter')?.addEventListener('input', (e) => { S.recentFilter = e.target.value; const p = e.target.selectionStart; render(); const n = $('#hmrfilter'); n.focus(); n.setSelectionRange(p, p); });
  document.querySelectorAll('[data-rstate]').forEach((b) => b.addEventListener('click', () => { S.recentState = b.dataset.rstate; render(); }));
  $('#hmfilter')?.addEventListener('input', (e) => { S.repoFilter = e.target.value; const p = e.target.selectionStart; render(); const n = $('#hmfilter'); n.focus(); n.setSelectionRange(p, p); });
  $('#repofilter')?.addEventListener('input', (e) => { S.repoFilter = e.target.value; const p = e.target.selectionStart; render(); const n = $('#repofilter'); n.focus(); n.setSelectionRange(p, p); });
  document.querySelectorAll('[data-home]').forEach((el) => el.addEventListener('click', () => { S.view = 'home'; S.homeOwner = ''; S.nav = false; render(); }));
  document.querySelectorAll('[data-owner]').forEach((el) => el.addEventListener('click', () => { S.view = 'home'; S.homeOwner = el.dataset.owner; S.homeTab = 'repos'; S.nav = false; render(); if (S.hasToken && !S.repos) loadRepos(); }));
  document.querySelectorAll('[data-htab]').forEach((el) => el.addEventListener('click', () => { S.homeTab = el.dataset.htab; render(); }));
  document.querySelectorAll('[data-repo]').forEach((el) => el.addEventListener('click', () => openRepo(el.dataset.repo)));
  document.querySelectorAll('[data-ps]').forEach((el) => el.addEventListener('click', () => { S.prState = el.dataset.ps; openRepo(S.repo, { nav: true }); }));
  $('#back')?.addEventListener('click', () => go(-1));
  $('#fwd')?.addEventListener('click', () => go(1));
  $('#reload')?.addEventListener('click', reload);
  $('#external')?.addEventListener('click', () => openExternal(S.bundle.pull.html_url));
  $('#mode')?.addEventListener('click', (e) => {
    const btn = e.currentTarget, r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    S.mode = isDark() ? 'light' : 'dark'; localStorage.setItem('mode', S.mode);
    const swap = () => { applyMode(); btn.classList.toggle('dark', isDark()); btn.setAttribute('aria-checked', isDark()); btn.title = `Switch to ${isDark() ? 'light' : 'dark'} mode`; };
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    if (!document.startViewTransition) { swap(); return; }
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('vt');
    document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }).finished.finally(() => document.documentElement.classList.remove('vt')));
  });
  $('#addr')?.addEventListener('submit', (e) => { e.preventDefault(); openPr($('#addrinput').value); $('#addrinput').blur(); });
  $('#signin')?.addEventListener('click', tokenDialog);
  $('#profbtn')?.addEventListener('click', (e) => {
    e.stopPropagation(); const had = document.querySelector('.prof-pop'); document.querySelector('.react-pop')?.remove(); if (had) return;
    const pr = S.profile, pop = document.createElement('div'); pop.className = 'react-pop cm-pop prof-pop';
    pop.innerHTML = `<div class="pp-h"><img src="${esc(avUrl(pr.avatar_url, 80))}" alt=""><div><b>${esc(pr.name || pr.login)}</b><i>@${esc(pr.login)}</i></div></div><button data-h="profile">${icon('link-external')} Your GitHub profile</button><button data-h="token">${icon('key')} Access token…</button><button data-h="out" class="danger">Sign out</button>`;
    const r = e.currentTarget.getBoundingClientRect(); pop.style.right = Math.max(8, innerWidth - r.right) + 'px'; pop.style.top = r.bottom + 6 + 'px';
    pop.onclick = async (ev) => {
      const h = ev.target.closest('[data-h]')?.dataset.h; if (!h) return; pop.remove();
      if (h === 'profile') openExternal(pr.html_url); else if (h === 'token') tokenDialog();
      else { try { await tauri?.invoke('set_token', { token: '' }); } catch { /* ignore */ } S.hasToken = false; S.profile = null; S.me = ''; S.repos = null; try { localStorage.removeItem('profile'); } catch { /* ignore */ } render(); }
    };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
  });
  document.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', (e) => { if (e.target.closest('[data-rm], .np-act, .np-dot')) return; S.nav = false; S.focus = el.dataset.target || ''; const nn = el.dataset.note && S.notes.find((x) => String(x.id) === el.dataset.note); if (nn) { nn.read = true; saveNotes(); } if (e.metaKey || e.ctrlKey) { e.preventDefault(); openFromList(el.dataset.open, true); } else openFromList(el.dataset.open, false); }));
  document.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); openFromList(el.dataset.open, true); } }));
  document.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('contextmenu', (e) => {
    e.preventDefault(); e.stopPropagation(); document.querySelector('.react-pop')?.remove();
    const ref = el.dataset.open, pop = document.createElement('div'); pop.className = 'react-pop cm-pop';
    pop.innerHTML = '<button data-h="new">Open in new tab</button><button data-h="here">Open</button><button data-h="link">Copy link</button>';
    pop.style.left = Math.min(e.clientX, innerWidth - 180) + 'px'; pop.style.top = Math.min(e.clientY, innerHeight - 120) + 'px';
    pop.onclick = (ev) => { const h = ev.target.dataset.h; if (!h) return; pop.remove(); if (h === 'new') openFromList(ref, true); else if (h === 'here') openFromList(ref, false); else { const m = ref.match(/^(.+)#(\d+)$/); navigator.clipboard?.writeText(m ? `https://github.com/${m[1]}/pull/${m[2]}` : ref).catch(() => {}); } };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
  }));
  document.querySelectorAll('.ptab').forEach((el) => { el.addEventListener('click', (e) => { if (e.target.closest('.pt-x')) return; const t = S.tabs[+el.dataset.tab]; if (t.ref !== curRef()) { if (fastTab(t.ref)) return; stashCurrent(); tabSnap(); S.fadeMain = true; S.tabMenu = false; openPr(t.ref, { nav: true, restore: t.tab }); } }); el.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); closeTab(+el.dataset.tab); } }); });
  // Drag a tab sideways to reorder (pointer based, so it also works where the webview swallows HTML5 drag and drop).
  document.querySelectorAll('.ptab').forEach((el) => el.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('.pt-x')) return;
    const from = +el.dataset.tab, x0 = e.clientX; let moved = false, to = from;
    const strip = el.parentElement, tabs = [...strip.querySelectorAll('.ptab')];
    const mv = (ev) => {
      if (!moved && Math.abs(ev.clientX - x0) < 6) return;
      if (!moved) { moved = true; el.classList.add('drag'); document.body.classList.add('dragging'); }
      el.style.transform = `translateX(${ev.clientX - x0}px)`;
      to = tabs.reduce((best, t, i) => { const r = t.getBoundingClientRect(); return ev.clientX > r.left + r.width / 2 ? i : best; }, 0);
      tabs.forEach((t, i) => { if (t !== el) t.style.transform = from < to && i > from && i <= to ? `translateX(-${el.offsetWidth}px)` : from > to && i < from && i >= to ? `translateX(${el.offsetWidth}px)` : ''; });
    };
    const up = () => {
      removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging');
      if (!moved) return;
      el.addEventListener('click', (c) => c.stopImmediatePropagation(), { capture: true, once: true });
      if (to !== from) { const [t] = S.tabs.splice(from, 1); S.tabs.splice(to, 0, t); saveTabs(); }
      render();
    };
    addEventListener('mousemove', mv); addEventListener('mouseup', up);
  }));
  document.querySelectorAll('.pt-x').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); closeTab(+el.dataset.tabx); }));
  { const m = $('.pt-menu'), a = $('#tabadd'); if (m && a) { const r = a.getBoundingClientRect(); m.style.top = r.bottom + 4 + 'px'; m.style.left = Math.min(r.left, innerWidth - 350) + 'px'; m.style.marginTop = '0'; } }
  $('#tabadd')?.addEventListener('click', (e) => { e.stopPropagation(); S.tabMenu = !S.tabMenu; rerender(); });
  document.querySelectorAll('[data-tabnew]').forEach((el) => el.addEventListener('click', () => openFromList(el.dataset.tabnew, true)));
  $('[data-tabhome]')?.addEventListener('click', () => { S.tabMenu = false; S.view = 'home'; render(); });
  $('[data-tabreopen]')?.addEventListener('click', () => { S.tabMenu = false; reopenTab(); });
  document.querySelectorAll('[data-rm]').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); S.recent = S.recent.filter((r) => r.ref !== el.dataset.rm); localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent)); S.keepScroll = true; render(); S.keepScroll = false; }));
  document.querySelectorAll('[data-tab]:not(.ptab)').forEach((a) => a.addEventListener('click', () => { S.tab = a.dataset.tab; render(); $('.main').scrollTop = 0; }));
  $('#bell')?.addEventListener('click', (e) => { e.stopPropagation(); setBell(!S.bell); });
  $('#retry')?.addEventListener('click', (ev) => { setBusy(ev.currentTarget, true); S.offline = navigator.onLine === false; reload(); });
  document.querySelectorAll('[data-compare]').forEach((b) => b.addEventListener('click', () => { const [repo, br] = b.dataset.compare.split('@'); openNewPr(repo, br); }));
  document.querySelectorAll('[data-pdismiss]').forEach((b) => b.addEventListener('click', () => { pushDis[b.dataset.pdismiss] = 1; localStorage.setItem('pushdismiss', JSON.stringify(pushDis)); rerender(); }));
  $('#newprbtn')?.addEventListener('click', () => openNewPr());
  $('#npcancel')?.addEventListener('click', () => { S.view = S.bundle ? 'pr' : 'home'; delete S.draft.newpr; render(); });
  const npSet = (f) => { f(); S.np.key = `${S.np.repo}|${S.np.base}|${S.np.head}`; };
  $('#nprepo')?.addEventListener('change', (e) => { npSet(() => { S.np.repo = e.target.value; S.np.base = ''; S.np.head = ''; S.np.cmp = null; S.np.titleTouched = false; S.np.title = ''; }); render(); npLoadBranches(S.np.repo); });
  $('#nprepoin')?.addEventListener('change', (e) => { npSet(() => { S.np.repo = e.target.value.trim(); S.np.base = ''; S.np.head = ''; }); npLoadBranches(S.np.repo); });
  $('#npbase')?.addEventListener('change', (e) => { npSet(() => { S.np.base = e.target.value; }); npCompare(); });
  $('#nphead')?.addEventListener('change', (e) => { npSet(() => { S.np.head = e.target.value; S.np.titleTouched = false; }); npCompare(); });
  $('#npswap')?.addEventListener('click', () => { npSet(() => { [S.np.base, S.np.head] = [S.np.head, S.np.base]; }); npCompare(); });
  $('#nptitle')?.addEventListener('input', (e) => { S.np.title = e.target.value; S.np.titleTouched = true; const ok = S.np.title.trim() && S.np.cmp && typeof S.np.cmp === 'object' && S.np.cmp.ahead_by > 0 && S.np.base !== S.np.head; const b = $('#npcreate'); if (b && !b.classList.contains('is-busy')) b.disabled = !ok; });
  $('#npdraft')?.addEventListener('change', (e) => { S.np.draft = e.target.checked; const b = $('#npcreate'); if (b) b.textContent = S.np.draft ? 'Create draft pull request' : 'Create pull request'; });
  document.querySelectorAll('[data-npadd]').forEach((el) => el.addEventListener('change', (e) => { if (e.target.value) { S.np[el.dataset.npadd].push(e.target.value); rerender(); } }));
  document.querySelectorAll('[data-npdel]').forEach((el) => el.addEventListener('click', () => { const k = el.dataset.npdel; S.np[k] = S.np[k].filter((x) => x !== el.dataset.v); rerender(); }));
  $('#npmile')?.addEventListener('change', (e) => { S.np.milestone = e.target.value; });
  $('#npissues')?.addEventListener('input', (e) => { S.np.issues = e.target.value; });
  $('#npcreate')?.addEventListener('click', async (e) => {
    const n = S.np, btn = e.currentTarget; setBusy(btn, true); n.err = '';
    try {
      const nums = [...new Set((n.issues.match(/\d+/g) || []))];
      const body = ((S.draft.newpr || '').trim() + (nums.length ? `\n\n${nums.map((x) => `Closes #${x}`).join('\n')}` : '')).trim();
      const extra = { reviewers: n.reviewers, assignees: n.assignees, labels: n.labels, milestone: n.milestone ? Number(n.milestone) : null };
      const r = await tauri.invoke('create_pr', { repo: n.repo, base: n.base, head: n.head, title: n.title, body, draft: n.draft, extra });
      const warn = r.warnings?.length ? `Created, but ${r.warnings.join(' · ')}` : '';
      delete S.draft.newpr; saveDrafts(); S.np = null; confetti(); await openPr(`${n.repo}#${r.number}`, { nav: true }); if (warn) { S.actErr = { k: 'comment', m: warn }; rerender(); }
    } catch (err) { setBusy(btn, false); n.err = String(err).replace(/^Error: /, ''); rerender(); }
  });
  $('#inboxbtn')?.addEventListener('click', openInbox);
  $('#ibrefresh')?.addEventListener('click', () => loadInbox(true));
  $('#noteall')?.addEventListener('click', () => { S.bell = false; S.view = 'notes'; S.nav = false; render(); });
  $('#npcheck')?.addEventListener('click', () => pollNotes());
  $('#npreadall')?.addEventListener('click', () => { S.notes.forEach((n) => (n.read = true)); saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#npclear')?.addEventListener('click', () => { S.notes = []; saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; });
  document.querySelectorAll('[data-nf]').forEach((b) => b.addEventListener('click', () => { S.nf = b.dataset.nf; S.keepScroll = true; render(); S.keepScroll = false; }));
  document.querySelectorAll('[data-nread]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const n = S.notes.find((x) => String(x.id) === b.dataset.nread); if (n) { n.read = !n.read; saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; } }));
  document.querySelectorAll('[data-ndel]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.notes = S.notes.filter((x) => String(x.id) !== b.dataset.ndel); saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; }));
  $('#notecheck')?.addEventListener('click', () => pollNotes());
  $('#noteclear')?.addEventListener('click', () => { S.notes = []; localStorage.setItem('notes', '[]'); S.keepScroll = true; render(); S.keepScroll = false; });
  document.querySelectorAll('.note-panel [data-open]').forEach((el) => el.addEventListener('click', () => { S.bell = false; S.notes.forEach((n) => (n.read = true)); localStorage.setItem('notes', JSON.stringify(S.notes)); }));
  const keep = (fn) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };
  // Folding only flips a class and the chevron: no redraw, so the scroll position and images stay put.
  { const els = [...document.querySelectorAll('.TL [data-fold]')], l = $('#foldallconv span'); if (l && els.length && els.every((x) => isFolded(x.dataset.fold, x.dataset.def === '1'))) l.textContent = 'Expand all conversations'; }
  $('#foldallconv')?.addEventListener('click', () => {
    const els = [...document.querySelectorAll('.TL [data-fold]')]; if (!els.length) return;
    const now = els.some((x) => !isFolded(x.dataset.fold, x.dataset.def === '1'));
    els.forEach((x) => {
      S.fold[x.dataset.fold] = now;
      const box = x.closest('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'); if (box) box.classList.toggle('folded', now);
      const svg = x.querySelector('svg'); if (svg) svg.outerHTML = icon(now ? 'chevron-right' : 'chevron-down');
    });
    try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* storage full */ }
    $('#foldallconv span').textContent = now ? 'Expand all conversations' : 'Collapse all conversations';
  });
  document.querySelectorAll('[data-fold]').forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation(); if (e.target.closest('a')) return;
    const k = el.dataset.fold, now = !isFolded(k, el.dataset.def === '1'); S.fold[k] = now; localStorage.setItem('fold', JSON.stringify(S.fold));
    document.querySelectorAll('[data-fold]').forEach((x) => {
      if (x.dataset.fold !== k) return;
      const box = x.closest('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'); if (box) box.classList.toggle('folded', now);
      const svg = x.querySelector('svg'); if (svg) svg.outerHTML = icon(now ? 'chevron-right' : 'chevron-down');
    });
    if (!now && k.startsWith('f:')) { const fb = el.closest('.file'); if (fb && !fb.querySelector('table.diff, .diff-empty')) { rerender(); return; } }
    if (now) return;
    // Opened: make sure the block is on screen (only scroll when part of it is cut off).
    const box = el.closest('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'), main = $('.main'); if (!box || !main || !main.contains(box)) return;
    const r = box.getBoundingClientRect(), m = main.getBoundingClientRect();
    if (r.bottom > m.bottom - 8 || r.top < m.top) box.scrollIntoView({ block: r.height > m.height * 0.85 ? 'start' : 'center', behavior: 'smooth' });
  }));
  document.querySelectorAll('[data-foldall]').forEach((el) => el.addEventListener('click', () => keep(() => { el.dataset.files.split('\n').forEach((n) => { S.fold['f:' + n] = el.dataset.foldall === 'close'; }); localStorage.setItem('fold', JSON.stringify(S.fold)); })));
  document.querySelectorAll('[data-hide]').forEach((el) => el.addEventListener('click', () => keep(() => { S.hide[el.dataset.hide] = true; localStorage.setItem('hide', JSON.stringify(S.hide)); })));
  document.querySelectorAll('[data-show]').forEach((el) => el.addEventListener('click', () => keep(() => { S.hide[el.dataset.show] = false; localStorage.setItem('hide', JSON.stringify(S.hide)); })));
  document.querySelectorAll('[data-who]').forEach((el) => el.addEventListener('click', () => keep(() => { const w = el.dataset.who; S.who = S.who.includes(w) ? S.who.filter((x) => x !== w) : [...S.who, w]; })));
  document.querySelectorAll('[data-whoclear]').forEach((el) => el.addEventListener('click', () => keep(() => { S.who = []; })));
  $('#navbtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (matchMedia('(min-width: 901px)').matches) { S.hide.nav = !S.hide.nav; try { localStorage.setItem('hide', JSON.stringify(S.hide)); } catch { /* storage full */ } $('.shell')?.classList.toggle('nav-hidden', S.hide.nav); return; }
    keep(() => { S.nav = !S.nav; });
  });
  $('#scrim')?.addEventListener('click', () => keep(() => { S.nav = false; }));
  $('#nextun')?.addEventListener('click', jumpUnresolved);
  $('#unres')?.addEventListener('click', () => keep(() => { S.unres = !S.unres; }));
  (S.ios || []).forEach((o) => o.disconnect()); S.ios = [];
  { const mn = $('.main'); if (mn && S.view === 'pr') { let raf = 0; mn.addEventListener('scroll', () => { if (S.restoring || raf) return; raf = requestAnimationFrame(() => { raf = 0; const t = S.tabs[tabIdx()]; if (t) { t.scroll = mn.scrollTop; t.tab = S.tab; } }); }, { passive: true }); } }
  bindSticky();
  $('#sidetoggle')?.addEventListener('click', () => keep(() => { S.hide.side = !S.hide.side; localStorage.setItem('hide', JSON.stringify(S.hide)); }));
  document.querySelectorAll('[data-flip]').forEach((b) => b.addEventListener('click', flipSides));
  $('#split')?.addEventListener('click', () => keep(() => { S.split = !S.split; localStorage.setItem('split', S.split ? '1' : '0'); }));
  document.querySelectorAll('[data-sha]').forEach((el) => el.addEventListener('click', () => selectCommit(el.dataset.sha)));
  $('#sbgrip')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); const sh = $('.shell'), x0 = e.clientX, w0 = S.sbw;
    const mv = (ev) => { S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0)); sh.style.setProperty('--sbw', S.sbw + 'px'); };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging'); localStorage.setItem('sbw', String(Math.round(S.sbw))); };
    document.body.classList.add('dragging'); addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
  $('#sbgrip')?.addEventListener('dblclick', () => { S.sbw = 260; localStorage.setItem('sbw', '260'); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#gutter')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); const sp = $('.split'), r = sp.getBoundingClientRect();
    const mv = (ev) => { S.lw = Math.max(25, Math.min(75, ((S.flip ? r.right - ev.clientX : ev.clientX - r.left) / r.width) * 100)); sp.style.setProperty('--lw', S.lw + '%'); };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging'); localStorage.setItem('lw', String(Math.round(S.lw))); };
    document.body.classList.add('dragging'); addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
  $('#rvtoggle')?.addEventListener('click', () => { S.showAllReviewers = !S.showAllReviewers; S.keepScroll = true; render(); S.keepScroll = false; });
  $('#copybranch')?.addEventListener('click', () => navigator.clipboard?.writeText(S.bundle.pull.head.ref));
  document.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); const h = a.getAttribute('href');
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h)) openPr(h); else if (/^https?:\/\//.test(h)) openExternal(h);
  }));
}

document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey)) { if (e.key === 'Escape' && S.dialog) { S.dialog = ''; render(); } return; }
  if (e.key === 'l') { e.preventDefault(); focusAddr(); }
  else if (e.key === 'r') { e.preventDefault(); reload(); }
  else if (e.key === '[') { e.preventDefault(); go(-1); }
  else if (e.key === ']') { e.preventDefault(); go(1); }
  else if (e.key === ',') { e.preventDefault(); tokenDialog(); }
});

function tokenDialog() {
  S.oauthHtml = ''; S.oauthLive = false;
  S.dialog = '__TOKDLG__';
  render();
}
// The dialog is rebuilt from state on every render, so the code box and handlers survive background redraws.
const tokDlgHtml = () => `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>GitHub classic token</h2><p>Use a <b>classic</b> personal access token with the <code>repo</code> scope. It lists all your repositories (including organization ones) and raises the rate limit to 5,000 requests per hour. Organization with SSO: after creating it, click <b>Configure SSO → Authorize</b>. Stored in your OS keychain. Leave empty and save to remove it.</p><div class="oauth-row"><button class="btn primary" id="oauthgo">Sign in with GitHub</button><span>or paste a token below</span></div><div id="oauthbox">${S.oauthHtml || ''}</div><p><a href="https://github.com/settings/tokens/new?scopes=repo&amp;description=Pullscope">Create a classic token (repo scope preselected) ↗</a></p><input class="input" id="tokeninput" type="password" placeholder="ghp_…" style="width:100%;box-sizing:border-box"><div class="btns"><button class="btn" id="tokcancel">Cancel</button><button class="btn primary" id="toksave">Save</button></div></div></div>`;
function bindTokenDialog() {
  if (!$('#tokeninput')) return;
  $('#tokcancel').onclick = () => { S.oauthLive = false; S.dialog = ''; render(); };
  $('#toksave').onclick = async () => { const v = $('#tokeninput').value; try { await tauri?.invoke('set_token', { token: v }); S.hasToken = !!v.trim(); S.authChecked = true; if (S.hasToken) { S.gateErr = ''; loadRepos(); } else { S.repos = null; } } catch (e) { alert(e); } S.oauthLive = false; S.dialog = ''; render(); };
  $('#oauthgo').onclick = async () => {
    const show = (h) => { S.oauthHtml = h; if (S.dialog) { render(); } };
    $('#oauthgo').disabled = true; S.oauthLive = true; const me = S.oauthRun = (S.oauthRun || 0) + 1;
    try {
      const d = await tauri.invoke('device_start');
      show(`<div class="oauth-code"><span>Enter this code on GitHub</span><b>${esc(d.user_code)}</b><small>Waiting for approval…</small></div>`);
      tauri.invoke('open_external', { url: d.verification_uri }).catch(() => {});
      let wait = (d.interval || 5) * 1000; const until = Date.now() + (d.expires_in || 900) * 1000;
      while (S.oauthLive && S.oauthRun === me && Date.now() < until) {
        await new Promise((r) => setTimeout(r, wait));
        if (!S.oauthLive || S.oauthRun !== me) return;
        const st = await tauri.invoke('device_poll', { deviceCode: d.device_code });
        if (st === 'slow_down') wait += 5000;
        if (st === 'ok') { S.oauthLive = false; S.hasToken = true; S.gateErr = ''; S.dialog = ''; loadRepos(); return; }
      }
      throw 'The code expired. Start again.';
    } catch (e) { S.oauthLive = false; show(`<div class="err" style="margin:8px 0">${esc(String(e))}</div>`); }
  };
}

async function loadRepos() {
  S.reposErr = ''; S.repos = null;
  try { S.repos = await tauri.invoke('list_repos'); } catch (e) { S.reposErr = String(e); if (/401|Bad credentials|requires authentication/i.test(S.reposErr)) { S.hasToken = false; S.gateErr = 'GitHub rejected the saved token (expired or revoked). Sign in again.'; } }
  render();
}
async function openRepo(name, { nav = false } = {}) {
  S.view = 'repo'; S.pAuthor = S.pLabel = S.pStatus = ''; S.repo = name; S.prs = null; S.error = ''; S.bundle = nav && S.bundle ? S.bundle : S.bundle;
  if (!nav) { S.hist = S.hist.slice(0, S.hi + 1); S.hist.push('repo:' + name); S.hi = S.hist.length - 1; }
  S.sideTab = 'prs'; render(); refreshPushes(name);
  try { S.prs = tauri ? await tauri.invoke('list_prs', { repo: name, state: S.prState }) : []; } catch (e) { S.error = String(e); S.prs = []; }
  render();
}
// Loads the sidebar's PR list without leaving the pull request being read.
async function loadPrs() {
  // Show the last list for this repo at once and refresh quietly, so switching tabs never blanks the sidebar.
  const name = S.repo, ck = `${name}|${S.prState}`; S.prCache = S.prCache || {};
  const hit = S.prCache[ck];
  if (hit) { S.prs = hit.list; if (Date.now() - hit.at < 60000) { rerender(); return; } } else S.prs = null;
  rerender();
  try { const r = tauri ? await tauri.invoke('list_prs', { repo: name, state: S.prState }) : []; S.prCache[ck] = { list: r, at: Date.now() }; if (S.repo === name) S.prs = r; } catch (e) { if (S.repo === name && !hit) S.prs = []; }
  if (S.repo === name) rerender();
}
const reload = () => S.view === 'repo' ? openRepo(S.repo, { nav: true }) : S.bundle && openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true, manual: true });

async function openPr(input, { nav = false, keepTab = false, manual = false, newTab = false, restore = '' } = {}) {
  { const bm = String(input).match(/^([^#\s@]+\/[^#\s@]+)@(.+)$/); if (bm) return openNewPr(bm[1], bm[2]); }
  const fromTab = S.view === 'pr' ? tabIdx() : -1, tabSwitch = !!(restore || S.fadeMain);
  const seq = S.openSeq = (S.openSeq || 0) + 1, stale_ = () => S.openSeq !== seq; // a newer open (tab switch) supersedes this one
  if (!keepTab && !restore) tabSnap();
  // Show the tab at once; the title and state fill in when the PR arrives.
  S.tabPending = '';
  if (!keepTab) { const m = String(input).match(/^([^#\s@\/]+\/[^#\s@]+)#(\d+)$/) || String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/); if (m) { const ref = `${m[1]}#${m[2]}`; S.tabPending = ref; if (!S.tabs.some((t) => t.ref === ref)) { const old = S.recent.find((r) => r.ref === ref), item = { ref, title: old?.title || 'Loading…', state: old?.state || 'open', icon: old?.icon || 'git-pull-request', tab: restore || 'conversation', dot: false }; if (fromTab >= 0 && !newTab) S.tabs[fromTab] = item; else S.tabs.splice(fromTab >= 0 ? fromTab + 1 : S.tabs.length, 0, item); S.tabs = S.tabs.slice(-15); } } }
  S.error = ''; S.view = 'pr'; if (!keepTab) S.tab = restore || 'conversation'; S.sel = null; if (!keepTab) S.fr = null;
  if (keepTab && S.focus && S.tab === 'files') S.focus = ''; // reacting or replying on the Files tab must not jump to the Conversation tab
  // Stale-while-revalidate: show whatever copy exists at once (memory, then disk) and only fetch when it is stale.
  if (keepTab && tauri) await tauri.invoke('invalidate_pr', { url: input }).catch(() => {});
  const mem = qc.peek(input);
  const disk = mem || (tauri && !keepTab ? await tauri.invoke('cached_pr', { url: input }).then((b) => b && { data: b }).catch(() => null) : null);
  const fresh = !!mem && qc.fresh(input) && !keepTab, stale = !!disk && !fresh;
  const had = fresh || stale || (keepTab && S.bundle);
  if (fresh) { S.bundle = mem.data; S.loading = false; }
  else if (disk) { S.bundle = disk.data; S.refreshing = false; S.loading = false; }
  else if (keepTab && S.bundle) { S.refreshing = manual; S.loading = false; }
  else S.loading = true;
  const hot = fresh;
  S.keepScroll = keepTab; render(); S.keepScroll = false;
  if (!keepTab && !restore && $('.main')) $('.main').scrollTop = 0; // a different PR never inherits the previous page's scroll
  // Jump to the comment from the copy already on screen; the refresh below only tops it up.
  const focusNow = () => {
    if (!S.bundle || !S.focus) return false;
    if (S.tab !== 'conversation' && S.tab !== 'timeline') { S.tab = 'conversation'; render(); }
    const el = document.getElementById('c-' + S.focus);
    if (!el) return false;
    S.flashId = S.focus; S.flashUntil = Date.now() + 2500; S.focus = ''; el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); return true;
  };
  const focused = focusNow();
  try {
    const got = hot ? mem.data : await qc.fetch(input, () => loadPr(input));
    if (stale_()) return; // the user already moved on; the result stays in the cache for next time
    S.bundle = got;
    const p = S.bundle.pull, ref = `${p.base.repo.full_name}#${p.number}`, [st, ic] = stateOf(p);
    if (!nav) { S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(ref); S.hi = S.hist.length - 1; }
    S.recent = [{ ref, title: p.title, state: st, icon: ic }, ...S.recent.filter((r) => r.ref !== ref)].slice(0, 30);
    localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
    localStorage.setItem('last', ref); remember(ref, p);
    if (!keepTab || tabIdx() >= 0) tabPut(ref, p, { at: fromTab, newTab }); const ti = S.tabs.find((t) => t.ref === ref); if (ti) { ti.dot = false; saveTabs(); }
    if (S.repo !== p.base.repo.full_name) { S.repo = p.base.repo.full_name; S.sideTab = 'prs'; setTimeout(loadPrs, 0); }
    if (S.draftRef !== ref) { saveDrafts(); S.draftRef = ref; S.draft = { ...(drafts[ref] || {}) }; }
  } catch (e) { if (stale_()) return; if (!had) S.bundle = null; S.error = String(e).replace(/^Error: /, ''); }
  S.tabPending = ''; S.loading = false; S.refreshing = false; const savedScroll = restore ? (S.tabs[tabIdx()]?.scroll || 0) : 0; S.restoring = !!savedScroll; S.keepScroll = focused || keepTab; render(); S.keepScroll = false;
  if (savedScroll) { const put = () => { const m = $('.main'); if (m) m.scrollTop = savedScroll; }; put(); requestAnimationFrame(put); setTimeout(() => { put(); S.restoring = false; }, 250); } if (!keepTab && !stale && !focused && !S.flashId && !tabSwitch) enterAnim();
  if (S.bundle && !stale && !keepTab && !focused) $('.main').scrollTop = 0;
  if (S.bundle && S.focus) {
    const id = S.focus; S.focus = '';
    if (S.tab !== 'conversation' && S.tab !== 'timeline') { S.tab = 'conversation'; render(); }
    const el = document.getElementById('c-' + id);
    if (el) { S.flashId = id; S.flashUntil = Date.now() + 2500; el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); }
  }
}

const q = new URLSearchParams(location.search);
if (q.get('mode')) S.mode = q.get('mode');
if (q.get('tab')) S.tab = q.get('tab');
if (q.get('split')) S.split = q.get('split') === '1';
if (tauri) tauri.invoke('has_token').then((v) => { S.hasToken = v; S.authChecked = true; render(); if (v) { loadRepos(); loadProfile(); } }).catch(() => { S.authChecked = true; S.hasToken = false; render(); });
render();
if (q.get('fixture')) openPr(q.get('fixture')).then(() => { if (q.get('tab')) { S.tab = q.get('tab'); render(); } });
else if (tauri) tauri.invoke('initial_arg').then((arg) => { if (arg) openPr(arg); else { S.view = 'home'; render(); } });

setInterval(pollNotes, 60000); setTimeout(pollNotes, 4000);
// refetchOnWindowFocus: coming back to the app tops up a PR that has gone stale.
addEventListener('focus', () => { const b = S.bundle; if (!tauri || !b || S.view !== 'pr' || S.loading || S.refreshing) return; const k = `${b.pull.base.repo.full_name}#${b.pull.number}`; if (!qc.fresh(k, 60000)) openPr(k, { nav: true, keepTab: true }); });
setTimeout(pollNotes, 8000);
if (new URLSearchParams(location.search).get('demonote')) { S.notes = [{ id: 1, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: '3 new commits, 2 new comments', at: new Date().toISOString(), read: false }, { id: 2, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: 'now merged', at: new Date(Date.now() - 36e5).toISOString(), read: true }]; S.bell = true; render(); }

// Check GitHub Releases for a newer signed build a few seconds after launch, then again every 6 hours.
async function checkUpdate() {
  const up = window.__TAURI__?.updater; if (!up || S.update?.busy) return;
  try { const u = await up.check(); if (u) { S.update = { version: u.version, obj: u }; render(); } } catch {}
}
if (tauri) { setTimeout(checkUpdate, 6000); setInterval(checkUpdate, 6 * 3600 * 1000); }
