import { Gate, Skeleton } from '../components/Pages';
import { request } from '../components/req';
import { rerender, saveDrafts } from './actions';
import { bindSticky, openExternal } from './addressbar';
import {
  appState,
  queryElement,
  selNames,
  syncUnread,
  tauri,
  when,
} from './core';
import { qc, seen } from './data';
import { paintDlg } from './dialogs';
import {
  batch,
  beginDrag,
  setDragging,
  setGate,
  setShell,
  shellProps,
} from './frame';
import { HomeView } from './home';
import { ibPins, ibViews, isSnoozed, snoozeLabel } from './inboxtools';
import { loadRepos, openPr } from './nav';
import { paintNotes } from './notes';
import { PrView } from './pr';
import { roCls } from './reorder';
import { scrollBtn, scrolled } from './scrolling';
import { paintSide } from './side';
import { curRef } from './tabs';
import { tokenDialog } from './token';
import { clearTop, paintTop } from './top';
import { InboxView, NewPrView, NotesView, RepoView } from './views';

import type { VNode } from 'preact';
import type { InboxProps } from '../components/Pages';
import type { NewPrProps, NpMetaProps } from '../components/Pages';
import type { ShellProps } from '../components/Shell';
import type {
  BranchInfo,
  Bundle,
  InboxItem,
  InboxState,
  NewPr,
  NpListKey,
} from '../types';

export const saveNotes = () =>
  localStorage.setItem('notes', JSON.stringify(appState.notes));

export function notesProps() {
  const field = appState.nf || 'all';
  const unread = appState.notes.filter(note => !note.read).length;

  const rows = appState.notes
    .filter(
      note => field === 'all' || (field === 'unread' ? !note.read : note.read),
    )
    .map(note => ({
      id: note.id,
      read: !!note.read,
      ref: note.ref,
      target: note.target || '',
      title: note.title,
      text: note.text,
      when: when(note.at).replace(/<\/?span[^>]*>/g, ''),
    }));

  return { f: field, rows, unread, total: appState.notes.length };
}

// ---- Inbox: PRs that need you ----
export async function loadInbox(force = false) {
  appState.inbox = appState.inbox || { data: null, err: '', loading: true };
  appState.inbox!.loading = true;
  appState.inbox!.err = '';
  render();

  try {
    appState.inbox!.data = tauri
      ? await tauri!.invoke('inbox', { force, repos: selNames() })
      : { requested: [], mine: [], ready: [] };
  } catch (error) {
    appState.inbox!.err = String(error).replace(/^Error: /, '');
  }

  appState.inbox!.loading = false;
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
}

