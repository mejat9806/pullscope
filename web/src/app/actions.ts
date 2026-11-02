import { options } from 'preact';

import { editorMount } from '../components/Actions';
import { request } from '../components/req';
import { openExternal } from './addressbar';
import { appState, load, setFlash, tauri } from './core';
import { qc } from './data';
import { closePop, openPop } from './dialogs';
import { pendKey, pendList, savePending, sugOf } from './diff';
import { confetti } from './fun';
import { setComposer } from './keyboard';
import { openPr } from './nav';
import { render } from './pages';
import { checkState } from './timeline';

import type { ComposerProps, MergeActProps } from '../components/Actions';
import type {
  ActArgs,
  Bundle,
  CommentLike,
  ReviewComment,
  TimelineEvent,
} from '../types';

// ---- Write actions (comment, reply, review, merge, close/reopen) ----
export const peopleList = () => {
  const bundle = appState.bundle;

  if (!bundle) {
    return [];
  }

  const names = new Set<string>();

  [
    bundle.pull.user,
    ...bundle.timeline.map(
      timelineEvent =>
        timelineEvent.user || timelineEvent.actor || timelineEvent.author,
    ),
    ...bundle.review_comments.map(reviewComment => reviewComment.user),
  ].forEach(value => value?.login && names.add(value.login));

  return [...names];
};

export const drafts = load<Record<string, Record<string, string>>>(
  'drafts',
  {},
);

export function saveDrafts() {
  if (!appState.draftRef) {
    return;
  }

  const item = Object.fromEntries(
    Object.entries(appState.draft).filter(([, value]) => value && value.trim()),
  );

  if (Object.keys(item).length) {
    drafts[appState.draftRef] = item;
  } else {
    delete drafts[appState.draftRef];
  }

  try {
    localStorage.setItem('drafts', JSON.stringify(drafts));
  } catch {
    /* storage full */
  }
}

// After a successful send: drop the text from memory, empty the live editor and overwrite the saved copy, so it cannot come back.
export function clearDraft(key: string) {
  delete appState.draft[key];
  syncDraft(key);
  saveDrafts();
}

export const prRef = () => ({
  repo: appState.bundle!.pull.base.repo.full_name,
  number: appState.bundle!.pull.number,
});

export const errMsg = (key: string) =>
  appState.actErr && appState.actErr.k === key ? appState.actErr.m : '';

export function composerProps(bundle: Bundle): ComposerProps {
  const pull = bundle.pull;
  const closed = pull.state === 'closed';
  const busy = appState.busy === 'comment';
  const open = busy || appState.cOpen === true;
  const dr = (appState.draft.comment || '').trim();

  // Docked: it sticks to the bottom of the view, so you can write from anywhere in the thread; the bar expands in place.
  return {
    open,
    draft: dr ? dr.replace(/\s+/g, ' ').slice(0, 60) : '',
    err: errMsg('comment'),
    merged: !!pull.merged,
    closed,
    busy,
  };
}

const mergeMethod = () => {
  const am = appState.bundle?.pull.auto_merge;

  return am
    ? (
        { MERGE: 'merge', SQUASH: 'squash', REBASE: 'rebase' } as Record<
          string,
          string
        >
      )[am.merge_method!] || 'merge'
    : 'merge';
};

export function mergeActProps(bundle: Bundle): MergeActProps | null {
  const pull = bundle.pull;

  if (pull.merged || pull.state === 'closed') {
    return null;
  }

  const busy = appState.busy === 'merge';
  const am = pull.auto_merge;

  const blocked =
    pull.mergeable_state !== 'clean' && pull.mergeable_state !== 'unstable';

  return {
    draft: !!pull.draft,
    err: errMsg('merge'),
    method: appState.method || mergeMethod(),
    busy,
    auto: am
      ? {
          method: am.merge_method!.toLowerCase(),
          busy: appState.busy === 'disable_automerge',
        }
      : null,
    canAuto: blocked,
    autoBusy: appState.busy === 'automerge',
    errAuto: errMsg('automerge'),
  };
}

export function closeDlg() {
  const dlg = appState.dlg;

  if (!dlg) {
    return;
  }

  if (dlg.k === 'editpr') {
    delete appState.draft.prbody;
  } else if (dlg.k === 'editc') {
    delete appState.draft.editc;
  } else if (dlg.k === 'commits') {
    appState.cpick = null;
  } else if (dlg.k === 'token') {
    appState.oauthLive = false;
  }

  appState.dlg = null;
  render();
}

