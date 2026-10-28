import {
  applySuggestion,
  cbarKey,
  cmMenu,
  disableAuto,
  doMerge,
  enableAuto,
  getMine,
  lcAdd,
  lcCancel,
  lcDel,
  lcOpen,
  lcSuggest,
  markReady,
  reactAdd,
  reactToggle,
  rerender,
  rerunChecks,
  reviewDialog,
  sendComment,
  sendReply,
  setDiffMode,
  threadAct,
  toDraft,
  toggleClosed,
  toggleComposer,
  toggleMb,
  updateBranch,
} from './actions';
import { foldAllConv } from './bind';
import { appState } from './core';
import { foldToggle } from './fold';
import { commitList, openCommits, setFr } from './mergebox';
import { render, scrollMain } from './pages';
import { jumpUnresolved } from './timeline';

import type { ConvHandlers } from '../components/Comments';
import type { FilesHandlers } from '../components/Merge';
import type { AttentionHandlers } from '../components/Timeline';
import type { DiffHandlers } from './diff';
import type { TlHandlers } from './timeline';

// One set of comment handlers for every live view that shows comments (conversation, timeline, diff lines, split view).
export const convOn: ConvHandlers = {
  fold: (event, key, def) => foldToggle(event, key, def),
  menu: (event, element) => cmMenu(event, element),
  react: {
    toggle: (event, kind, id, color) => reactToggle(event, kind, id, color),
    add: (event, element) => reactAdd(event, element),
    hover: (kind, id) => {
      getMine(kind, id);
    },
  },
  thread: (event, node, how) => {
    threadAct(event, node, how);
  },
  sug: (event, id) => applySuggestion(event, id),
  reply: id => {
    sendReply(id);
  },
};

export const diffOn: DiffHandlers = {
  conv: convOn,
  plus: event => lcOpen(event),
  lc: {
    del: id => lcDel(id),
    cancel: () => lcCancel(),
    suggest: event => lcSuggest(event),
    add: () => lcAdd(),
  },
};

export const keep = (fn: () => void) => {
  appState.keepScroll = true;
  fn();
  render();
  appState.keepScroll = false;
};

export function openTab(key: string) {
  appState.tab = key;
  render();
  scrollMain(0);
}

export const filesOn: FilesHandlers = {
  commits: () => openCommits(),
  all: () => setFr(null),
  step: count => {
    const cs = commitList(appState.bundle!);
    const index = (appState.fr?.a ?? 0) + count;

    if (cs[index]) {
      setFr({ a: index, b: index });
    }
  },
  mode: message => setDiffMode(message),
  sort: event => {
    appState.fileSort = (event.target as HTMLSelectElement).value;
    rerender();
  },
  finish: () => reviewDialog(),
  foldAll: (allFolded, names) => {
    names.forEach(name => {
      appState.fold[`f:${name}`] = !allFolded;
    });

    localStorage.setItem('fold', JSON.stringify(appState.fold));
    rerender();
  },
  fold: (event, key, def) => foldToggle(event, key, def),
};

export const attOn: AttentionHandlers = {
  next: () => jumpUnresolved(),
  unres: () =>
    keep(() => {
      appState.unres = !appState.unres;
    }),
  tab: openTab,
};

export const tlOn: TlHandlers = {
  conv: convOn,
  bars: {
    who: word =>
      keep(() => {
        appState.who = appState.who.includes(word)
          ? appState.who.filter(text => text !== word)
          : [...appState.who, word];
      }),
    whoClear: () =>
      keep(() => {
        appState.who = [];
      }),
    range: event =>
      keep(() => {
        appState.range = (event.target as HTMLInputElement).value;

        if (appState.range === 'custom' && !appState.rFrom && !appState.rTo) {
          const handler = (time: number) =>
            new Date(time - new Date().getTimezoneOffset() * 6e4)
              .toISOString()
              .slice(0, 10);

          appState.rTo = handler(Date.now());
          appState.rFrom = handler(Date.now() - 7 * 864e5);
        }
      }),
    from: event =>
      keep(() => {
        appState.rFrom = (event.target as HTMLInputElement).value;
      }),
    to: event =>
      keep(() => {
        appState.rTo = (event.target as HTMLInputElement).value;
      }),
    sort: () =>
      keep(() => {
        appState.sort = appState.sort === 'desc' ? 'asc' : 'desc';
        localStorage.setItem('csort', appState.sort);
      }),
  },
  foldAll: foldAllConv,
  tab: openTab,
  merge: {
    toggle: (event, key) => toggleMb(event, key),
    rerun: event => {
      rerunChecks(event);
    },
    update: () => {
      updateBranch();
    },
    ready: () => {
      markReady();
    },
  },
  act: {
    close: () => toggleClosed(),
    merge: () => doMerge(),
    noauto: () => {
      disableAuto();
    },
    auto: () => {
      enableAuto();
    },
    draft: () => toDraft(),
    method: event => {
      appState.method = (event.currentTarget as HTMLSelectElement).value;
      rerender();
    },
  },
  composer: {
    toggle: () => toggleComposer(),
    key: event => cbarKey(event),
    send: () => {
      sendComment();
    },
    close: () => toggleClosed(),
    measure: meta => {
      appState.composerBox = meta;
    },
  },
};