// ---- New pull request ----
export const npHuman = (text: string) =>
  text
    .replace(/^[a-z]+\//i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^./, color => color.toUpperCase());

export let npSeq = 0;

export const bumpNp = () => {
  npSeq++;
};

export function newPrProps(): NewPrProps {
  const newPr = appState.np!;

  const repos = (appState.repos || []).filter(
    repoSummary => !repoSummary.archived,
  );

  const br = newPr.branches[newPr.repo];
  const same = !!(newPr.base && newPr.base === newPr.head);
  const value = newPr.cmp;

  const cmp =
    value === 'loading'
      ? { kind: 'loading' as const, text: '', ahead: 0, files: 0, behind: 0 }
      : !value
        ? { kind: 'none' as const, text: '', ahead: 0, files: 0, behind: 0 }
        : typeof value === 'string'
          ? { kind: 'err' as const, text: value, ahead: 0, files: 0, behind: 0 }
          : value.ahead_by
            ? {
                kind: 'ok' as const,
                text: '',
                ahead: value.ahead_by,
                files: value.files,
                behind: value.behind_by,
              }
            : {
                kind: 'same' as const,
                text: '',
                ahead: 0,
                files: 0,
                behind: 0,
              };

  const ready = !!(
    newPr.title.trim() &&
    newPr.repo &&
    newPr.base &&
    newPr.head &&
    !same &&
    newPr.cmp &&
    typeof newPr.cmp === 'object' &&
    newPr.cmp.ahead_by > 0
  );

  return {
    hasRepos: repos.length > 0,
    repo: newPr.repo,
    base: newPr.base,
    head: newPr.head,
    hasBranches: !!br,
    same,
    cmp,
    title: newPr.title,
    tpls: newPr.tpl[`${newPr.repo}|${newPr.base}`] ?? null,
    tplText: newPr.tplText,
    seq: npSeq,
    isDraft: !!newPr.draft,
    err: newPr.err || '',
    ready,
    meta: npMetaProps(newPr),
  };
}

// Reviewers / assignees / labels / milestone / linked issues pickers
export function npMetaProps(newPr: NewPr): NpMetaProps | null {
  const repoMeta = newPr.meta?.[newPr.repo];

  if (!repoMeta) {
    return null;
  }

  const ppl = repoMeta.people.map(item => item.login);
  const me = appState.me || '';

  const row = (npListKey: NpListKey, name: string, list: string[]) => ({
    k: npListKey,
    name,
    chips: newPr[npListKey].slice() as string[],
    free: list.filter(text => !newPr[npListKey].includes(text)),
  });

  return {
    rows: [
      row(
        'reviewers',
        'Reviewers',
        ppl.filter(text => text !== me),
      ),
      row('assignees', 'Assignees', ppl),
      row(
        'labels',
        'Labels',
        repoMeta.labels.map(item => item.name),
      ),
    ],
    milestones: repoMeta.milestones.map(item => ({
      number: item.number,
      title: item.title,
      on: String(newPr.milestone) === String(item.number),
    })),
    issues: newPr.issues,
  };
}

export async function npLoadMeta(repo: string) {
  const newPr = appState.np;

  if (!repo || !tauri || newPr!.meta[repo]) {
    return;
  }

  try {
    newPr!.meta[repo] = await tauri!.invoke('repo_meta', { repo });
  } catch {
    newPr!.meta[repo] = { people: [], labels: [], milestones: [] };
  }

  if (appState.np === newPr) {
    rerender();
  }
}

export async function npLoadBranches(repo: string) {
  const newPr = appState.np;
  npLoadMeta(repo);

  if (!repo || newPr!.branches[repo]) {
    return npPickDefaults();
  }

  if (!tauri) {
    newPr!.err = 'Creating pull requests needs the desktop app.';

    return render();
  }

  try {
    newPr!.branches[repo] = await tauri!.invoke('list_branches', { repo });
    newPr!.err = '';
  } catch (error) {
    newPr!.err = String(error).replace(/^Error: /, '');

    newPr!.branches[repo] = {
      default: '',
      branches: [],
    } as unknown as BranchInfo;
  }

  npPickDefaults();
}

export function npPickDefaults() {
  const newPr = appState.np;
  const branchInfo = newPr!.branches[newPr!.repo];

  if (!branchInfo) {
    return render();
  }

  if (!branchInfo.branches.includes(newPr!.base)) {
    newPr!.base = branchInfo.default || branchInfo.branches[0] || '';
  }

  if (
    !branchInfo.branches.includes(newPr!.head) ||
    newPr!.head === newPr!.base
  ) {
    newPr!.head = branchInfo.branches.find(text => text !== newPr!.base) || '';
  }

  npCompare();
}

// Pull request templates from the repo: pre-fill an empty description (or one still showing the previous template).
export async function npLoadTemplates() {
  const newPr = appState.np;

  if (!newPr!.repo || !newPr!.base || !tauri) {
    return;
  }

  const key = `${newPr!.repo}|${newPr!.base}`;

  if (newPr!.tpl[key] !== undefined) {
    return newPr!.tpl[key] ? npApplyTemplate() : undefined;
  }

  newPr!.tpl[key] = null;

  try {
    newPr!.tpl[key] = await tauri!.invoke('pr_templates', {
      repo: newPr!.repo,
      base: newPr!.base,
    });
  } catch {
    newPr!.tpl[key] = [];
  }

  if (appState.np === newPr && `${newPr!.repo}|${newPr!.base}` === key) {
    npApplyTemplate();
  }
}

export function npApplyTemplate() {
  const newPr = appState.np;
  const list = newPr!.tpl[`${newPr!.repo}|${newPr!.base}`];
  const cur = (appState.draft.newpr || '').trim();

  if (list?.length && (!cur || cur === newPr!.tplText.trim())) {
    appState.draft.newpr = newPr!.tplText = list[0].body;
    saveDrafts();
  }

  rerender();
}

export async function npCompare() {
  const newPr = appState.np;
  newPr!.cmp = null;
  npLoadTemplates();

  if (
    !newPr!.repo ||
    !newPr!.base ||
    !newPr!.head ||
    newPr!.base === newPr!.head
  ) {
    return rerender();
  }

  const key = `${newPr!.repo}|${newPr!.base}|${newPr!.head}`;
  newPr!.key = key;
  newPr!.cmp = 'loading';
  rerender();

  try {
    const compareResult = await tauri!.invoke('compare_branches', {
      repo: newPr!.repo,
      base: newPr!.base,
      head: newPr!.head,
    });

    if (appState.np!.key !== key) {
      return;
    }

    newPr!.cmp = compareResult;

    if (!newPr!.titleTouched) {
      newPr!.title =
        compareResult.commits.length === 1
          ? compareResult.commits[0]
          : npHuman(newPr!.head);
    }
  } catch (error) {
    if (appState.np!.key !== key) {
      return;
    }

    newPr!.cmp = String(error).replace(/^Error: /, '');
  }

  rerender();
}

export function openNewPr(repo?: string, head?: string) {
  const cur =
    (typeof repo === 'string' && repo) ||
    appState.bundle?.pull.base.repo.full_name ||
    appState.repo ||
    '';

  bumpNp();
  appState.view = 'newpr';
  appState.nav = false;

  appState.np = {
    repo: cur,
    base: '',
    head: (typeof head === 'string' && head) || '',
    branches: {},
    meta: {},
    reviewers: [],
    assignees: [],
    labels: [],
    milestone: '',
    issues: '',
    cmp: null,
    title: '',
    titleTouched: false,
    draft: false,
    err: '',
    key: '',
    tpl: {},
    tplText: '',
  };

  delete appState.draft.newpr;
  render();

  if (tauri && !appState.repos) {
    loadRepos().then(() => {
      if (!appState.np!.repo && appState.repos?.[0]) {
        appState.np!.repo = appState.repos[0].full_name;
      }

      npLoadBranches(appState.np!.repo);
    });
  } else {
    npLoadBranches(cur);
  }
}

export function openInbox() {
  appState.view = 'inbox';
  appState.nav = false;
  render();

  if (!appState.inbox?.data || !qc.fresh('inbox', 45000)) {
    qc.set('inbox', 1 as unknown as Bundle);
    loadInbox();
  }
}

export const IB_SORTS: [string, string][] = [
  ['updated', 'Newest activity'],
  ['oldest', 'Oldest activity'],
  ['comments', 'Most comments'],
  ['repo', 'Repository'],
  ['author', 'Author'],
  ['title', 'Title'],
];

const ibCmp = (
  key: string,
): ((firstInboxItem: InboxItem, secondInboxItem: InboxItem) => number) => {
  const compare = (leftText: string, rightText: string) =>
    leftText.localeCompare(rightText, undefined, { sensitivity: 'base' });

  const at = (firstInboxItem: InboxItem, secondInboxItem: InboxItem) =>
    secondInboxItem.updated_at > firstInboxItem.updated_at
      ? 1
      : secondInboxItem.updated_at < firstInboxItem.updated_at
        ? -1
        : 0;

  switch (key) {
    case 'oldest':
      return (firstInboxItem, secondInboxItem) =>
        at(secondInboxItem, firstInboxItem);
    case 'comments':
      return (firstInboxItem, secondInboxItem) =>
        (secondInboxItem.comments || 0) - (firstInboxItem.comments || 0) ||
        at(firstInboxItem, secondInboxItem);
    case 'repo':
      return (firstInboxItem, secondInboxItem) =>
        compare(firstInboxItem.repo, secondInboxItem.repo) ||
        at(firstInboxItem, secondInboxItem);
    case 'author':
      return (firstInboxItem, secondInboxItem) =>
        compare(firstInboxItem.user, secondInboxItem.user) ||
        at(firstInboxItem, secondInboxItem);
    case 'title':
      return (firstInboxItem, secondInboxItem) =>
        compare(firstInboxItem.title, secondInboxItem.title);
    default:
      return at;
  }
};

export const ibSecKey = (title: string) => `ib:${title}`;

export const IB_TITLES = [
  'Pinned',
  'Review requested',
  'Ready to merge',
  'Mentioned',
  'Participated',
  'Your pull requests',
  'Recently closed or merged',
  'Snoozed',
];

// The section order is the user's: saved as a list of titles, with any section not in it kept in its default place.
export const ibOrder = () => {
  const saved = appState.ibOrder || [];

  return [
    ...(saved.includes('Pinned') ? [] : ['Pinned']),
    ...saved.filter(text => IB_TITLES.includes(text)),
    ...IB_TITLES.filter(text => !saved.includes(text) && text !== 'Pinned'),
  ];
};

export function inboxProps(): InboxProps {
  const inboxState: Partial<InboxState> = appState.inbox || { loading: true };
  const inbox = inboxState.data;
  const query = (appState.ibQ || '').toLowerCase();
  const cmp = ibCmp(appState.ibSort || 'updated');
  const pins = ibPins();

  const row = (inboxItem: InboxItem) => {
    const ref = `${inboxItem.repo}#${inboxItem.number}`;
    const was = seen[ref]?.at;

    return {
      ref,
      avatar: inboxItem.avatar,
      title: inboxItem.title,
      sub: `${ref} · ${inboxItem.user} · ${when(inboxItem.updated_at).replace(/<\/?span[^>]*>/g, '')}${inboxItem.draft ? ' · Draft' : ''}`,
      fresh: !!(was && inboxItem.updated_at > was),
      comments: inboxItem.comments || 0,
      updated: inboxItem.updated_at,
      pinned: pins.includes(ref),
      snz: snoozeLabel(ref),
      sel: appState.ibSel === ref,
      snzOpen: appState.ibSnzOpen === ref,
    };
  };

  const refOf = (inboxItem: InboxItem) =>
    `${inboxItem.repo}#${inboxItem.number}`;

  const match = (inboxItem: InboxItem) =>
    !query ||
    `${inboxItem.title} ${inboxItem.repo} ${inboxItem.user} #${inboxItem.number}`
      .toLowerCase()
      .includes(query);

  const lists: [string, string, InboxItem[]][] = inbox
    ? [
        ['Review requested', 'Waiting on you', inbox.requested],
        ['Ready to merge', 'Your approved pull requests', inbox.ready],
        [
          'Mentioned',
          'Open PRs where you were @mentioned',
          inbox.mentioned || [],
        ],
        [
          'Participated',
          'Open PRs you commented on or reviewed',
          inbox.participated || [],
        ],
        ['Your pull requests', 'Open PRs you opened', inbox.mine],
        [
          'Recently closed or merged',
          'PRs you were involved in',
          inbox.closed || [],
        ],
      ]
    : [];

  // Snoozed PRs leave every list; pinned ones move up into their own section.
  const everything = new Map<string, InboxItem>();

  lists.forEach(([, , inboxItems]) =>
    inboxItems.forEach(
      inboxItem =>
        everything.has(refOf(inboxItem)) ||
        everything.set(refOf(inboxItem), inboxItem),
    ),
  );

  const snoozed = [...everything.values()].filter(inboxItem =>
    isSnoozed(refOf(inboxItem), inboxItem.updated_at),
  );

  const hidden = new Set(snoozed.map(refOf));

  const pinned = [...everything.values()].filter(
    inboxItem =>
      pins.includes(refOf(inboxItem)) && !hidden.has(refOf(inboxItem)),
  );

  const taken = new Set([...hidden, ...pinned.map(refOf)]);

  const sec = (title: string, sub: string, list: InboxItem[]) => ({
    title,
    sub,
    key: ibSecKey(title),
    closed: !!appState.fold[ibSecKey(title)],
    rows: list.filter(match).sort(cmp).map(row),
  });

  const all = inbox
    ? [
        ...(pinned.length ? [sec('Pinned', 'Kept on top', pinned)] : []),
        ...lists.map(([text, otherText, inboxItems]) =>
          sec(
            text,
            otherText,
            inboxItems.filter(inboxItem => !taken.has(refOf(inboxItem))),
          ),
        ),
        ...(snoozed.length
          ? [
              sec(
                'Snoozed',
                'Hidden until their time is up or they have new activity',
                snoozed,
              ),
            ]
          : []),
      ]
    : null;

  const order = ibOrder();

  return {
    loading: !!inboxState.loading,
    err: inboxState.err || '',
    sort: appState.ibSort || 'updated',
    sorts: IB_SORTS,
    q: appState.ibQ || '',
    custom: !!appState.ibOrder?.length,
    views: ibViews().map(ibView => ibView.name),
    view: appState.ibView || '',
    naming: !!appState.ibNaming,
    secs: all
      ? all
          .sort(
            (leftItem, rightItem) =>
              order.indexOf(leftItem.title) - order.indexOf(rightItem.title),
          )
          .map((item, index, items) => ({
            ...item,
            first: index === 0,
            last: index === items.length - 1,
            ro: roCls('ib', item.title),
          }))
      : null,
  };
}

// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
export const needSignIn = () =>
  (tauri && appState.authChecked && !appState.hasToken) ||
  new URLSearchParams(location.search).get('gate') === '1';

// #app holds two persistent hosts: Preact owns #top (toolbar and tab strip) and #rest (the shell, or the sign-in gate).
export { setDragging } from './frame';

// The page scrolls where the state says: every move is a numbered request that the shown page applies.
export function scrollMain(top: number, smooth = false) {
  appState.mainTop = top;
  request('scroll:main', { top, smooth });
}

// The sidebar grip: drag to resize, double-click to reset; the scrim closes the mobile drawer.
const gripDown = (event: MouseEvent) => {
  event.preventDefault();

  const x0 = event.clientX;
  const w0 = appState.sbw;
  setDragging(true);

  beginDrag({
    move: ev => {
      appState.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0));
      repaintShell({ sbw: appState.sbw });
    },
    end: () => {
      setDragging(false);
      localStorage.setItem('sbw', String(Math.round(appState.sbw)));
    },
  });
};

