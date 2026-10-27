import { S } from './core';
import { reveal } from '../components/req';
import { rerender } from './actions';
import { isFolded } from './comments';

// Live folds: flip the state and repaint; when a block is opened, bring it on screen (the block scrolls itself only when part of it is cut off).
export function foldToggle(e: Event, k: string, def: boolean) {
  e.stopPropagation(); if ((e.target as HTMLElement).closest('a')) return;
  const now = !isFolded(k, def);
  S.fold[k] = now; localStorage.setItem('fold', JSON.stringify(S.fold));
  rerender();
  if (!now) reveal(k);
}
