import { InboxPage, NewPr, NotesPage } from '../components/Pages';
import { Crumbs, PrListPage } from '../components/PrList';
import { rerender, saveDrafts, setBusy, syncDraft } from './actions';
import { bpOpen } from './addressbar';
import { openAux, openClick, openCtx } from './bind';
import { appState, tauri } from './core';
import { pollNotes, pushDis } from './data';
import { confetti } from './fun';
import { crumbs } from './home';
import { ibPin, ibSnooze, viewApply, viewDelete, viewSave } from './inboxtools';
import { openPr, openRepo } from './nav';
import {
  bumpNp,
  IB_TITLES,
  ibOrder,
  ibSecKey,
  inboxProps,
  loadInbox,
  newPrProps,
  notesProps,
  npCompare,
  npLoadBranches,
  openNewPr,
  render,
  saveNotes,
} from './pages';
import { prListProps } from './prlist';
import { roGrip, roMove } from './reorder';

import type {
  InboxHandlers,
  NewPrHandlers,
  NotesHandlers,
} from '../components/Pages';
import type { PrListHandlers } from '../components/PrList';
import type { NpListKey } from '../types';

const open = { open: openClick, aux: openAux, ctx: openCtx };

const typedPf = (event: Event) => {
  appState.pf = (event.target as HTMLInputElement).value;
  render();
};

const prl: PrListHandlers = {
  ...open,
  ps: text => {
    appState.prState = text;
    openRepo(appState.repo!, { nav: true });
  },
  compare: (repo, br) => openNewPr(repo, br),
  dismiss: key => {
    pushDis[key] = 1;
    localStorage.setItem('pushdismiss', JSON.stringify(pushDis));
    rerender();
  },
  filter: typedPf,
  author: event => {
    appState.pAuthor = (event.target as HTMLSelectElement).value;
    render();
  },
  label: event => {
    appState.pLabel = (event.target as HTMLSelectElement).value;
    render();
  },
  status: event => {
    appState.pStatus = (event.target as HTMLSelectElement).value;
    render();
  },
  sort: event => {
    appState.psort = (event.target as HTMLSelectElement).value;
    localStorage.setItem('psort', appState.psort);
    render();
  },
  clear: () => {
    appState.pf = appState.pAuthor = appState.pLabel = appState.pStatus = '';
    render();
  },
};

export function RepoView() {
  return (
    <>
      <Crumbs
        repo={appState.repo!}
        trail={[{ t: 'Pull requests' }]}
        on={crumbs}
      />
      <PrListPage p={prListProps()} on={prl} />
    </>
  );
}

const keep = (fn: () => void) => {
  appState.keepScroll = true;
  fn();
  render();
  appState.keepScroll = false;
};

const notes: NotesHandlers = {
  ...open,
  check: () => pollNotes(),
  readAll: () =>
    keep(() => {
      appState.notes.forEach(note => (note.read = true));
      saveNotes();
    }),
  clear: () =>
    keep(() => {
      appState.notes = [];
      saveNotes();
    }),
  filter: field =>
    keep(() => {
      appState.nf = field;
    }),
  read: (event, id) => {
    event.stopPropagation();

    const note = appState.notes.find(
      otherNote => String(otherNote.id) === String(id),
    );

    if (note) {
      keep(() => {
        note.read = !note.read;
        saveNotes();
      });
    }
  },
  del: (event, id) => {
    event.stopPropagation();

    keep(() => {
      appState.notes = appState.notes.filter(
        note => String(note.id) !== String(id),
      );

      saveNotes();
    });
  },
};

export function NotesView() {
  return (
    <>
      <Crumbs repo="" trail={[{ t: 'Notifications' }]} on={crumbs} />
      <NotesPage {...notesProps()} on={notes} />
    </>
  );
}

const foldSave = () => {
  try {
    localStorage.setItem('fold', JSON.stringify(appState.fold));
  } catch {
    /* storage full */
  }

  render();
};

const ibSave = (options: string[]) => {
  appState.ibOrder = options.length ? options : undefined;

  try {
    if (options.length) {
      localStorage.setItem('iborder', JSON.stringify(options));
    } else {
      localStorage.removeItem('iborder');
    }
  } catch {
    /* storage full */
  }

  render();
};

const IB_SEL = '.ib-sec[data-t]';

const ibGrip = (event: MouseEvent, title: string) =>
  roGrip(event, 'ib', IB_SEL, title, ibOrder, ibSave);

const inbox: InboxHandlers = {
  ...open,
  refresh: () => loadInbox(true),
  sort: event => {
    appState.ibSort = (event.target as HTMLSelectElement).value;

    try {
      localStorage.setItem('ibsort', appState.ibSort);
    } catch {
      /* ignore */
    }

    render();
  },
  query: event => {
    appState.ibQ = (event.target as HTMLInputElement).value;
    render();
  },
  fold: key => {
    appState.fold[key] = !appState.fold[key];
    foldSave();
  },
  move: (text, by) => {
    const options = ibOrder();
    const index = options.indexOf(text);
    const otherIndex = index + by;

    if (index < 0 || otherIndex < 0 || otherIndex >= options.length) {
      return;
    }

    [options[index], options[otherIndex]] = [
      options[otherIndex],
      options[index],
    ];

    roMove(IB_SEL, text, () => ibSave(options));
  },
  grip: ibGrip,
  resetOrder: () => ibSave([]),
  pin: ibPin,
  snooze: ibSnooze,
  snoozeMenu: text => {
    appState.ibSnzOpen = appState.ibSnzOpen === text ? '' : text;
    render();
  },
  viewApply,
  viewSave,
  viewDelete,
  viewNaming: on => {
    appState.ibNaming = on;
    render();
  },
  foldAll: closed => {
    IB_TITLES.forEach(text => {
      appState.fold[ibSecKey(text)] = closed;
    });

    foldSave();
  },
};

