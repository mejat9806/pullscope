import { focusDraft, rerender, scrollDraft, setDiffMode } from './actions';
import { appState, qa, queryElement } from './core';
import { inboxKey } from './inboxtools';
import { flipSides } from './mergebox';
import { openNewPr } from './pages';
import { openPalette, showHelp } from './palette';
import { toggleSplit } from './pr';
import { closeTab, openTab, reopenTab, stepTab, tabIdx } from './tabs';

// ---- Keyboard shortcuts: j/k comments, r reply, [ ] unresolved threads, cmd+K quick open, ? help ----
export const typing = (target: EventTarget | null) =>
  target &&
  ((target as HTMLElement).closest?.(
    'input, textarea, select, [contenteditable="true"], .ProseMirror',
  ) ||
    (target as HTMLElement).isContentEditable);

export const kbItems = () =>
  [...qa('.main .tl-comment, .main .tc')].filter(
    element => element.offsetParent,
  );

// The focused comment is state (S.kbId): the views draw the `kb` class from it.
export function kbGo(el: HTMLElement) {
  if (!el) {
    return;
  }

  appState.kbId = el.id;
  rerender();
}

export const kbCur = () =>
  (appState.kbId && document.getElementById(appState.kbId)) || null;

export function kbStep(dir: number, pick = kbItems) {
  const items = pick();
  const cur = kbCur();

  if (!items.length) {
    return;
  }

  let index = cur ? items.indexOf(cur) : -1;

  if (index === -1 && cur) {
    index =
      items.findIndex(
        element =>
          cur.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ) - (dir > 0 ? 1 : 0);
  }

  kbGo(items[Math.min(items.length - 1, Math.max(0, index + dir))]);
}

export const openThreads = () =>
  [...qa<HTMLElement>('.main .thread')]
    .filter(
      element =>
        !queryElement('.thread-head .res', element) && element.offsetParent,
    )
    .map(element => queryElement<HTMLElement>('.tc', element)!)
    .filter(Boolean);

export function setComposer(open: boolean, focus?: boolean) {
  if (!appState.composerBox) {
    return false;
  }

  appState.cOpen = open;
  rerender();

  if (open && focus) {
    focusDraft('comment');
  }

  return true;
}

export const menuAway = (event: MouseEvent) => {
  if (
    appState.tabMenu &&
    !(event.target as HTMLElement).closest<HTMLElement>('.pt-menu, #tabadd')
  ) {
    appState.tabMenu = false;
    rerender();
  }
};

export function shortcut(event: KeyboardEvent) {
  if (appState.tabMenu && event.key === 'Escape') {
    appState.tabMenu = false;
    rerender();

    return;
  }

  if ((event.metaKey || event.ctrlKey) && !event.altKey) {
    const key = event.key.toLowerCase();

    if (key === 't' && !event.shiftKey) {
      event.preventDefault();
      appState.tabMenu = !appState.tabMenu;

      if (!appState.tabs.length) {
        appState.tabMenu = true;
      }

      rerender();

      return;
    }

    if (key === 't' && event.shiftKey) {
      event.preventDefault();
      reopenTab();

      return;
    }

    if (key === 'w' && appState.tabs.length && tabIdx() >= 0) {
      event.preventDefault();
      closeTab(tabIdx());

      return;
    }

    if (/^[1-9]$/.test(key) && appState.tabs[+key - 1]) {
      event.preventDefault();
      openTab(appState.tabs[+key - 1].ref);

      return;
    }

    if (event.key === 'Tab' && event.ctrlKey) {
      event.preventDefault();
      stepTab(event.shiftKey ? -1 : 1);

      return;
    }
  }

  if (
    event.key === 'Escape' &&
    !event.defaultPrevented &&
    (event.target as HTMLElement).closest?.('#composer') &&
    !queryElement('.tt-slash')
  ) {
    event.preventDefault();
    (event.target as HTMLElement).blur?.();
    setComposer(false);

    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openPalette();

    return;
  }

  if (
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    typing(event.target) ||
    queryElement('.palette, .dlg-bg')
  ) {
    return;
  }

  if (appState.view === 'inbox' && inboxKey(event)) {
    return;
  }

  if (event.key === 'j') {
    kbStep(1);
  } else if (event.key === 'k') {
    kbStep(-1);
  } else if (event.key === ']') {
    kbStep(1, openThreads!);
  } else if (event.key === '[') {
    kbStep(-1, openThreads!);
  } else if (event.key === '?') {
    showHelp();
  } else if (event.key === 'n') {
    event.preventDefault();
    openNewPr();
  } else if (
    event.key === 'c' &&
    appState.view === 'pr' &&
    appState.composerBox
  ) {
    event.preventDefault();
    setComposer(true, true);
  } else if (event.key === 'f' && queryElement('.split')) {
    flipSides();
  } else if (event.key === 's' && appState.bundle) {
    toggleSplit();
  } else if (event.key === 'd' && appState.bundle) {
    setDiffMode(appState.diffMode === 'split' ? 'unified' : 'split');
  } else if (event.key === 'r') {
    const cur = kbCur();

    const host = cur
      ?.closest<HTMLElement>('.thread')
      ?.querySelector<HTMLElement>('.reply .tt');

    if (!host) {
      if (appState.composerBox) {
        event.preventDefault();
        setComposer(true, true);
      }

      return;
    }

    event.preventDefault();
    const key = host.dataset.draft!;
    scrollDraft(key);
    focusDraft(key);
  }
}
