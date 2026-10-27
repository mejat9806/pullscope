import { ToTop } from '../components/ToTop';
import { scrollTarget } from '../components/req';
import { blurDraft, composerOpen } from './actions';
import { S } from './core';
import { setComposer } from './keyboard';
import { scrollMain } from './pages';
import { setSlot } from './frame';
import { tabIdx } from './tabs';

// What every scrolling pane reports: the page and each split-view pane call `scrolled` from their own onScroll.
let scrollRaf = 0, lastTop = 0, atEnd = false;

export const toTop = (smooth = true) => { if (S.scrollId && S.scrollId !== 'main') scrollTarget(S.scrollId, 0, smooth); else scrollMain(0, smooth); };
export const paintToTop = () => setSlot('totop', <ToTop hidden={!S.toTop} onClick={() => toTop()} />);

export function scrolled(id: string, el: HTMLElement) {
  S.scrollId = id;
  if (id === 'main') {
    S.mainTop = el.scrollTop;
    if (S.view === 'pr' && !S.restoring && !scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; const t = S.tabs[tabIdx()]; if (t) { t.scroll = el.scrollTop; t.tab = S.tab; } });
  }
  // The back-to-top button shows once you are well down the page (or a split-view pane).
  if (!!S.toTop !== el.scrollTop >= 600) { S.toTop = !S.toTop; paintToTop(); }
  // The comment bar opens by itself when you reach the end of the thread, and folds away again when you scroll back up.
  const c = S.composerBox; if (!c || c.in !== id) return;
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight, up = el.scrollTop < lastTop; lastTop = el.scrollTop;
  if (dist < 24 && !atEnd) { atEnd = true; if (!composerOpen()) setComposer(true, false); }
  if (dist > c.h + 60) { atEnd = false; if (up && composerOpen() && !(S.draft.comment || '').trim()) { blurDraft('comment'); setComposer(false); } }
}

// Home goes back to the top of whatever scrolled last.
export const homeKey = (e: KeyboardEvent) => { if (e.key === 'Home' && !(e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]') && S.scrollId) { e.preventDefault(); toTop(); } };
