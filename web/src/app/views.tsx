import { InboxPage, NewPr, NotesPage } from '../components/Pages';
import { Crumbs, PrListPage } from '../components/PrList';
import { rerender, saveDrafts, setBusy, syncDraft } from './actions';
import { bpOpen } from './addressbar';
import { openAux, openClick, openCtx } from './bind';
import { S, tauri } from './core';
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

const typedPf = (e: Event) => {
  S.pf = (e.target as HTMLInputElement).value;
  render();
};

const prl: PrListHandlers = {
  ...open,
  ps: s => {
    S.prState = s;
    openRepo(S.repo!, { nav: true });
  },
  compare: (repo, br) => openNewPr(repo, br),
  dismiss: key => {
    pushDis[key] = 1;
    localStorage.setItem('pushdismiss', JSON.stringify(pushDis));
    rerender();
  },
  filter: typedPf,
  author: e => {
    S.pAuthor = (e.target as HTMLSelectElement).value;
    render();
  },
  label: e => {
    S.pLabel = (e.target as HTMLSelectElement).value;
    render();
  },
  status: e => {
    S.pStatus = (e.target as HTMLSelectElement).value;
    render();
  },
  sort: e => {
    S.psort = (e.target as HTMLSelectElement).value;
    localStorage.setItem('psort', S.psort);
    render();
  },
  clear: () => {
    S.pf = S.pAuthor = S.pLabel = S.pStatus = '';
    render();
  },
};

export function RepoView() {
  return (
    <>
      <Crumbs repo={S.repo!} trail={[{ t: 'Pull requests' }]} on={crumbs} />
      <PrListPage p={prListProps()} on={prl} />
    </>
  );
}

const keep = (fn: () => void) => {
  S.keepScroll = true;
  fn();
  render();
  S.keepScroll = false;
};