export function reviewDialog() {
  appState.dlg = {
    k: 'review',
    ev: 'COMMENT',
    ok: async () => {
      const { ev } = appState.dlg as { ev: string };

      const lines = pendList().map(({ path, line, side, body }) => ({
        path,
        line,
        side,
        body,
      }));

      const actResult = await act(
        'review',
        { body: appState.draft.review || '', event: ev, extra: lines },
        'review',
        true,
      );

      if (actResult === undefined) {
        return;
      }

      clearDraft('review');
      delete appState.pending![pendKey()];
      savePending();
      appState.dlg = null;
      await refreshPr();
    },
  };

  render();
}

export function editPrDialog() {
  const pull = appState.bundle!.pull;
  appState.draft.prbody = pull.body || '';

  appState.dlg = {
    k: 'editpr',
    title: pull.title,
    ok: async () => {
      const { title } = appState.dlg as { title: string };

      const actResult = await act(
        'edit',
        { body: appState.draft.prbody ?? '', extra: { title } },
        'editpr',
        true,
      );

      if (actResult === undefined) {
        return;
      }

      clearDraft('prbody');
      appState.dlg = null;
      await refreshPr();
    },
  };

  render();
}

// Write / Preview tabs on a rich editor; the preview is rendered by GitHub so it matches what gets posted.
// Markdown preview of a draft, rendered by the backend; falls back to the raw text with the reason when that is not possible.
export async function previewDraft(
  key: string,
): Promise<{ html: string } | { raw: string; err: string } | null> {
  const md = (appState.draft[key] || '').trim();

  if (!md) {
    return null;
  }

  try {
    if (!tauri) {
      throw new Error('offline');
    }

    const repo =
      appState.bundle?.pull.base.repo.full_name || appState.np?.repo || null;

    return { html: await tauri!.invoke('render_markdown', { text: md, repo }) };
  } catch (error) {
    return { raw: md, err: String(error).replace(/^Error: /, '') };
  }
}

export function confirmDlg(
  title: string,
  text: string,
  label: string,
  danger: boolean,
  fn: () => void | Promise<void>,
) {
  appState.dlg = {
    k: 'confirm',
    title,
    text,
    label,
    danger,
    ok: async () => {
      appState.dlg = null;
      render();
      await fn();
    },
  };

  render();
}

// Runs a write action. Returns the API response, or undefined after showing an error under `key`.
// Any write action puts a spinner in the button that started it and disables it until the request settles.
export const noteClick = (event: MouseEvent) => {
  const element = (event.target as HTMLElement).closest?.('button');
  appState.lastSel = element ? btnSel(element) : null;
};

export const btnSel = (element: HTMLElement) => {
  if (element.id) {
    return `#${element.id}`;
  }

  const attr = [...element.attributes].find(otherAttr =>
    otherAttr.name.startsWith('data-'),
  );

  return attr ? `button[${attr.name}="${CSS.escape(attr.value)}"]` : null;
};

// The same selector, computed from a button's props, so the views can tell which button is busy while they render.
export const propSel = (lookup: Record<string, unknown>) => {
  if (lookup.id) {
    return `#${String(lookup.id)}`;
  }

  const key = Object.keys(lookup).find(
    text => text.startsWith('data-') && lookup[text] != null,
  );

  return key ? `button[${key}="${CSS.escape(String(lookup[key]))}"]` : null;
};

const prevVnode = options.vnode;

options.vnode = node => {
  if (node.type === 'button' && appState.busySels?.length) {
    const lookup = node.props as Record<string, unknown>;
    const sel = propSel(lookup);

    if (sel && appState.busySels.includes(sel)) {
      lookup.class =
        `${String(lookup.class ?? lookup.className ?? '')} is-busy`.trim();

      delete lookup.className;
      lookup.disabled = true;
      lookup['aria-busy'] = 'true';
    }
  }

  prevVnode?.(node);
};

