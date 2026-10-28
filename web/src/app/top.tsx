import { TabStrip } from '../components/TabStrip';
import { Toolbar } from '../components/Toolbar';
import { btnSel, rerender, setBusy } from './actions';
import {
  addrBlur,
  addrFocus,
  addrInput,
  addrKey,
  addrSubmit,
  avUrl,
  openExternal,
  openFromList,
  winDrag,
} from './addressbar';
import { fastTab, stashCurrent } from './bind';
import { appState, isDark, isOff, tauri } from './core';
import { closePop, openPop, paintDlg } from './dialogs';
import { beginDrag, setSlot } from './frame';
import { openPr, reload } from './nav';
import { setBell } from './notes';
import { openInbox, openNewPr, render, setDragging } from './pages';
import { go } from './render';
import { repoPickOpen } from './repopick';
import { closeTab, curRef, reopenTab, saveTabs, tabSnap } from './tabs';
import { tokenDialog } from './token';

import type { TabHandlers } from '../components/TabStrip';
import type { ToolbarHandlers } from '../components/Toolbar';

const keep = (fn: () => void) => {
  appState.keepScroll = true;
  fn();
  render();
  appState.keepScroll = false;
};

const mode = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const left = rect.left + rect.width / 2;
  const offset = rect.top + rect.height / 2;
  appState.mode = isDark() ? 'light' : 'dark';
  localStorage.setItem('mode', appState.mode);

  // The switch, its label and the page colours all come from S.mode; the view transition just wraps the repaint.
  const swap = () => {
    appState.themePop = (appState.themePop || 0) + 1;

    keep(() => {});
  };

  if (!document.startViewTransition) {
    swap();

    return;
  }

  const end = Math.hypot(
    Math.max(left, innerWidth - left),
    Math.max(offset, innerHeight - offset),
  );

  document.startViewTransition(swap).ready.then(
    () =>
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${left}px ${offset}px)`,
            `circle(${end}px at ${left}px ${offset}px)`,
          ],
        },
        {
          duration: 750,
          easing: 'cubic-bezier(.4,0,.2,1)',
          pseudoElement: '::view-transition-new(root)',
        },
      ).finished,
  );
};

const prof = (event: MouseEvent) => {
  event.stopPropagation();

  if (appState.pop?.k === 'prof') {
    closePop();

    return;
  }

  const pr = appState.profile!;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  openPop({
    k: 'prof',
    right: Math.max(8, innerWidth - rect.right),
    top: rect.bottom + 6,
    name: pr.name || pr.login,
    ver: appState.ver,
    login: pr.login,
    avatar: avUrl(pr.avatar_url!, 80),
    pick: async hash => {
      closePop();

      if (hash === 'profile') {
        openExternal(pr.html_url!);
      } else if (hash === 'token') {
        tokenDialog();
      } else if (hash === 'repos') {
        repoPickOpen();
      } else if (hash === 'appearance') {
        appState.dlg = { k: 'appearance' };
        paintDlg();
      } else {
        try {
          await tauri?.invoke('set_token', { token: '' });
        } catch {
          /* ignore */
        }

        appState.hasToken = false;
        appState.profile = null;
        appState.me = '';
        appState.repos = null;

        try {
          localStorage.removeItem('profile');
        } catch {
          /* ignore */
        }

        render();
      }
    },
  });
};

const tb: ToolbarHandlers = {
  nav: event => {
    event.stopPropagation();

    if (matchMedia('(min-width: 901px)').matches) {
      appState.hide.nav = !appState.hide.nav;

      try {
        localStorage.setItem('hide', JSON.stringify(appState.hide));
      } catch {
        /* storage full */
      }

      keep(() => {});

      return;
    }

    keep(() => {
      appState.nav = !appState.nav;
    });
  },
  back: () => go(-1),
  fwd: () => go(1),
  reload,
  external: () => openExternal(appState.bundle!.pull.html_url),
  mode,
  drag: event => winDrag(event),
  addr: event => addrSubmit(event),
  input: event => addrInput(event),
  focus: event => addrFocus(event),
  blur: () => addrBlur(),
  key: event => addrKey(event),
  upd: async () => {
    const item = appState.update;

    if (!item || item.busy) {
      return;
    }

    item.busy = true;
    render();

    try {
      await item.obj.downloadAndInstall();
      await window.__TAURI__!.process.relaunch();
    } catch (error) {
      item.busy = false;
      appState.actErr = { k: 'update', m: `Update failed: ${String(error)}` };
      render();
    }
  },
  retry: ev => {
    const sel = btnSel(ev.currentTarget as HTMLElement);
    setBusy(sel, true);
    appState.offline = navigator.onLine === false;
    Promise.resolve(reload()).finally(() => setBusy(sel, false));
  },
  newPr: () => openNewPr(),
  inbox: openInbox,
  bell: event => {
    event.stopPropagation();
    setBell(!appState.bell);
  },
  signin: tokenDialog,
  prof,
};

// The click that ends a tab drag must not also open the tab.
let swallowClick = false;

// Drag a tab sideways to reorder (pointer based, so it also works where the webview swallows HTML5 drag and drop). The drag is state (S.drag) that the tab strip draws.
const tabDown = (event: MouseEvent, from: number) => {
  const el = event.currentTarget as HTMLElement;

  if (
    event.button !== 0 ||
    (event.target as HTMLElement).closest<HTMLElement>('.pt-x')
  ) {
    return;
  }

  const x0 = event.clientX;
  const width = el.offsetWidth;

  let moved = false;
  let to = from;

  const mids = [
    ...el.parentElement!.querySelectorAll<HTMLElement>('.ptab'),
  ].map(element => {
    const rect = element.getBoundingClientRect();

    return rect.left + rect.width / 2;
  });

  const mv = (ev: MouseEvent) => {
    if (!moved && Math.abs(ev.clientX - x0) < 6) {
      return;
    }

    if (!moved) {
      moved = true;
      setDragging(true);
    }

    to = mids.reduce(
      (best, minutes, index) => (ev.clientX > minutes ? index : best),
      0,
    );

    appState.drag = { from, to, dx: ev.clientX - x0, w: width };
    paintTop();
  };

  const up = () => {
    setDragging(false);

    if (!moved) {
      return;
    }

    swallowClick = true;

    setTimeout(() => {
      swallowClick = false;
    }, 0);

    appState.drag = null;

    if (to !== from) {
      const [tab] = appState.tabs.splice(from, 1);
      appState.tabs.splice(to, 0, tab);
      saveTabs();
    }

    render();
  };

  beginDrag({ move: mv, end: up });
};

const ts: TabHandlers = {
  open: index => {
    if (swallowClick) {
      return;
    }

    const tab = appState.tabs[index];

    if (tab.ref !== curRef()) {
      if (fastTab(tab.ref)) {
        return;
      }

      stashCurrent();
      tabSnap();
      appState.fadeMain = true;
      appState.tabMenu = false;
      openPr(tab.ref, { nav: true, restore: tab.tab });
    }
  },
  aux: (event, index) => {
    if (event.button === 1) {
      event.preventDefault();
      closeTab(index);
    }
  },
  down: tabDown,
  close: (event, index) => {
    event.stopPropagation();
    closeTab(index);
  },
  add: event => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    appState.tabMenuAt = {
      top: rect.bottom + 4,
      left: Math.min(rect.left, innerWidth - 350),
    };

    appState.tabMenu = !appState.tabMenu;
    rerender();
  },
  fresh: ref => openFromList(ref, true),
  home: () => {
    appState.tabMenu = false;
    appState.view = 'home';
    render();
  },
  reopen: () => {
    appState.tabMenu = false;
    reopenTab();
  },
};

export function Top() {
  const bundle = appState.bundle;
  const pr = appState.profile;
  const open = new Set(appState.tabs.map(tab => tab.ref));

  return (
    <>
      {appState.refreshing && <div class="refreshing-bar"></div>}
      <Toolbar
        text={
          appState.addrText ??
          (bundle
            ? `${bundle.pull.base.repo.full_name}#${bundle.pull.number}`
            : '')
        }
        hasBundle={!!bundle}
        canBack={!(appState.hist.length < 2 || appState.hi < 1)}
        canFwd={!(appState.hi >= appState.hist.length - 1)}
        update={
          appState.update
            ? { busy: appState.update.busy, version: appState.update.version }
            : null
        }
        offline={isOff()}
        unread={appState.notes.filter(note => !note.read).length}
        dark={isDark()}
        pop={appState.themePop || 0}
        profile={pr}
        hasToken={appState.hasToken}
        avatar={appState.hasToken && pr ? avUrl(pr.avatar_url!, 56) : ''}
        on={tb}
      />
      <TabStrip
        tabs={appState.tabs}
        cur={appState.tabPending || curRef()}
        recents={appState.recent
          .filter(recentEntry => !open.has(recentEntry.ref))
          .slice(0, 8)}
        menu={appState.tabMenu}
        menuAt={appState.tabMenuAt || null}
        drag={appState.drag || null}
        closedFirst={appState.closed.length ? appState.closed[0].ref : null}
        on={ts}
      />
    </>
  );
}

export const paintTop = () => setSlot('top', <Top />);

export const clearTop = () => setSlot('top', null);
