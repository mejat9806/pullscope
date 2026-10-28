import { noteClick } from './actions';
import { bpAway, loadProfile } from './addressbar';
import { appState, tauri } from './core';
import { pollNotes, qc } from './data';
import { closePop } from './dialogs';
import { setGlobals } from './frame';
import { ripple } from './fun';
import { menuAway, shortcut } from './keyboard';
import { goOffline, goOnline } from './listeners';
import { loadRepos, openPr } from './nav';
import { notesAway, notesKey } from './notes';
import { render } from './pages';
import { helpKey } from './palette';
import { paintToTop } from './scrolling';
import { homeKey } from './scrolling';
import { restoreZoom, zoomKey, zoomWheel } from './zoom';

export const urlParams = new URLSearchParams(location.search);

if (urlParams.get('mode')) {
  appState.mode = urlParams.get('mode')!;
}

if (urlParams.get('tab')) {
  appState.tab = urlParams.get('tab')!;
}

if (urlParams.get('split')) {
  appState.split = urlParams.get('split') === '1';
}

if (tauri) {
  tauri!
    .invoke('has_token')
    .then(flag => {
      appState.hasToken = flag;
      appState.authChecked = true;
      render();

      if (flag) {
        loadRepos();
        loadProfile();
      }
    })
    .catch(() => {
      appState.authChecked = true;
      appState.hasToken = false;
      render();
    });
}

restoreZoom();

window.__TAURI__?.app
  ?.getVersion?.()
  .then(value => {
    appState.ver = value;
  })
  .catch(() => {});

setGlobals({
  pointerDown: event => ripple(event),
  clickCapture: event => noteClick(event),
  click: () => closePop(),
  mouseDown: event => {
    menuAway(event);
    notesAway(event);
    bpAway(event);
  },
  key: event => {
    zoomKey(event);
    shortcut(event);
    notesKey(event);
    helpKey(event);
    homeKey(event);
  },
  wheel: event => zoomWheel(event),
  focus: () => refocus(),
  online: () => goOnline(),
  offline: () => goOffline(),
});

render();

if (urlParams.get('fixture')) {
  openPr(urlParams.get('fixture')!).then(() => {
    if (urlParams.get('tab')) {
      appState.tab = urlParams.get('tab')!;
      render();
    }
  });
} else if (tauri) {
  tauri!.invoke('initial_arg').then(arg => {
    if (arg) {
      openPr(arg);
    } else {
      appState.view = 'home';
      render();
    }
  });
}

setInterval(pollNotes, 60000);
setTimeout(pollNotes, 4000);

// refetchOnWindowFocus: coming back to the app tops up a PR that has gone stale.
export const refocus = () => {
  const bundle = appState.bundle;

  if (
    !tauri ||
    !bundle ||
    appState.view !== 'pr' ||
    appState.loading ||
    appState.refreshing
  ) {
    return;
  }

  const key = `${bundle.pull.base.repo.full_name}#${bundle.pull.number}`;

  if (!qc.fresh(key, 60000)) {
    openPr(key, { nav: true, keepTab: true });
  }
};

setTimeout(pollNotes, 8000);

if (new URLSearchParams(location.search).get('demonote')) {
  appState.notes = [
    {
      id: 1,
      ref: 'octocat/Hello-World#6',
      title: 'New line at end of file.',
      text: '3 new commits, 2 new comments',
      at: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      ref: 'octocat/Hello-World#6',
      title: 'New line at end of file.',
      text: 'now merged',
      at: new Date(Date.now() - 36e5).toISOString(),
      read: true,
    },
  ];

  appState.bell = true;
  render();
}

// Check GitHub Releases for a newer signed build a few seconds after launch, then again every 6 hours.
export async function checkUpdate() {
  const up = window.__TAURI__?.updater;

  if (!up || appState.update?.busy) {
    return;
  }

  try {
    const updateHandle = await up.check();

    if (updateHandle) {
      appState.update = { version: updateHandle.version, obj: updateHandle };
      render();
    }
  } catch {}
}

if (tauri) {
  setTimeout(checkUpdate, 6000);
  setInterval(checkUpdate, 6 * 3600 * 1000);
}

paintToTop();
