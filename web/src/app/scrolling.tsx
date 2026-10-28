import { scrollTarget } from '../components/req';
import { ToTop } from '../components/ToTop';
import { blurDraft, composerOpen } from './actions';
import { S } from './core';
import { setSlot } from './frame';
import { setComposer } from './keyboard';
import { scrollMain } from './pages';
import { tabIdx } from './tabs';

// What every scrolling pane reports: the page and each split-view pane call `scrolled` from their own onScroll.
let scrollRaf = 0;
let lastTop = 0;
let atEnd = false;

export const toTop = (smooth = true) => {
  if (S.scrollId && S.scrollId !== 'main') {
    scrollTarget(S.scrollId, 0, smooth);
  } else {
    scrollMain(0, smooth);
  }
};

export const toBottom = (smooth = true) => {
  if (S.scrollId && S.scrollId !== 'main') {
    scrollTarget(S.scrollId, 1e7, smooth);
  } else {
    scrollMain(1e7, smooth);
  }
};

export const paintToTop = () =>
  setSlot(
    'totop',
    <ToTop
      dir={S.toTop || ''}
      onClick={() => (S.toTop === 'down' ? toBottom() : toTop())}
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

  if ((S.toTop || '') !== next) {
    S.toTop = next;
    paintToTop();
  }
}

export function scrolled(id: string, el: HTMLElement) {
  S.scrollId = id;

  if (id === 'main') {
    S.mainTop = el.scrollTop;

    if (S.view === 'pr' && !S.restoring && !scrollRaf) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const t = S.tabs[tabIdx()];

        if (t) {
          t.scroll = el.scrollTop;
          t.tab = S.tab;
        }
      });
    }
  }

  scrollBtn(el);

  // The comment bar opens by itself when you reach the end of the thread, and folds away again when you scroll back up.
  const c = S.composerBox;

  if (!c || c.in !== id) {
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

  if (dist > c.h + 60) {
    atEnd = false;

    if (up && composerOpen() && !(S.draft.comment || '').trim()) {
      blurDraft('comment');
      setComposer(false);
    }
  }
}

// Home goes back to the top of whatever scrolled last.
export const homeKey = (e: KeyboardEvent) => {
  if (
    (e.key === 'Home' || e.key === 'End') &&
    !(e.target as HTMLElement).closest?.(
      'input, textarea, select, [contenteditable]',
    ) &&
    S.scrollId
  ) {
    e.preventDefault();

    if (e.key === 'Home') {
      toTop();
    } else {
      toBottom();
    }
  }
};
