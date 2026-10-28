import type { FileChange } from '../types';
import { S, load } from './core';
import { rerender } from './actions';

// "Viewed" marks per pull request and file, kept locally. A mark is dropped when the file changes (its blob id or size differs).
const stamp = (f: FileChange) => f.sha || `${f.additions}/${f.deletions}`;
const key = () => `${S.bundle?.pull.base.repo.full_name}#${S.bundle?.pull.number}`;
const all = () => (S.viewed ||= load<Record<string, Record<string, string>>>('viewed', {}));
const save = () => { try { localStorage.setItem('viewed', JSON.stringify(all())); } catch { /* storage full */ } };

export const isViewed = (f: FileChange) => all()[key()]?.[f.filename] === stamp(f);
export const viewedCount = (files: FileChange[]) => files.filter(isViewed).length;

// Marking a file viewed folds it away, like GitHub; unmarking opens it again.
export function toggleViewed(f: FileChange) {
  const m = (all()[key()] ||= {}), on = !isViewed(f);
  if (on) m[f.filename] = stamp(f); else delete m[f.filename];
  S.fold['f:' + f.filename] = on; try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* ignore */ }
  save(); rerender();
}
export function viewedAll(files: FileChange[], on: boolean) {
  const m = (all()[key()] ||= {});
  files.forEach((f) => { if (on) m[f.filename] = stamp(f); else delete m[f.filename]; S.fold['f:' + f.filename] = on; });
  try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* ignore */ } save(); rerender();
}
