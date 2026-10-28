import { reveal } from '../components/req';
import { rerender } from './actions';
import { isFolded } from './comments';
import { appState } from './core';

// Live folds: flip the state and repaint; when a block is opened, bring it on screen (the block scrolls itself only when part of it is cut off).
export function foldToggle(event: Event, key: string, def: boolean) {
  event.stopPropagation();

  if ((event.target as HTMLElement).closest('a')) {
    return;
  }

  const now = !isFolded(key, def);
  appState.fold[key] = now;
  localStorage.setItem('fold', JSON.stringify(appState.fold));
  rerender();

  if (!now) {
    reveal(key);
  }
}
