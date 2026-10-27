import { S, $ } from './core';
import { rerender } from './actions';
import { isFolded } from './comments';

// Live folds: flip the state and repaint; when a block is opened, bring it on screen (only scroll when part of it is cut off).
export function foldToggle(e: Event, k: string, def: boolean) {
  e.stopPropagation(); if ((e.target as HTMLElement).closest('a')) return;
  const el = e.currentTarget as HTMLElement, now = !isFolded(k, def);
  S.fold[k] = now; localStorage.setItem('fold', JSON.stringify(S.fold));
  rerender();
  if (now) return;
  const box = el.closest<HTMLElement>('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'), main = $('.main'); if (!box || !main || !main.contains(box)) return;
  const r = box.getBoundingClientRect(), m = main.getBoundingClientRect();
  if (r.bottom > m.bottom - 8 || r.top < m.top) box.scrollIntoView({ block: r.height > m.height * 0.85 ? 'start' : 'center', behavior: 'smooth' });
}