// A busy button is state (S.busySels): the views draw it with the spinner class and disabled until the request settles.
export const setBusy = (sel: string | null, on: boolean) => {
  if (!sel) {
    return;
  }

  const lines = (appState.busySels ||= []);
  const index = lines.indexOf(sel);

  if (on) {
    lines.push(sel);
  } else if (index >= 0) {
    lines.splice(index, 1);
  } else {
    return;
  }

  rerender();
};

// Add a reaction, or remove it when you already left it (clicking the same emoji again), like github.com.
appState.mine = {};

// `${kind}:${id}` -> Promise of the Set of reactions you have left there
export const getMine = (kind: string, rid: number | string) =>
  (appState.mine![`${kind}:${rid}`] ||= tauri
    ? tauri!
        .invoke('my_reactions', { ...prRef(), kind, id: +rid })
        .then(lines => new Set<string>(lines))
        .catch(() => {
          delete appState.mine![`${kind}:${rid}`];

          return new Set<string>();
        })
    : Promise.resolve(new Set()));

export async function toggleReact(
  kind: string,
  rid: number | string,
  color: string,
) {
  const mine = (await getMine(kind, rid)).has(color);
  const bundle = appState.bundle;

  const tgt =
    kind === 'pr'
      ? bundle!.pull
      : [...bundle!.timeline, ...bundle!.review_comments].find(
          value => String(value.id) === String(rid),
        );

  const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null;
  const base = prev ? (prev as Record<string, number>)[color] || 0 : 0;

  const bump = (count: number) => {
    if (tgt) {
      tgt.reactions = {
        ...(tgt.reactions || {}),
        [color]: Math.max(0, base + count),
      };
    }
  };

  bump(mine ? -1 : 1);
  appState.refreshing = true;
  rerender();

  const actResult = await act(
    'react',
    { kind, id: +rid, content: color },
    'react',
  );

  if (actResult === undefined) {
    if (tgt && prev) {
      tgt.reactions = prev;
    }

    appState.refreshing = false;
    rerender();

    return;
  }

  const set = await getMine(kind, rid);

  if ((actResult as { added?: boolean }).added === false) {
    set.delete(color);
  } else {
    set.add(color);
  }

  await refreshPr(kind === 'pr' ? '' : rid);
}

export type ActResult = ReviewComment & { added?: boolean };

export async function act(
  action: string,
  args: ActArgs,
  key: string,
  inDialog = false,
) {
  const sel = appState.lastSel ?? null;
  setBusy(sel, true);

  try {
    return await act2(action, args, key, inDialog);
  } finally {
    setBusy(sel, false);
  }
}

export async function act2(
  action: string,
  args: ActArgs,
  key: string,
  inDialog = false,
): Promise<ActResult | undefined> {
  appState.actErr = null;

  if (!tauri) {
    appState.actErr = { k: key, m: 'Writing needs the desktop app.' };
    render();

    return undefined;
  }

  appState.busy = key;

  if (!inDialog) {
    render();
  }

  try {
    const value =
      action === 'react'
        ? await tauri!.invoke('toggle_reaction', {
            ...prRef(),
            kind: args.kind,
            id: args.id,
            content: args.content,
          })
        : await tauri!.invoke('pr_action', {
            ...prRef(),
            action,
            body: null,
            id: null,
            event: null,
            method: null,
            kind: null,
            content: null,
            extra: null,
            ...args,
          });

    appState.busy = '';

    if (
      action === 'merge' ||
      (action === 'review' && args.event === 'APPROVE')
    ) {
      confetti();
    }

    return (value ?? {}) as ActResult;
  } catch (error) {
    appState.busy = '';
    appState.actErr = { k: key, m: String(error).replace(/^Error: /, '') };
    render();

    return undefined;
  }
}

export const refreshPr = (focus: string | number = '') => {
  qc.invalidate(`${prRef().repo}#${prRef().number}`);
  saveDrafts();
  appState.focus = focus ? String(focus) : '';

  return openPr(`${prRef().repo}#${prRef().number}`, {
    nav: true,
    keepTab: true,
  });
};

export function editCommentDialog(
  value: ReviewComment | TimelineEvent,
  kind: string,
) {
  appState.draft.editc = value.body || '';

  appState.dlg = {
    k: 'editc',
    ok: async () => {
      const actResult = await act(
        'edit_comment',
        { id: value.id, kind, body: appState.draft.editc ?? '' },
        'editc',
        true,
      );

      if (actResult === undefined) {
        return;
      }

      clearDraft('editc');
      appState.dlg = null;
      await refreshPr(value.id);
    },
  };

  render();
}

