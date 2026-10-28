import { drafts, rerender, saveDrafts } from './actions';
import { openFromList } from './addressbar';
import { isFolded } from './comments';
import { appState, KEY_RECENT, queryElement } from './core';
import { loadPr, qc } from './data';
import { closePop, openPop } from './dialogs';
import { loadPrs, openPr } from './nav';
import { render, saveNotes, scrollMain, shownPage } from './pages';
import { curRef, saveTabs, tabSnap } from './tabs';

import type { FoldKey } from './timeline';

// Browser-style tabs: leaving a PR tab keeps its page (DOM, scroll, open editors) alive; coming back swaps it in with no redraw.
appState.alive = new Map();

export const aliveKey = () =>
  [
    appState.diffMode,
    appState.split,
    JSON.stringify(appState.hide),
    appState.sbw,
  ].join('|');

export function stashCurrent() {
  appState.openSeq = (appState.openSeq || 0) + 1;

  const ref = appState.view === 'pr' && appState.bundle ? curRef() : '';
  const element = queryElement('.main');
  const sh = shownPage();

  if (
    !ref ||
    !element ||
    !sh ||
    sh.ref !== ref ||
    !appState.tabs.some(tab => tab.ref === ref)
  ) {
    return;
  }

  appState.alive.set(ref, {
    vnode: sh.vnode,
    bundle: appState.bundle!,
    tab: appState.tab,
    key: aliveKey(),
    scroll: appState.mainTop || 0,
  });

  while (appState.alive.size > 6) {
    const old = appState.alive.keys().next().value!;
    appState.alive.delete(old);
  }
}

export function fastTab(ref: string) {
  appState.openSeq = (appState.openSeq || 0) + 1;
  const alive = appState.alive.get(ref);

  if (!alive) {
    return false;
  }

  const mem = qc.peek(ref);

  if (!mem || mem.data !== alive.bundle || alive.key !== aliveKey()) {
    appState.alive.delete(ref);

    return false;
  }

  tabSnap();
  stashCurrent();
  appState.alive.delete(ref);
  const pull = alive.bundle.pull;
  appState.view = 'pr';
  appState.bundle = alive.bundle;
  appState.tab = alive.tab;
  appState.sel = null;
  appState.fr = null;
  appState.error = '';
  appState.loading = false;
  appState.refreshing = false;
  appState.tabPending = '';
  appState.tabMenu = false;
  localStorage.setItem('last', ref);
  const ti = appState.tabs.find(tab => tab.ref === ref);

  if (ti) {
    ti.dot = false;
    saveTabs();
  }

  if (appState.repo !== pull.base.repo.full_name) {
    appState.repo = pull.base.repo.full_name;
    appState.sideTab = 'prs';
    setTimeout(loadPrs, 0);
  }

  if (appState.draftRef !== ref) {
    saveDrafts();
    appState.draftRef = ref;
    appState.draft = { ...(drafts[ref] || {}) };
  }

  // The parked page goes back in untouched (same vnode: no diff, scroll and editors as they were).
  appState.stash = alive;
  render();
  scrollMain(alive.scroll);

  // Quietly check for newer data; only redraw if something actually changed.
  if (!qc.fresh(ref)) {
    qc.fetch(ref, () => loadPr(ref))!
      .then(bundle => {
        if (JSON.stringify(bundle) === JSON.stringify(alive.bundle)) {
          qc.m.set(ref, { data: alive.bundle, at: Date.now() });

          return;
        }

        if (curRef() === ref) {
          openPr(ref, { keepTab: true, nav: true });
        }
      })
      .catch(() => {});
  }

  return true;
}

export function openClick(el: HTMLElement, event: MouseEvent) {
  if (
    (event.target as HTMLElement).closest<HTMLElement>(
      '[data-rm], .np-act, .np-dot',
    )
  ) {
    return;
  }

  appState.nav = false;
  appState.focus = el.dataset.target || '';

  const nn =
    el.dataset.note &&
    appState.notes.find(note => String(note.id) === el.dataset.note);

  if (nn) {
    nn.read = true;
    saveNotes();
  }

  if (event.metaKey || event.ctrlKey) {
    event.preventDefault();
    openFromList(el.dataset.open!, true);
  } else {
    openFromList(el.dataset.open!, false);
  }
}

export function openAux(el: HTMLElement, event: MouseEvent) {
  if (event.button === 1) {
    event.preventDefault();
    openFromList(el.dataset.open!, true);
  }
}

export function openCtx(el: HTMLElement, event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  const ref = el.dataset.open!;

  openPop({
    k: 'ctx',
    x: Math.min(event.clientX, innerWidth - 180),
    y: Math.min(event.clientY, innerHeight - 120),
    pick: hash => {
      closePop();

      if (hash === 'new') {
        openFromList(ref, true);
      } else if (hash === 'here') {
        openFromList(ref, false);
      } else {
        const match = ref.match(/^(.+)#(\d+)$/);

        navigator.clipboard
          ?.writeText(
            match ? `https://github.com/${match[1]}/pull/${match[2]}` : ref,
          )
          .catch(() => {});
      }
    },
  });
}

export function rmRecent(event: MouseEvent, ref: string) {
  event.stopPropagation();

  appState.recent = appState.recent.filter(
    recentEntry => recentEntry.ref !== ref,
  );

  localStorage.setItem(KEY_RECENT, JSON.stringify(appState.recent));
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
}

// "Collapse all conversations" flips every fold in the timeline; the label says what the next click does.
export function foldAllConv(keys: FoldKey[]) {
  if (!keys.length) {
    return;
  }

  const now = keys.some(foldKey => !isFolded(foldKey.k, foldKey.def));

  keys.forEach(foldKey => {
    appState.fold[foldKey.k] = now;
  });

  try {
    localStorage.setItem('fold', JSON.stringify(appState.fold));
  } catch {
    /* storage full */
  }

  rerender();
}
