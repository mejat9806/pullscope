import { scrollTarget } from '../components/req';
import { ToTop } from '../components/ToTop';
import { blurDraft, composerOpen } from './actions';
import { appState } from './core';
import { setSlot } from './frame';
import { setComposer } from './keyboard';
import { scrollMain } from './pages';
import { tabIdx } from './tabs';

// What every scrolling pane reports: the page and each split-view pane call `scrolled` from their own onScroll.
let scrollRaf = 0;
let lastTop = 0;
let atEnd = false;

export const toTop = (smooth = true) => {
  if (appState.scrollId && appState.scrollId !== 'main') {
    scrollTarget(appState.scrollId, 0, smooth);
  } else {
    scrollMain(0, smooth);
  }
};

export const toBottom = (smooth = true) => {
  if (appState.scrollId && appState.scrollId !== 'main') {
    scrollTarget(appState.scrollId, 1e7, smooth);
  } else {
    scrollMain(1e7, smooth);
  }
};

export const paintToTop = () =>
  setSlot(
    'totop',
    <ToTop
      dir={appState.toTop || ''}
      onClick={() => (appState.toTop === 'down' ? toBottom() : toTop())}
    />,
  );

// The button shows on any page long enough to need it: down at the top, up everywhere else.
export function scrollBtn(el: HTMLElement) {
  const next =
    el.scrollHeight - el.clientHeight < 500
      ? ''
      : el.scrollTop < 200
        ? 'down'
        : 'up';

  if ((appState.toTop || '') !== next) {
    appState.toTop = next;
    paintToTop();
  }
}

export function scrolled(id: string, el: HTMLElement) {
  appState.scrollId = id;

  if (id === 'main') {
    appState.mainTop = el.scrollTop;

    if (appState.view === 'pr' && !appState.restoring && !scrollRaf) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const tab = appState.tabs[tabIdx()];

        if (tab) {
          tab.scroll = el.scrollTop;
          tab.tab = appState.tab;
        }
      });
    }
  }

  scrollBtn(el);

  // The comment bar opens by itself when you reach the end of the thread, and folds away again when you scroll back up.
  const item = appState.composerBox;

  if (!item || item.in !== id) {
    return;
  }

  const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
  const up = el.scrollTop < lastTop;
  lastTop = el.scrollTop;

  if (dist < 24 && !atEnd) {
    atEnd = true;

    if (!composerOpen()) {
      setComposer(true, false);
    }
  }

  if (dist > item.h + 60) {
    atEnd = false;

    if (up && composerOpen() && !(appState.draft.comment || '').trim()) {
      blurDraft('comment');
      setComposer(false);
    }
  }
}

// Home goes back to the top of whatever scrolled last.
export const homeKey = (event: KeyboardEvent) => {
  if (
    (event.key === 'Home' || event.key === 'End') &&
    !(event.target as HTMLElement).closest?.(
      'input, textarea, select, [contenteditable]',
    ) &&
    appState.scrollId
  ) {
    event.preventDefault();

    if (event.key === 'Home') {
      toTop();
    } else {
      toBottom();
    }
  }
};
