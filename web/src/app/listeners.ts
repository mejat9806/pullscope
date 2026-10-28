import { appState } from './core';
import { openPr } from './nav';
import { render } from './pages';

if (window.__TAURI__ && window.__TAURI__.event) {
  window.__TAURI__.event.listen<{ ref?: string; target?: string }>(
    'notif-click',
    entry => {
      const { ref, target } = entry.payload || {};

      if (!ref) {
        return;
      }

      appState.nav = false;
      appState.bell = false;
      appState.focus = target || '';
      openPr(ref);
    },
  );
}

export const goOffline = () => {
  appState.offline = true;
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
};

export const goOnline = () => {
  appState.offline = false;

  if (appState.bundle && appState.view === 'pr') {
    openPr(
      `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`,
      {
        nav: true,
        keepTab: true,
      },
    );
  } else {
    render();
  }
};
