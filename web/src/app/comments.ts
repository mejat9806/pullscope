import { act, prRef, rerender } from './actions';
import { appState, ASSOC, flashFor, REACTS, tauri } from './core';
import { qc } from './data';

import type {
  CommentBoxProps,
  HunkRow,
  PrHeaderProps,
  ReactionsProps,
} from '../components/Comments';
import type { Bundle, CommentLike, Pull, Reactions } from '../types';

export function stateOf(pull: Pull) {
  if (pull.merged) {
    return ['merged', 'git-merge', 'Merged'];
  }

  if (pull.state === 'closed') {
    return ['closed', 'git-pull-request-closed', 'Closed'];
  }

  if (pull.draft) {
    return ['draft', 'git-pull-request-draft', 'Draft'];
  }

  return ['open', 'git-pull-request', 'Open'];
}

export function prHeaderProps(bundle: Bundle): PrHeaderProps {
  const pull = bundle.pull;
  const [st, ic, label] = stateOf(pull);

  const commentsTotal =
    pull.comments +
    pull.review_comments +
    bundle.timeline.filter(timelineEvent => timelineEvent.event === 'reviewed')
      .length;

  const sq = (() => {
    const time = pull.additions + pull.deletions || 1;
    const small = time <= 5;

    const first = small
      ? pull.additions
      : Math.round((pull.additions / time) * 5);

    const delta = small ? pull.deletions : 5 - first;
    const arr = [];

    for (let index = 0; index < 5; index++) {
      arr.push(index < first ? 'a' : index < first + delta ? 'd' : '');
    }

    return arr;
  })();

  const splitOk =
    appState.tab !== 'files' &&
    appState.tab !== 'checks' &&
    appState.tab !== 'timeline';

  return {
    b: bundle,
    st,
    ic,
    label,
    tab: appState.tab,
    split: appState.split,
    hideSide: !!appState.hide.side,
    splitOk,
    commentsTotal,
    sq,
  };
}

export const isFolded = (key: string, def = false) =>
  key in appState.fold ? appState.fold[key] : def;

export const folded = (key: string, def = false) =>
  isFolded(key, def) ? ' folded' : '';

export const reactionProps = (
  reactions: Reactions | undefined,
  kind: string,
  id: number,
): ReactionsProps => ({
  r: reactions || {},
  kind,
  id,
  defs: REACTS.map(([otherKind, text]) => ({ k: otherKind, e: text })),
});

export const liveTasks = (hash: string) =>
  appState.hasToken
    ? hash.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, message =>
        message.replace(/\sdisabled(="[^"]*")?/g, ''),
      )
    : hash;

export function toggleTask(body: string, count: number) {
  let index = -1;
  let fence = false;

  return body
    .split('\n')
    .map(line => {
      if (/^\s*(```|~~~)/.test(line)) {
        fence = !fence;

        return line;
      }

      if (fence) {
        return line;
      }

      return line.replace(
        /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/,
        (message, value, otherValue, innerValue) =>
          ++index === count
            ? value + (otherValue === ' ' ? 'x' : ' ') + innerValue
            : message,
      );
    })
    .join('\n');
}

// The nth task-list checkbox of rendered comment HTML, set on or off.
const setTaskHtml = (html: string, count: number, on: boolean) => {
  let index = -1;

  return html.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, message =>
    ++index === count
      ? on
        ? /\schecked/.test(message)
          ? message
          : message.replace(/<input/, '<input checked')
        : message.replace(/\schecked(="[^"]*")?/, '')
      : message,
  );
};

// Ticking a task: the checkbox is drawn from the comment's HTML, so the new state is written there at once (the browser's own toggle is cancelled) and put back if saving fails.
async function taskClick(event: MouseEvent) {
  const checkbox = (event.target as HTMLElement).closest<HTMLInputElement>(
    'input.task-list-item-checkbox',
  );

  if (!checkbox || checkbox.disabled || !appState.bundle) {
    return;
  }

  const box = checkbox.closest<HTMLElement>('.tl-comment');
  const md = checkbox.closest<HTMLElement>('.markdown-body');

  if (!box || !md) {
    return;
  }

  event.preventDefault();

  const id = box.id.replace(/^c-/, '');
  const bundle = appState.bundle;

  const value =
    String(bundle.pull.id) === id
      ? bundle.pull
      : bundle.timeline.find(timelineEvent => String(timelineEvent.id) === id);

  if (!value) {
    return;
  }

  const count = [
    ...md.querySelectorAll('input.task-list-item-checkbox'),
  ].indexOf(checkbox);

  const body = toggleTask(value.body || '', count);

  if (body === (value.body || '')) {
    return;
  }

  const on = checkbox.checked;
  const was = value.body_html || '';
  value.body_html = setTaskHtml(was, count, on);
  rerender();

  const actResult =
    value === bundle.pull
      ? await act('edit', { body, extra: {} }, 'task', true)
      : await act(
          'edit_comment',
          { id: value.id, kind: 'issue_comment', body },
          'task',
          true,
        );

  if (actResult === undefined) {
    value.body_html = was;
    rerender();

    alert(
      `Couldn't update the checkbox: ${appState.actErr?.m || 'unknown error'}`,
    );

    return;
  }

  value.body = body;
  const key = `${prRef().repo}#${prRef().number}`;
  qc.set(key, bundle);
  qc.m.get(key)!.at = Date.now() - 20000;

  tauri?.invoke('invalidate_pr', { url: key }).catch(() => {});
}

// Whether a comment with this element id (`c-<id>`) is on the page.
export function hasComment(elId: string) {
  const bundle = appState.bundle;
  const id = elId.replace(/^c-/, '');

  if (!bundle) {
    return false;
  }

  return (
    String(bundle.pull.id) === id ||
    bundle.timeline.some(timelineEvent => String(timelineEvent.id) === id) ||
    bundle.review_comments.some(
      reviewComment => String(reviewComment.id) === id,
    )
  );
}

export function commentBoxProps(
  commentLike: CommentLike,
  { isPr = false, flush = false } = {},
): CommentBoxProps {
  return {
    onTask: event => {
      taskClick(event);
    },
    kb: appState.kbId === `c-${commentLike.id}`,
    flash: flashFor(`c-${commentLike.id}`),
    c: commentLike,
    assoc: ASSOC[commentLike.author_association ?? ''],
    bodyHtml:
      commentLike.body_html && commentLike.body_html.trim()
        ? liveTasks(commentLike.body_html)
        : '',
    folded: isFolded(`c:${commentLike.id}`),
    reactions: reactionProps(
      commentLike.reactions,
      isPr ? 'pr' : 'issue_comment',
      commentLike.id!,
    ),
    flush,
  };
}

export function hunkRows(hunk: string) {
  const rows: HunkRow[] = [];

  let offset = 0;
  let count = 0;

  for (const line of hunk.split('\n')) {
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);

      if (match) {
        offset = +match[1];
        count = +match[2];
      }

      rows.push({ kind: 'hunk', text: line });
      continue;
    }

    const text = line[0];
    const txt = line.slice(1);

    if (text === '+') {
      rows.push({ kind: 'add', n: count++, text: txt });
    } else if (text === '-') {
      rows.push({ kind: 'del', o: offset++, text: txt });
    } else if (text === '\\') {
      rows.push({ kind: 'meta', text: line });
    } else {
      rows.push({ kind: 'ctx', o: offset++, n: count++, text: txt });
    }
  }

  return rows;
}