const gripReset = () => {
  appState.sbw = 260;
  localStorage.setItem('sbw', '260');
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
};

const scrimTap = () => {
  appState.nav = false;
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
};

export const repaintShell = (patch: Partial<ShellProps>) => {
  const cur = shellProps();

  if (cur) {
    setShell({ ...cur, ...patch });
  }
};

const liveView = (): VNode | null => {
  if (appState.loading) {
    return <Skeleton />;
  }

  if (appState.view === 'inbox') {
    return <InboxView />;
  }

  if (appState.view === 'notes') {
    return <NotesView />;
  }

  if (appState.view === 'repo') {
    return <RepoView />;
  }

  if (appState.view === 'newpr') {
    return appState.np ? <NewPrView /> : null;
  }

  if (appState.view === 'pr' && appState.bundle) {
    return <PrView />;
  }

  return (appState.view === 'home' || !appState.bundle) &&
    appState.view !== 'newpr' ? (
    <HomeView />
  ) : null;
};

// Links inside a pull request page (comment bodies are pre-built HTML) open in the app or the browser.
const followLink = (event: MouseEvent) => {
  if (appState.view !== 'pr') {
    return;
  }

  const element = (event.target as HTMLElement).closest<HTMLAnchorElement>(
    'a[href]',
  );

  if (!element) {
    return;
  }

  event.preventDefault();
  const hash = element.getAttribute('href');

  if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(hash!)) {
    openPr(hash!);
  } else if (/^https?:\/\//.test(hash!)) {
    openExternal(hash!);
  }
};