export function InboxView() {
  return (
    <>
      <Crumbs repo="" trail={[{ t: 'Inbox' }]} on={crumbs} />
      <InboxPage p={inboxProps()} on={inbox} />
    </>
  );
}

const np = () => appState.np!;

const npSet = (handler: () => void) => {
  handler();
  np().key = `${np().repo}|${np().base}|${np().head}`;
};

const val = (event: Event) => (event.target as HTMLInputElement).value;

const newpr: NewPrHandlers = {
  cancel: () => {
    appState.view = appState.bundle ? 'pr' : 'home';
    delete appState.draft.newpr;
    render();
  },
  repo: event =>
    bpOpen(
      event.currentTarget as HTMLElement,
      'repo',
      value => {
        npSet(() => {
          np().repo = value;
          np().base = '';
          np().head = '';
          np().cmp = null;
          np().titleTouched = false;
          np().title = '';
        });

        render();
        npLoadBranches(np().repo);
      },
      true,
    ),
  repoIn: event => {
    npSet(() => {
      np().repo = val(event).trim();
      np().base = '';
      np().head = '';
    });

    npLoadBranches(np().repo);
  },
  base: event =>
    bpOpen(event.currentTarget as HTMLElement, 'base', value => {
      npSet(() => {
        np().base = value;
      });

      npCompare();
    }),
  head: event =>
    bpOpen(event.currentTarget as HTMLElement, 'head', value => {
      npSet(() => {
        np().head = value;
        np().titleTouched = false;
      });

      npCompare();
    }),
  swap: () => {
    npSet(() => {
      [np().base, np().head] = [np().head, np().base];
    });

    npCompare();
  },
  tpl: event => {
    const newPr = np();
    const sel = event.target as HTMLSelectElement;
    const templates = newPr.tpl[`${newPr.repo}|${newPr.base}`] || [];
    const cur = (appState.draft.newpr || '').trim();
    const next = sel.value === '-1' ? '' : templates[+sel.value].body;

    if (
      cur &&
      cur !== newPr.tplText.trim() &&
      !confirm('Replace what you have written with this template?')
    ) {
      rerender();

      return;
    }

    appState.draft.newpr = newPr.tplText = next;
    saveDrafts();
    bumpNp();
    rerender();
    syncDraft('newpr');
  },
  title: event => {
    np().title = val(event);
    np().titleTouched = true;
    render();
  },
  draft: event => {
    np().draft = (event.target as HTMLInputElement).checked;
    render();
  },
  add: (npListKey: NpListKey, event) => {
    if (val(event)) {
      np()[npListKey].push(val(event));
      render();
    }
  },
  del: (npListKey: NpListKey, value) => {
    np()[npListKey] = np()[npListKey].filter((text: string) => text !== value);
    render();
  },
  mile: event => {
    np().milestone = val(event);
  },
  issues: event => {
    np().issues = val(event);
  },
  create: async () => {
    const newPr = np();
    const sel = '#npcreate';
    setBusy(sel, true);
    newPr.err = '';

    try {
      const nums = [...new Set(newPr.issues.match(/\d+/g) || [])];

      const body = (
        (appState.draft.newpr || '').trim() +
        (nums.length
          ? `\n\n${nums.map(text => `Closes #${text}`).join('\n')}`
          : '')
      ).trim();

      const extra = {
        reviewers: newPr.reviewers,
        assignees: newPr.assignees,
        labels: newPr.labels,
        milestone: newPr.milestone ? Number(newPr.milestone) : null,
      };

      const createdPr = await tauri!.invoke('create_pr', {
        repo: newPr.repo,
        base: newPr.base,
        head: newPr.head,
        title: newPr.title,
        body,
        draft: newPr.draft,
        extra,
      });

      const warn = createdPr.warnings?.length
        ? `Created, but ${createdPr.warnings.join(' · ')}`
        : '';

      delete appState.draft.newpr;
      saveDrafts();
      appState.np = null;
      confetti();
      await openPr(`${newPr.repo}#${createdPr.number}`, { nav: true });

      if (warn) {
        appState.actErr = { k: 'comment', m: warn };
        rerender();
      }
    } catch (err) {
      newPr.err = String(err).replace(/^Error: /, '');
    } finally {
      setBusy(sel, false);
    }
  },
};

export function NewPrView() {
  return (
    <>
      <Crumbs
        repo={np().repo}
        trail={[{ t: 'New pull request' }]}
        on={crumbs}
      />
      <NewPr p={newPrProps()} on={newpr} />
    </>
  );
}
