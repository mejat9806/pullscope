import { avUrl } from './addressbar';
import { fastTab, stashCurrent } from './bind';
import { stateOf } from './comments';
import { $, S, esc, icon, isDark, isOff, load } from './core';
import { openPr } from './nav';
import { render } from './pages';
import { prSide } from './prlist';

// Native-app chrome: toolbar (history, address bar, actions) and a recent-PRs sidebar.

// ---- Tabs: several PRs open at once. Each tab keeps only a small view state; the PR itself comes from the cache. ----
export const KEY_TABS = 'tabs';

{ const t = load(KEY_TABS, {}); S.tabs = Array.isArray(t.list) ? t.list : []; S.closed = []; S.tabMenu = false; }

export const curRef = () => (S.view === 'pr' && S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '');

export const saveTabs = () => { try { localStorage.setItem(KEY_TABS, JSON.stringify({ list: S.tabs.map(({ ref, title, state, icon, tab, dot, scroll }) => ({ ref, title, state, icon, tab, dot, scroll })) })); } catch {} };

export const tabIdx = () => S.tabs.findIndex((t) => t.ref === curRef());

export function tabSnap() { const t = S.tabs[tabIdx()]; if (t) { t.tab = S.tab; t.scroll = $('.main')?.scrollTop || 0; } }

export function tabPut(ref, p, opts: any = {}) {
  const [state, ic] = stateOf(p), item = { ref, title: p.title, state, icon: ic, tab: S.tab, dot: false };
  const have = S.tabs.findIndex((t) => t.ref === ref);
  if (have >= 0) Object.assign(S.tabs[have], item, { tab: S.tabs[have].tab });
  else if (opts.at >= 0 && !opts.newTab) S.tabs[opts.at] = item;
  else S.tabs.splice(opts.at >= 0 ? opts.at + 1 : S.tabs.length, 0, item);
  S.tabs = S.tabs.slice(-15); saveTabs();
}

export function openTab(ref, { newTab = false } = {}) { if (!newTab && ref !== curRef() && fastTab(ref)) return; stashCurrent(); tabSnap(); S.fadeMain = true; S.tabMenu = false; return openPr(ref, { newTab, restore: newTab ? '' : S.tabs.find((t) => t.ref === ref)?.tab }); }

export function closeTab(i) {
  const t = S.tabs[i]; if (!t) return; S.alive.delete(t.ref);
  const was = t.ref === curRef(); S.closed = [{ ref: t.ref, tab: t.tab }, ...S.closed.filter((c) => c.ref !== t.ref)].slice(0, 10);
  S.tabs.splice(i, 1); saveTabs();
  if (!was) return render();
  const n = S.tabs[Math.min(i, S.tabs.length - 1)]; S.fadeMain = true;
  if (n) openPr(n.ref, { restore: n.tab, nav: true }); else { S.view = 'home'; S.bundle = null; render(); }
}

export function reopenTab() { const c = S.closed.shift(); if (c) { tabSnap(); openPr(c.ref, { newTab: true, restore: c.tab }); } }

export function stepTab(d) { if (S.tabs.length < 2) return; const i = tabIdx(), n = S.tabs[(i + d + S.tabs.length) % S.tabs.length]; openTab(n.ref); }

