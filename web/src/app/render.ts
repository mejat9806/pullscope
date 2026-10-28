import { appState } from './core';
import { openPr, openRepo } from './nav';

export const go = (count: number) => {
  const time = appState.hi + count;

  if (time < 0 || time >= appState.hist.length) {
    return;
  }

  appState.hi = time;

  if (appState.hist[time].startsWith('repo:')) {
    openRepo(appState.hist[time].slice(5), { nav: true });
  } else {
    openPr(appState.hist[time], { nav: true });
  }
};