// What the page last drew for the open pull request: leaving the tab parks exactly this vnode, coming back puts it in again untouched.
let shown: { ref: string; vnode: VNode } | null = null;

export const shownPage = () => shown;

export function render() {
  if (needSignIn()) {
    shown = null;

    batch(() => {
      clearTop();

      setGate(
        <Gate
          err={appState.gateErr ? String(appState.gateErr) : ''}
          go={() => {
            tokenDialog();
            setTimeout(() => queryElement('#oauthgo')?.click(), 50);
          }}
          tok={tokenDialog}
        />,
      );

      paintDlg();
    });

    return;
  }

  const { stash } = appState;
  const live = stash ? stash.vnode : liveView();
  const ref = curRef();

  const key = appState.loading
    ? 'loading'
    : appState.view === 'pr' && appState.bundle
      ? `pr:${ref}`
      : appState.view || 'home';

  if (appState.view === 'pr' && appState.bundle && !appState.loading && live) {
    shown = { ref, vnode: live };
  }

  const kept = [...appState.alive]
    .filter(([text]) => `pr:${text}` !== key)
    .map(([text, alive]) => ({ key: `pr:${text}`, children: alive.vnode }));

  batch(() => {
    paintTop();

    setShell({
      nav: !!appState.nav,
      navHidden: !!appState.hide.nav,
      sbw: appState.sbw,
      lw: appState.lw,
      fade: !!appState.fadeMain,
      enter: !!appState.enter,
      stuck: !!appState.stuck,
      active: { key, children: live },
      onPage: followLink,
      onGrip: event => gripDown(event),
      onGripReset: () => gripReset(),
      onScrim: () => scrimTap(),
      onScroll: event => scrolled('main', event.currentTarget as HTMLElement),
      onMeasure: el => {
        if (appState.scrollId === 'main' || !appState.scrollId) {
          scrollBtn(el);
        }
      },
      kept,
    });

    paintSide();
    paintDlg();
    paintNotes();
  });

  appState.stash = null;
  (appState.ios || []).forEach(observer => observer.disconnect());
  appState.ios = [];
  bindSticky();

  if (appState.fadeMain) {
    appState.fadeMain = false;
  }

  syncUnread();

  document.title = appState.bundle
    ? `${appState.bundle.pull.title} · ${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
    : 'GitHub PR View';
}
