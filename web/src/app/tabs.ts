import type { Pull, Tab } from '../types';
import { recentListHtml, repoListHtml, sidebarHtml } from '../components/Sidebar';
import { tabStripHtml } from '../components/TabStrip';
import { toolbarHtml } from '../components/Toolbar';
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

{ const t = load<{ list?: Tab[] }>(KEY_TABS, {}); S.tabs = Array.isArray(t.list) ? t.list : []; S.closed = []; S.tabMenu = false; }

export const curRef = () => (S.view === 'pr' && S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '');

export const saveTabs = () => { try { localStorage.setItem(KEY_TABS, JSON.stringify({ list: S.tabs.map(({ ref, title, state, icon, tab, dot, scroll }) => ({ ref, title, state, icon, tab, dot, scroll })) })); } catch {} };

export const tabIdx = () => S.tabs.findIndex((t) => t.ref === curRef());

export function tabSnap() { const t = S.tabs[tabIdx()]; if (t) { t.tab = S.tab; t.scroll = $('.main')?.scrollTop || 0; } }

export function tabPut(ref: string, p: Pull, opts: { at?: number; newTab?: boolean } = {}) {
  const [state, ic] = stateOf(p), item = { ref, title: p.title, state, icon: ic, tab: S.tab, dot: false };
  const have = S.tabs.findIndex((t) => t.ref === ref);
  if (have >= 0) Object.assign(S.tabs[have], item, { tab: S.tabs[have].tab });
  else if (opts.at !== undefined && opts.at >= 0 && !opts.newTab) S.tabs[opts.at] = item;
  else S.tabs.splice(opts.at !== undefined && opts.at >= 0 ? opts.at + 1 : S.tabs.length, 0, item);
  S.tabs = S.tabs.slice(-15); saveTabs();
}

export function openTab(ref: string, { newTab = false } = {}) { if (!newTab && ref !== curRef() && fastTab(ref)) return; stashCurrent(); tabSnap(); S.fadeMain = true; S.tabMenu = false; return openPr(ref, { newTab, restore: newTab ? '' : S.tabs.find((t) => t.ref === ref)?.tab }); }

export function closeTab(i: number) {
  const t = S.tabs[i]; if (!t) return; S.alive.delete(t.ref);
  const was = t.ref === curRef(); S.closed = [{ ref: t.ref, tab: t.tab }, ...S.closed.filter((c) => c.ref !== t.ref)].slice(0, 10);
  S.tabs.splice(i, 1); saveTabs();
  if (!was) return render();
  const n = S.tabs[Math.min(i, S.tabs.length - 1)]; S.fadeMain = true;
  if (n) openPr(n.ref, { restore: n.tab, nav: true }); else { S.view = 'home'; S.bundle = null; render(); }
}

export function reopenTab() { const c = S.closed.shift(); if (c) { tabSnap(); openPr(c.ref, { newTab: true, restore: c.tab }); } }

export function stepTab(d: number) { if (S.tabs.length < 2) return; const i = tabIdx(), n = S.tabs[(i + d + S.tabs.length) % S.tabs.length]; openTab(n.ref); }

export function tabStrip() {
  const open = new Set(S.tabs.map((t) => t.ref));
  return tabStripHtml({ tabs: S.tabs, cur: S.tabPending || curRef(), recents: S.recent.filter((r) => !open.has(r.ref)).slice(0, 8), menu: S.tabMenu, closedFirst: S.closed.length ? S.closed[0].ref : null, icon });
}

export function toolbar() {
  const b = S.bundle, pr = S.profile;
  return toolbarHtml({
    prRef: b ? `${b.pull.base.repo.full_name}#${b.pull.number}` : '', hasBundle: !!b, canBack: !(S.hist.length < 2 || S.hi < 1), canFwd: !(S.hi >= S.hist.length - 1),
    update: S.update ? { busy: S.update.busy, version: S.update.version } : null, offline: isOff(), unread: S.notes.filter((n) => !n.read).length,
    dark: isDark(), profile: pr, hasToken: S.hasToken, avatar: S.hasToken && pr ? avUrl(pr.avatar_url!, 56) : '', icon,
  });
}

export function sideRecent() {
  let list;
  if (S.sideTab === 'prs' && S.repo) {
    list = prSide();
  } else if (S.sideTab === 'recent') {
    list = recentListHtml({ recent: S.recent, curRef: S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '', icon });
  } else if (!S.hasToken) {
    list = '<div class="sb-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="sb-btn" id="addtoken">Add token</button></div>';
  } else if (S.reposErr) {
    list = `<div class="sb-empty err">${esc(S.reposErr)}</div>`;
  } else if (!S.repos) {
    list = '<div class="sb-empty">Loading repositories…</div>';
  } else {
    list = repoListHtml({ repos: S.repos, repo: S.repo, filter: S.repoFilter, icon });
  }
  return sidebarHtml({ sideTab: S.sideTab, hasRepo: !!S.repo, hasToken: S.hasToken, list });
}
