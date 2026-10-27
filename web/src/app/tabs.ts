import type { Pull, Tab } from '../types';
import { fastTab, stashCurrent } from './bind';
import { stateOf } from './comments';
import { $, S, load } from './core';
import { openPr } from './nav';
import { render } from './pages';

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
  const t = S.tabs[i]; if (!t) return; S.alive.get(t.ref)?.eds.forEach((e) => e.destroy()); S.alive.delete(t.ref);
  const was = t.ref === curRef(); S.closed = [{ ref: t.ref, tab: t.tab }, ...S.closed.filter((c) => c.ref !== t.ref)].slice(0, 10);
  S.tabs.splice(i, 1); saveTabs();
  if (!was) return render();
  const n = S.tabs[Math.min(i, S.tabs.length - 1)]; S.fadeMain = true;
  if (n) openPr(n.ref, { restore: n.tab, nav: true }); else { S.view = 'home'; S.bundle = null; render(); }
}

export function reopenTab() { const c = S.closed.shift(); if (c) { tabSnap(); openPr(c.ref, { newTab: true, restore: c.tab }); } }

export function stepTab(d: number) { if (S.tabs.length < 2) return; const i = tabIdx(), n = S.tabs[(i + d + S.tabs.length) % S.tabs.length]; openTab(n.ref); }