export function deleteCommentDialog(item: { id?: number }, kind: string) {
  appState.dlg = {
    k: 'delc',
    ok: async () => {
      const actResult = await act(
        'delete_comment',
        { id: item.id, kind },
        'delc',
        true,
      );

      if (actResult === undefined) {
        return;
      }

      appState.dlg = null;
      await refreshPr();
    },
  };

  render();
}

export function hideCommentDialog(item: {
  node_id?: string;
  id?: number | string;
}) {
  const reasons = [
    ['SPAM', 'Spam'],
    ['ABUSE', 'Abuse'],
    ['OFF_TOPIC', 'Off-topic'],
    ['OUTDATED', 'Outdated'],
    ['DUPLICATE', 'Duplicate'],
    ['RESOLVED', 'Resolved'],
  ];

  appState.hideReason = 'OUTDATED';

  appState.dlg = {
    k: 'hidec',
    reasons: reasons as [string, string][],
    ok: async () => {
      const actResult = await act(
        'minimize',
        {
          body: item.node_id || '',
          content: appState.hideReason || 'OUTDATED',
        },
        'hidec',
        true,
      );

      if (actResult === undefined) {
        return;
      }

      appState.fold[`c:${item.id}`] = true;
      localStorage.setItem('fold', JSON.stringify(appState.fold));
      appState.dlg = null;
      await refreshPr();
    },
  };

  render();
}

export function cmAction(id: number, root: HTMLElement, how: string) {
  const bundle = appState.bundle;

  const value =
    [...bundle!.timeline, ...bundle!.review_comments].find(
      otherValue => String(otherValue.id) === String(id),
    ) || (String(bundle!.pull.id) === String(id) ? bundle!.pull : null);

  if (!value) {
    return;
  }

  if (how === 'link') {
    return navigator.clipboard?.writeText(value.html_url || '');
  }

  if (how === 'md') {
    return navigator.clipboard?.writeText(value.body || '');
  }

  const kind =
    (value as unknown) === bundle!.pull
      ? 'pr'
      : (bundle!.review_comments as unknown[]).includes(value)
        ? 'review_comment'
        : 'issue_comment';

  if (how === 'issue') {
    const text = prRef().repo;

    return openExternal(
      `https://github.com/${text}/issues/new?body=${encodeURIComponent(`Reference: ${value.html_url || ''}\n\n`)}`,
    );
  }

  if (how === 'edit') {
    return kind === 'pr'
      ? editPrDialog()
      : editCommentDialog(value as ReviewComment, kind);
  }

  if (how === 'hide') {
    return hideCommentDialog(value);
  }

  if (how === 'del') {
    return deleteCommentDialog(value, kind);
  }

  const key = root ? `reply-${root}` : 'comment';

  const query = (value.body || '')
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');

  appState.draft[key] = `${
    appState.draft[key] ? `${appState.draft[key]}\n\n` : ''
  }@${((value as CommentLike).user || (value as CommentLike).actor || ({} as { login?: string })).login || ''}\n\n${query}\n\n`;

  saveDrafts();
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
  syncDraft(key);
  setTimeout(() => scrollDraft(key), 50);
}

// Show a just-posted comment from the API reply instead of re-fetching the whole PR.
export function addLocal(
  kind: string,
  value: ReviewComment | TimelineEvent,
  rootId?: number,
) {
  const bundle = appState.bundle;

  if (!bundle || !value || !value.id || !value.body_html) {
    return false;
  }

  if (kind === 'commented') {
    bundle.timeline.push({ ...value, event: 'commented', actor: value.user });
  } else {
    const root = bundle.review_comments.find(
      reviewComment => reviewComment.id === rootId,
    );

    if (!root) {
      return false;
    }

    bundle.review_comments.push({
      ...value,
      pull_request_review_id: root.pull_request_review_id,
      path: root.path,
      diff_hunk: root.diff_hunk,
      position: root.position,
      original_position: root.original_position,
    } as ReviewComment);
  }

  qc.set(`${prRef().repo}#${prRef().number}`, bundle);
  qc.invalidate(`${prRef().repo}#${prRef().number}`);
  qc.m.get(`${prRef().repo}#${prRef().number}`)!.at = Date.now() - 20000;
  appState.focus = '';
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;

  setFlash(`c-${value.id}`, { block: 'start', pop: true });
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;

  return true;
}

