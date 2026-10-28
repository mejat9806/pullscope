import { focusDraft, rerender, scrollDraft, setDiffMode } from './actions';
import { $, qa, S } from './core';
import { inboxKey } from './inboxtools';
import { flipSides } from './mergebox';
import { openNewPr } from './pages';
import { openPalette, showHelp } from './palette';
import { toggleSplit } from './pr';
import { closeTab, openTab, reopenTab, stepTab, tabIdx } from './tabs';

// ---- Keyboard shortcuts: j/k comments, r reply, [ ] unresolved threads, cmd+K quick open, ? help ----
export const typing = (t: EventTarget | null) =>
  t &&
  ((t as HTMLElement).closest?.(
    'input, textarea, select, [contenteditable="true"], .ProseMirror',
  ) ||
    (t as HTMLElement).isContentEditable);

export const kbItems = () =>
  [...qa('.main .tl-comment, .main .tc')].filter(e => e.offsetParent);

// The focused comment is state (S.kbId): the views draw the `kb` class from it.
export function kbGo(el: HTMLElement) {
  if (!el) {
    return;
  }

  S.kbId = el.id;
  rerender();
}

export const kbCur = () => (S.kbId && document.getElementById(S.kbId)) || null;

export function kbStep(dir: number, pick = kbItems) {
  const items = pick();
  const cur = kbCur();

  if (!items.length) {
    return;
  }

  let i = cur ? items.indexOf(cur) : -1;

  if (i === -1 && cur) {
    i =
      items.findIndex(
        e => cur.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING,
      ) - (dir > 0 ? 1 : 0);
  }

  kbGo(items[Math.min(items.length - 1, Math.max(0, i + dir))]);
}

export const openThreads = () =>
  [...qa<HTMLElement>('.main .thread')]
    .filter(t => !$('.thread-head .res', t) && t.offsetParent)
    .map(t => $<HTMLElement>('.tc', t)!)
    .filter(Boolean);

export function setComposer(open: boolean, focus?: boolean) {
  if (!S.composerBox) {
    return false;
  }

  S.cOpen = open;
  rerender();

  if (open && focus) {
    focusDraft('comment');
  }

  return true;
}

export const menuAway = (e: MouseEvent) => {
  if (
    S.tabMenu &&
    !(e.target as HTMLElement).closest<HTMLElement>('.pt-menu, #tabadd')
  ) {
    S.tabMenu = false;
    rerender();
  }
};

export function shortcut(e: KeyboardEvent) {
  if (S.tabMenu && e.key === 'Escape') {
    S.tabMenu = false;
    rerender();

    return;
  }

  if ((e.metaKey || e.ctrlKey) && !e.altKey) {
    const k = e.key.toLowerCase();

    if (k === 't' && !e.shiftKey) {
      e.preventDefault();
      S.tabMenu = !S.tabMenu;

      if (!S.tabs.length) {
        S.tabMenu = true;
      }

      rerender();

      return;
    }

    if (k === 't' && e.shiftKey) {
      e.preventDefault();
      reopenTab();

      return;
    }

    if (k === 'w' && S.tabs.length && tabIdx() >= 0) {
      e.preventDefault();
      closeTab(tabIdx());

      return;
    }

    if (/^[1-9]$/.test(k) && S.tabs[+k - 1]) {
      e.preventDefault();
      openTab(S.tabs[+k - 1].ref);

      return;
    }

    if (e.key === 'Tab' && e.ctrlKey) {
      e.preventDefault();
      stepTab(e.shiftKey ? -1 : 1);

      return;
    }
  }

  if (
    e.key === 'Escape' &&
    !e.defaultPrevented &&
    (e.target as HTMLElement).closest?.('#composer') &&
    !$('.tt-slash')
  ) {
    e.preventDefault();
    (e.target as HTMLElement).blur?.();
    setComposer(false);

    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openPalette();

    return;
  }

  if (
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    typing(e.target) ||
    $('.palette, .dlg-bg')
  ) {
    return;
  }

  if (S.view === 'inbox' && inboxKey(e)) {
    return;
  }

  if (e.key === 'j') {
    kbStep(1);
  } else if (e.key === 'k') {
    kbStep(-1);
  } else if (e.key === ']') {
    kbStep(1, openThreads!);
  } else if (e.key === '[') {
    kbStep(-1, openThreads!);
  } else if (e.key === '?') {
    showHelp();
  } else if (e.key === 'n') {
    e.preventDefault();
    openNewPr();
  } else if (e.key === 'c' && S.view === 'pr' && S.composerBox) {
    e.preventDefault();
    setComposer(true, true);
  } else if (e.key === 'f' && $('.split')) {
    flipSides();
  } else if (e.key === 's' && S.bundle) {
    toggleSplit();
  } else if (e.key === 'd' && S.bundle) {
    setDiffMode(S.diffMode === 'split' ? 'unified' : 'split');
  } else if (e.key === 'r') {
    const cur = kbCur();

    const host = cur
      ?.closest<HTMLElement>('.thread')
      ?.querySelector<HTMLElement>('.reply .tt');

    if (!host) {
      if (S.composerBox) {
        e.preventDefault();
        setComposer(true, true);
      }

      return;
    }

    e.preventDefault();
    const key = host.dataset.draft!;
    scrollDraft(key);
    focusDraft(key);
  }
}
