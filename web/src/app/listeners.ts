import { S } from './core';
import { openPr } from './nav';
import { render } from './pages';

if (window.__TAURI__ && window.__TAURI__.event) {
  window.__TAURI__.event.listen<{ ref?: string; target?: string }>(
    'notif-click',
    e => {
      const { ref, target } = e.payload || {};

      if (!ref) {
        return;
      }

      S.nav = false;
      S.bell = false;
      S.focus = target || '';
      openPr(ref);
    },
  );
}

export const goOffline = () => {
  S.offline = true;
  S.keepScroll = true;
  render();
  S.keepScroll = false;
};

export const goOnline = () => {
  S.offline = false;

  if (S.bundle && S.view === 'pr') {
    openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, {
      nav: true,
      keepTab: true,
    });
  } else {
    render();
  }
};