export async function rerequestReview(event: Event, login: string) {
  const element = event.currentTarget as HTMLElement;
  event.stopPropagation();
  const sel = btnSel(element);
  setBusy(sel, true);

  try {
    const actResult = await act('rerequest', { body: login }, 'rerequest');

    if (actResult === undefined) {
      alert(appState.actErr?.m || 'Could not re-request review.');

      return;
    }

    await refreshPr();
  } finally {
    setBusy(sel, false);
  }
}

// Merge box, merge actions and composer handlers: shared by the live PR page and by the imperatively bound copies (split view).
export const composerOpen = () =>
  appState.busy === 'comment' || appState.cOpen === true;

export function toggleComposer() {
  setComposer(!composerOpen(), true);
}

export function cbarKey(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    (event.currentTarget as HTMLElement).click();
  }
}

export async function sendComment() {
  const actResult = await act(
    'comment',
    { body: appState.draft.comment || '' },
    'comment',
  );

  if (actResult === undefined) {
    return;
  }

  clearDraft('comment');
  appState.cOpen = false;

  if (!addLocal('commented', actResult)) {
    await refreshPr(actResult.id);
  }
}

export function toggleClosed() {
  const closed = appState.bundle!.pull.state === 'closed';

  confirmDlg(
    closed ? 'Reopen this pull request?' : 'Close this pull request?',
    closed
      ? 'It will be open for review again.'
      : 'It will be closed without merging. You can reopen it later.',
    closed ? 'Reopen' : 'Close pull request',
    !closed,
    async () => {
      const actResult = await act(closed ? 'reopen' : 'close', {}, 'close');

      if (actResult !== undefined) {
        await refreshPr();
      }
    },
  );
}

export function toggleMb(event: Event, key: string) {
  if ((event.target as HTMLElement).closest<HTMLElement>('#rerunck')) {
    return;
  }

  appState.mbOpen = appState.mbOpen || new Set();

  if (appState.mbOpen.has(key)) {
    appState.mbOpen.delete(key);
  } else {
    appState.mbOpen.add(key);
  }

  rerender();
}

export async function rerunChecks(event: Event) {
  event.stopPropagation();

  const urls = (appState.bundle!.checks || [])
    .filter(check => checkState(check) === 'fail' && check.url)
    .map(check => check.url);

  const sel = btnSel(event.currentTarget as HTMLElement);
  setBusy(sel, true);

  try {
    const actResult = await act('rerun', { extra: urls }, 'rerun');

    if (actResult !== undefined) {
      appState.actErr = null;
      await refreshPr();
    }
  } finally {
    setBusy(sel, false);
  }
}

export async function updateBranch() {
  const actResult = await act('update_branch', {}, 'update_branch');

  if (actResult !== undefined) {
    await refreshPr();
  }
}

export async function markReady() {
  const actResult = await act('ready', {}, 'ready');

  if (actResult !== undefined) {
    await refreshPr();
  }
}

export function toDraft() {
  confirmDlg(
    'Convert to draft?',
    'Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.',
    'Convert to draft',
    false,
    async () => {
      const actResult = await act('draft', {}, 'merge');

      if (actResult !== undefined) {
        await refreshPr();
      }
    },
  );
}

export async function enableAuto() {
  const actResult = await act(
    'automerge',
    { method: appState.method || mergeMethod() },
    'automerge',
  );

  if (actResult !== undefined) {
    await refreshPr();
  }
}

export async function disableAuto() {
  const actResult = await act('disable_automerge', {}, 'automerge');

  if (actResult !== undefined) {
    await refreshPr();
  }
}

export function doMerge() {
  const message = appState.method || mergeMethod();
  const pull = appState.bundle!.pull;

  const names: Record<string, string> = {
    merge: 'merge commit',
    squash: 'squash and merge',
    rebase: 'rebase and merge',
  };

  confirmDlg(
    'Merge this pull request?',
    `${pull.head.label} will be merged into ${pull.base.label} using ${names[message]}. This changes the repository and cannot be undone from here.`,
    'Merge',
    false,
    async () => {
      const actResult = await act('merge', { method: message }, 'merge');

      if (actResult !== undefined) {
        await refreshPr();
      }
    },
  );
}

