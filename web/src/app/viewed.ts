import { rerender } from './actions';
import { appState, load } from './core';

import type { FileChange } from '../types';

// "Viewed" marks per pull request and file, kept locally. A mark is dropped when the file changes (its blob id or size differs).
const stamp = (fileChange: FileChange) =>
  fileChange.sha || `${fileChange.additions}/${fileChange.deletions}`;

const key = () =>
  `${appState.bundle?.pull.base.repo.full_name}#${appState.bundle?.pull.number}`;

const all = () =>
  (appState.viewed ||= load<Record<string, Record<string, string>>>(
    'viewed',
    {},
  ));

const save = () => {
  try {
    localStorage.setItem('viewed', JSON.stringify(all()));
  } catch {
    /* storage full */
  }
};

export const isViewed = (fileChange: FileChange) =>
  all()[key()]?.[fileChange.filename] === stamp(fileChange);

export const viewedCount = (files: FileChange[]) =>
  files.filter(isViewed).length;

// Marking a file viewed folds it away, like GitHub; unmarking opens it again.
export function toggleViewed(fileChange: FileChange) {
  const lookup = (all()[key()] ||= {});
  const on = !isViewed(fileChange);

  if (on) {
    lookup[fileChange.filename] = stamp(fileChange);
  } else {
    delete lookup[fileChange.filename];
  }

  appState.fold[`f:${fileChange.filename}`] = on;

  try {
    localStorage.setItem('fold', JSON.stringify(appState.fold));
  } catch {
    /* ignore */
  }

  save();
  rerender();
}

export function viewedAll(files: FileChange[], on: boolean) {
  const lookup = (all()[key()] ||= {});

  files.forEach(fileChange => {
    if (on) {
      lookup[fileChange.filename] = stamp(fileChange);
    } else {
      delete lookup[fileChange.filename];
    }

    appState.fold[`f:${fileChange.filename}`] = on;
  });

  try {
    localStorage.setItem('fold', JSON.stringify(appState.fold));
  } catch {
    /* ignore */
  }

  save();
  rerender();
}
