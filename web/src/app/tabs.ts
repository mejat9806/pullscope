import { fastTab, stashCurrent } from './bind';
import { stateOf } from './comments';
import { appState, load } from './core';
import { openPr } from './nav';
import { render } from './pages';

import type { Pull, Tab } from '../types';

// Native-app chrome: toolbar (history, address bar, actions) and a recent-PRs sidebar.

// ---- Tabs: several PRs open at once. Each tab keeps only a small view state; the PR itself comes from the cache. ----
export const KEY_TABS = 'tabs';

{
  const item = load<{ list?: Tab[] }>(KEY_TABS, {});
  appState.tabs = Array.isArray(item.list) ? item.list : [];
  appState.closed = [];
  appState.tabMenu = false;
  appState.tabCtx = null;
}

export const curRef = () =>
  appState.view === 'pr' && appState.bundle
    ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
    : '';

export const saveTabs = () => {
  try {
    localStorage.setItem(
      KEY_TABS,
      JSON.stringify({
        list: appState.tabs.map(
          ({ ref, title, state, icon, tab, dot, scroll }) => ({
            ref,
            title,
            state,
            icon,
            tab,
            dot,
            scroll,
          }),
        ),
      }),
    );
  } catch {}
};

export const tabIdx = () =>
  appState.tabs.findIndex(tab => tab.ref === curRef());

export function tabSnap() {
  const tab = appState.tabs[tabIdx()];

  if (tab) {
    tab.tab = appState.tab;
    tab.scroll = appState.mainTop || 0;
  }
}

export function tabPut(
  ref: string,
  pull: Pull,
  opts: { at?: number; newTab?: boolean } = {},
) {
  const [state, ic] = stateOf(pull);

  const item = {
    ref,
    title: pull.title,
    state,
    icon: ic,
    tab: appState.tab,
    dot: false,
  };

  const have = appState.tabs.findIndex(tab => tab.ref === ref);

  if (have >= 0) {
    Object.assign(appState.tabs[have], item, { tab: appState.tabs[have].tab });
  } else if (opts.at !== undefined && opts.at >= 0 && !opts.newTab) {
    appState.tabs[opts.at] = item;
  } else {
    appState.tabs.splice(
      opts.at !== undefined && opts.at >= 0
        ? opts.at + 1
        : appState.tabs.length,
      0,
      item,
    );
  }

  appState.tabs = appState.tabs.slice(-15);
  saveTabs();
}

export function openTab(ref: string, { newTab = false } = {}) {
  if (!newTab && ref !== curRef() && fastTab(ref)) {
    return;
  }

  stashCurrent();
  tabSnap();
  appState.fadeMain = true;
  appState.tabMenu = false;

  return openPr(ref, {
    newTab,
    restore: newTab ? '' : appState.tabs.find(tab => tab.ref === ref)?.tab,
  });
}

export function closeTab(index: number) {
  const tab = appState.tabs[index];

  if (!tab) {
    return;
  }

  appState.alive.delete(tab.ref);
  const was = tab.ref === curRef();

  appState.closed = [
    { ref: tab.ref, tab: tab.tab },
    ...appState.closed.filter(item => item.ref !== tab.ref),
  ].slice(0, 10);

  appState.tabs.splice(index, 1);
  saveTabs();

  if (!was) {
    return render();
  }

  const otherTab = appState.tabs[Math.min(index, appState.tabs.length - 1)];
  appState.fadeMain = true;

  if (otherTab) {
    openPr(otherTab.ref, { restore: otherTab.tab, nav: true });
  } else {
    appState.view = 'home';
    appState.bundle = null;
    render();
  }
}

// Close several tabs at once (context menu: others, to the right, all). They stay reopenable with ⌘⇧T, newest first.
export function closeTabs(keep: (tab: Tab, index: number) => boolean) {
  const gone = appState.tabs.filter((tab, index) => !keep(tab, index));

  if (!gone.length) {
    return;
  }

  const current = curRef();
  const wasOpen = gone.some(tab => tab.ref === current);

  for (const tab of gone) {
    appState.alive.delete(tab.ref);
  }

  appState.closed = [
    ...gone.map(tab => ({ ref: tab.ref, tab: tab.tab })).reverse(),
    ...appState.closed.filter(item => !gone.some(tab => tab.ref === item.ref)),
  ].slice(0, 10);

  appState.tabs = appState.tabs.filter((tab, index) => keep(tab, index));
  appState.tabCtx = null;
  saveTabs();

  if (!wasOpen) {
    return render();
  }

  const otherTab = appState.tabs[0];
  appState.fadeMain = true;

  if (otherTab) {
    openPr(otherTab.ref, { restore: otherTab.tab, nav: true });
  } else {
    appState.view = 'home';
    appState.bundle = null;
    render();
  }
}

export function reopenTab() {
  const item = appState.closed.shift();

  if (item) {
    tabSnap();
    openPr(item.ref, { newTab: true, restore: item.tab });
  }
}

export function stepTab(delta: number) {
  if (appState.tabs.length < 2) {
    return;
  }

  const index = tabIdx();

  const tab =
    appState.tabs[
      (index + delta + appState.tabs.length) % appState.tabs.length
    ];

  openTab(tab.ref);
}