// Comment, reaction, thread and suggestion handlers: shared by the live conversation and by the imperatively bound copies (diff lines, split view).
export function cmMenu(event: Event, btn: HTMLElement) {
  event.stopPropagation();

  const bb = appState.bundle;

  const cc =
    String(bb!.pull.id) === String(btn.dataset.cm)
      ? bb!.pull
      : [...bb!.timeline, ...bb!.review_comments].find(
          value => String(value.id) === String(btn.dataset.cm),
        );

  const isPr = cc === bb!.pull;

  const own =
    !!appState.me &&
    ((cc as CommentLike | null)?.user || (cc as CommentLike | null)?.actor)
      ?.login === appState.me;

  const rect = btn.getBoundingClientRect();
  const id = +btn.dataset.cm!;
  const root = btn.dataset.root as unknown as HTMLElement;

  openPop({
    k: 'cm',
    x: Math.min(rect.left - 100, innerWidth - 180),
    y: rect.bottom + 4,
    hr: own || (!isPr && !!appState.hasToken),
    edit: own,
    hide: !isPr && !!appState.hasToken,
    del: own && !isPr,
    pick: hash => {
      closePop();
      cmAction(id, root, hash);
    },
  });
}

export function reactAdd(event: Event, btn: HTMLElement) {
  event.stopPropagation();

  const rect = btn.getBoundingClientRect();
  const kind = btn.dataset.rk!;
  const id = btn.dataset.rid!;

  openPop({
    k: 'react',
    x: Math.min(rect.left, innerWidth - 300),
    y: Math.min(rect.bottom + 4, innerHeight - 60),
    pick: color => {
      closePop();
      toggleReact(kind, id, color);
    },
  });
}

export function reactToggle(
  event: Event,
  kind: string,
  id: number | string,
  color: string,
) {
  event.stopPropagation();
  toggleReact(kind, id, color);
}

export async function threadAct(event: Event, node: string, how: string) {
  event.stopPropagation();

  // Optimistic: flip the thread locally right away, sync with GitHub in the background, undo on failure.
  const bundle = appState.bundle;

  const root = Object.keys(bundle!.thread_ids || {}).find(
    key => bundle!.thread_ids[key] === node,
  );

  const ids = [
    Number(root),
    ...bundle!.review_comments
      .filter(
        reviewComment => String(reviewComment.in_reply_to_id) === String(root),
      )
      .map(reviewComment => reviewComment.id),
  ].filter(Boolean);

  const prev = [...(bundle!.resolved_ids || [])];
  const res = how === 'resolve';

  bundle!.resolved_ids = res
    ? [...new Set([...prev, ...ids])]
    : prev.filter(left => !ids.includes(left));

  rerender();
  const actResult = await act(how, { body: node }, 'thread', true);

  if (actResult === undefined) {
    bundle!.resolved_ids = prev;
    rerender();
    alert(appState.actErr?.m || 'Could not update the thread.');

    return;
  }

  refreshPr();
}

export function applySuggestion(event: Event, id: string) {
  event.stopPropagation();

  const bundle = appState.bundle;

  const reviewComment = bundle!.review_comments.find(
    otherReviewComment => String(otherReviewComment.id) === id,
  );

  if (!reviewComment) {
    return;
  }

  confirmDlg(
    'Apply suggestion?',
    `This commits the change to ${reviewComment.path} on ${bundle!.pull.head.ref}.`,
    'Commit suggestion',
    false,
    async () => {
      (appState.applied ||= new Set()).add(String(reviewComment.id));
      rerender();

      const actResult = await act(
        'suggest',
        {
          extra: {
            head_repo: bundle!.pull.head.repo.full_name,
            branch: bundle!.pull.head.ref,
            path: reviewComment.path,
            line: reviewComment.line,
            start_line: reviewComment.start_line || null,
            text: sugOf(reviewComment),
          },
        },
        'sug',
        true,
      );

      if (actResult === undefined) {
        appState.applied!.delete(String(reviewComment.id));
        rerender();
        alert(appState.actErr?.m || 'Could not apply the suggestion.');

        return;
      }

      refreshPr().finally(() => {
        appState.applied!.delete(String(reviewComment.id));
      });
    },
  );
}