const notes: NotesHandlers = {
  ...open,
  check: () => pollNotes(),
  readAll: () =>
    keep(() => {
      S.notes.forEach(n => (n.read = true));
      saveNotes();
    }),
  clear: () =>
    keep(() => {
      S.notes = [];
      saveNotes();
    }),
  filter: f =>
    keep(() => {
      S.nf = f;
    }),
  read: (e, id) => {
    e.stopPropagation();
    const n = S.notes.find(x => String(x.id) === String(id));

    if (n) {
      keep(() => {
        n.read = !n.read;
        saveNotes();
      });
    }
  },
  del: (e, id) => {
    e.stopPropagation();

    keep(() => {
      S.notes = S.notes.filter(x => String(x.id) !== String(id));
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
    localStorage.setItem('fold', JSON.stringify(S.fold));
  } catch {
    /* storage full */
  }

  render();
};

const ibSave = (o: string[]) => {
  S.ibOrder = o.length ? o : undefined;

  try {
    if (o.length) {
      localStorage.setItem('iborder', JSON.stringify(o));
    } else {
      localStorage.removeItem('iborder');
    }
  } catch {
    /* storage full */
  }

  render();
};

const IB_SEL = '.ib-sec[data-t]';

const ibGrip = (e: MouseEvent, title: string) =>
  roGrip(e, 'ib', IB_SEL, title, ibOrder, ibSave);

const inbox: InboxHandlers = {
  ...open,
  refresh: () => loadInbox(true),
  sort: e => {
    S.ibSort = (e.target as HTMLSelectElement).value;

    try {
      localStorage.setItem('ibsort', S.ibSort);
    } catch {
      /* ignore */
    }

    render();
  },
  query: e => {
    S.ibQ = (e.target as HTMLInputElement).value;
    render();
  },
  fold: k => {
    S.fold[k] = !S.fold[k];
    foldSave();
  },
  move: (t, by) => {
    const o = ibOrder();
    const i = o.indexOf(t);
    const j = i + by;

    if (i < 0 || j < 0 || j >= o.length) {
      return;
    }

    [o[i], o[j]] = [o[j], o[i]];
    roMove(IB_SEL, t, () => ibSave(o));
  },
  grip: ibGrip,
  resetOrder: () => ibSave([]),
  pin: ibPin,
  snooze: ibSnooze,
  snoozeMenu: r => {
    S.ibSnzOpen = S.ibSnzOpen === r ? '' : r;
    render();
  },
  viewApply,
  viewSave,
  viewDelete,
  viewNaming: on => {
    S.ibNaming = on;
    render();
  },
  foldAll: closed => {
    IB_TITLES.forEach(t => {
      S.fold[ibSecKey(t)] = closed;
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

const np = () => S.np!;

const npSet = (f: () => void) => {
  f();
  np().key = `${np().repo}|${np().base}|${np().head}`;
};

const val = (e: Event) => (e.target as HTMLInputElement).value;

const newpr: NewPrHandlers = {
  cancel: () => {
    S.view = S.bundle ? 'pr' : 'home';
    delete S.draft.newpr;
    render();
  },
  repo: e =>
    bpOpen(
      e.currentTarget as HTMLElement,
      'repo',
      v => {
        npSet(() => {
          np().repo = v;
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
  repoIn: e => {
    npSet(() => {
      np().repo = val(e).trim();
      np().base = '';
      np().head = '';
    });

    npLoadBranches(np().repo);
  },
  base: e =>
    bpOpen(e.currentTarget as HTMLElement, 'base', v => {
      npSet(() => {
        np().base = v;
      });

      npCompare();
    }),
  head: e =>
    bpOpen(e.currentTarget as HTMLElement, 'head', v => {
      npSet(() => {
        np().head = v;
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
  tpl: e => {
    const n = np();
    const sel = e.target as HTMLSelectElement;
    const t = n.tpl[`${n.repo}|${n.base}`] || [];
    const cur = (S.draft.newpr || '').trim();
    const next = sel.value === '-1' ? '' : t[+sel.value].body;

    if (
      cur &&
      cur !== n.tplText.trim() &&
      !confirm('Replace what you have written with this template?')
    ) {
      rerender();

      return;
    }

    S.draft.newpr = n.tplText = next;
    saveDrafts();
    bumpNp();
    rerender();
    syncDraft('newpr');
  },
  title: e => {
    np().title = val(e);
    np().titleTouched = true;
    render();
  },
  draft: e => {
    np().draft = (e.target as HTMLInputElement).checked;
    render();
  },
  add: (k: NpListKey, e) => {
    if (val(e)) {
      np()[k].push(val(e));
      render();
    }
  },
  del: (k: NpListKey, v) => {
    np()[k] = np()[k].filter((x: string) => x !== v);
    render();
  },
  mile: e => {
    np().milestone = val(e);
  },
  issues: e => {
    np().issues = val(e);
  },
  create: async () => {
    const n = np();
    const sel = '#npcreate';
    setBusy(sel, true);
    n.err = '';

    try {
      const nums = [...new Set(n.issues.match(/\d+/g) || [])];

      const body = (
        (S.draft.newpr || '').trim() +
        (nums.length ? `\n\n${nums.map(x => `Closes #${x}`).join('\n')}` : '')
      ).trim();

      const extra = {
        reviewers: n.reviewers,
        assignees: n.assignees,
        labels: n.labels,
        milestone: n.milestone ? Number(n.milestone) : null,
      };

      const r = await tauri!.invoke('create_pr', {
        repo: n.repo,
        base: n.base,
        head: n.head,
        title: n.title,
        body,
        draft: n.draft,
        extra,
      });

      const warn = r.warnings?.length
        ? `Created, but ${r.warnings.join(' · ')}`
        : '';

      delete S.draft.newpr;
      saveDrafts();
      S.np = null;
      confetti();
      await openPr(`${n.repo}#${r.number}`, { nav: true });

      if (warn) {
        S.actErr = { k: 'comment', m: warn };
        rerender();
      }
    } catch (err) {
      n.err = String(err).replace(/^Error: /, '');
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