export function tabStrip() {
  const cur = S.tabPending || curRef();
  const tabs = S.tabs.map((t, i) => `<div class="ptab ${t.ref === cur ? 'on' : ''}" data-tab="${i}" title="${esc(t.ref + ' · ' + t.title)}"><span class="rc-i ${t.state}">${icon(t.icon)}</span><span class="pt-t"><i>${esc(t.ref.split('/').pop())}</i> ${esc(t.title)}</span>${t.dot ? '<span class="pt-dot"></span>' : ''}<button class="pt-x" data-tabx="${i}" aria-label="Close tab">${icon('x')}</button></div>`).join('');
  const open = new Set(S.tabs.map((t) => t.ref));
  const recents = S.recent.filter((r) => !open.has(r.ref)).slice(0, 8);
  const menu = S.tabMenu ? `<div class="pt-menu"><a data-tabhome>${icon('home')} Home</a>${recents.length ? '<h6>Recent</h6>' : ''}${recents.map((r) => `<a data-tabnew="${esc(r.ref)}"><span class="rc-i ${r.state}">${icon(r.icon)}</span><span class="pt-mt"><i>${esc(r.ref)}</i> ${esc(r.title)}</span></a>`).join('')}${S.closed.length ? `<h6>Closed</h6><a data-tabreopen>${icon('clock')} Reopen ${esc(S.closed[0].ref)} <kbd>⌘⇧T</kbd></a>` : ''}</div>` : '';
  return `<div class="ptabs">${tabs}<button class="pt-add" id="tabadd" title="New tab (⌘T)" aria-label="New tab">${icon('plus')}${S.tabs.length < 2 ? '<span>New tab</span>' : ''}</button>${menu}</div>`;
}

export function toolbar() {
  const b = S.bundle, ref = b ? `${b.pull.base.repo.full_name}#${b.pull.number}` : '';
  return `<header class="toolbar" data-tauri-drag-region>
  <button class="tb-btn nav-btn" id="navbtn" title="Show or hide the sidebar">${icon('three-bars')}</button><div class="tb-group"><button class="tb-btn" id="back" ${S.hist.length < 2 || S.hi < 1 ? 'disabled' : ''} title="Back (⌘[)">${icon('chevron-left')}</button><button class="tb-btn" id="fwd" ${S.hi >= S.hist.length - 1 ? 'disabled' : ''} title="Forward (⌘])">${icon('chevron-right')}</button><button class="tb-btn" id="reload" ${b ? '' : 'disabled'} title="Reload (⌘R)">${icon('sync')}</button></div>
  <form id="addr" class="addr">${icon('search')}<input id="addrinput" value="${esc(ref)}" placeholder="Open a pull request: owner/repo#123 or URL  (⌘L)" spellcheck="false" autocomplete="off"></form>${S.update ? `<button class="upd" id="upd" title="Download and install the new version, then restart">${icon('sync')} ${S.update.busy ? 'Updating…' : 'Update to v' + esc(S.update.version)}</button>` : ''}
  <div class="tb-group"><button class="tb-btn off-ind ${isOff() ? 'on' : ''}" id="retry" data-tip="Offline — can't reach GitHub. Showing the saved copy. Click to retry." aria-label="Offline, click to retry" tabindex="${isOff() ? 0 : -1}">${icon('alert')}</button><button class="tb-btn" id="external" ${b ? '' : 'disabled'} title="Open on github.com">${icon('link-external')}</button><button class="tb-btn" id="newprbtn" title="New pull request">${icon('plus')}</button><button class="tb-btn" id="inboxbtn" title="Inbox: PRs that need you">${icon('checklist')}</button><button class="tb-btn bell" id="bell" title="Notifications">${icon('bell')}${S.notes.some((n) => !n.read) ? `<i class="dot">${S.notes.filter((n) => !n.read).length}</i>` : ''}</button><button class="theme-sw${isDark() ? ' dark' : ''}" id="mode" role="switch" aria-checked="${isDark()}" title="Switch to ${isDark() ? 'light' : 'dark'} mode"><i class="st"></i><i class="st s2"></i><i class="st s3"></i><i class="cl"></i><i class="cl c2"></i><span class="knob"><b class="cr"></b><b class="cr c2"></b><b class="cr c3"></b></span></button>${S.hasToken && S.profile ? `<button class="prof-btn" id="profbtn" title="${esc(S.profile.name || S.profile.login)} — account menu"><img src="${esc(avUrl(S.profile.avatar_url, 56))}" alt=""><span>${esc(S.profile.name || S.profile.login)}</span>${icon('chevron-down', 12)}</button>` : `<button class="tb-btn" id="signin" title="Access token">${icon('key')}</button>`}</div></header>`;
}

export function sideRecent() {
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