export async function sendReply(id: string) {
  const actResult = await act(
    'reply',
    { id: +id, body: appState.draft[`reply-${id}`] || '' },
    `reply-${id}`,
  );

  if (actResult === undefined) {
    return;
  }

  clearDraft(`reply-${id}`);

  if (!addLocal('reply', actResult, +id)) {
    await refreshPr(actResult.id);
  }
}

// Diff view handlers: shared by the live files tab and the imperatively bound copies.
export function setDiffMode(message: string) {
  appState.diffMode = message;
  localStorage.setItem('diffmode', message);
  rerender();
}

export function lcOpen(event: Event) {
  event.stopPropagation();
  appState.lcOpen = (event.currentTarget as HTMLElement).dataset.lc;
  rerender();
  focusDraft('lc');
}

export function lcCancel() {
  appState.lcOpen = '';
  delete appState.draft.lc;
  saveDrafts();
  rerender();
}

export function lcSuggest(ev: Event) {
  const cur = (appState.draft.lc || '').trimEnd();
  appState.draft.lc = `${cur}${cur ? '\n\n' : ''}\`\`\`suggestion\n${(ev.currentTarget as HTMLElement).dataset.code}\n\`\`\`\n`;
  saveDrafts();
  rerender();
  focusDraft('lc');
}

export function lcAdd() {
  const body = (appState.draft.lc || '').trim();

  if (!body || !appState.lcOpen) {
    return;
  }

  const [path, side, line] = appState.lcOpen.split('\u001f');

  (appState.pending![pendKey()] ||= []).push({
    id: Date.now(),
    path,
    side,
    line: +line,
    body,
  });

  savePending();
  appState.lcOpen = '';
  delete appState.draft.lc;
  saveDrafts();
  rerender();
}

export function lcDel(id: string) {
  appState.pending![pendKey()] = pendList().filter(
    pendingComment => String(pendingComment.id) !== id,
  );

  savePending();
  rerender();
}

export const rerender = () => {
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
};

// Live editors, so a new draft can be pushed into one and the newest can be focused.
// A focus request for an editor that is not built yet (it mounts lazily) waits in wantFocus.
const live = new Map<EditorHandle, string>();
const wantFocus = new Set<string>();

editorMount.focus = key => {
  const ed = [...live].find(([, otherKey]) => otherKey === key)?.[0];

  if (ed) {
    ed.focus?.();
  } else {
    wantFocus.add(key);
  }
};

export const focusDraft = (key: string) => request(`draft:focus:${key}`);

export const scrollDraft = (key: string) => request(`draft:scroll:${key}`);

export const blurDraft = (key: string) => request(`draft:blur:${key}`);

export function syncDraft(key: string) {
  live.forEach((otherKey, ed) => {
    if (otherKey === key) {
      ed.setMarkdown?.(appState.draft[key] || '');
    }
  });
}

// Called by every DraftBox when it mounts: builds the editor once its box is near the viewport; the returned function tears it down.
editorMount.preview = previewDraft;

editorMount.fn = (host, key, ph) => {
  if (!window.createEditor) {
    host.innerHTML = '<div class="act-err">Editor failed to load.</div>';

    return () => undefined;
  }

  const send = () => request(`draft:submit:${key}`);

  let ed: EditorHandle | null = null;
  let gone = false;

  const mount = () => {
    if (gone) {
      return;
    }

    ed = window.createEditor!(host, {
      value: appState.draft[key] || '',
      placeholder: ph,
      people: peopleList(),
      onChange: md => {
        appState.draft[key] = md;
        saveDrafts();
      },
      onSubmit: send,
    });

    live.set(ed, key);

    if (wantFocus.delete(key)) {
      ed.focus?.();
    }
  };

  // Editors are heavy: build each one only when its box is near the viewport.
  const io = new IntersectionObserver(
    en => {
      if (en.some(entry => entry.isIntersecting)) {
        io.disconnect();
        mount();
      }
    },
    { rootMargin: '300px' },
  );

  io.observe(host.parentElement || host);

  return () => {
    gone = true;
    io.disconnect();

    if (ed) {
      live.delete(ed);
      ed.destroy();
    }
  };
};
