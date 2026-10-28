import { act, prRef, rerender } from './actions';
import { ASSOC, flashFor, REACTS, S, tauri } from './core';
import { qc } from './data';

import type {
  CommentBoxProps,
  HunkRow,
  PrHeaderProps,
  ReactionsProps,
} from '../components/Comments';
import type { Bundle, CommentLike, Pull, Reactions } from '../types';

export function stateOf(p: Pull) {
  if (p.merged) {
    return ['merged', 'git-merge', 'Merged'];
  }

  if (p.state === 'closed') {
    return ['closed', 'git-pull-request-closed', 'Closed'];
  }

  if (p.draft) {
    return ['draft', 'git-pull-request-draft', 'Draft'];
  }

  return ['open', 'git-pull-request', 'Open'];
}

export function prHeaderProps(b: Bundle): PrHeaderProps {
  const p = b.pull;
  const [st, ic, label] = stateOf(p);

  const commentsTotal =
    p.comments +
    p.review_comments +
    b.timeline.filter(e => e.event === 'reviewed').length;

  const sq = (() => {
    const t = p.additions + p.deletions || 1;
    const small = t <= 5;
    const a = small ? p.additions : Math.round((p.additions / t) * 5);
    const d = small ? p.deletions : 5 - a;
    const arr = [];

    for (let i = 0; i < 5; i++) {
      arr.push(i < a ? 'a' : i < a + d ? 'd' : '');
    }

    return arr;
  })();

  const splitOk =
    S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline';

  return {
    b,
    st,
    ic,
    label,
    tab: S.tab,
    split: S.split,
    hideSide: !!S.hide.side,
    splitOk,
    commentsTotal,
    sq,
  };
}

export const isFolded = (k: string, def = false) =>
  k in S.fold ? S.fold[k] : def;

export const folded = (k: string, def = false) =>
  isFolded(k, def) ? ' folded' : '';

export const reactionProps = (
  r: Reactions | undefined,
  kind: string,
  id: number,
): ReactionsProps => ({
  r: r || {},
  kind,
  id,
  defs: REACTS.map(([k, e]) => ({ k, e })),
});

export const liveTasks = (h: string) =>
  S.hasToken
    ? h.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, m =>
        m.replace(/\sdisabled(="[^"]*")?/g, ''),
      )
    : h;

export function toggleTask(body: string, n: number) {
  let i = -1;
  let fence = false;

  return body
    .split('\n')
    .map(l => {
      if (/^\s*(```|~~~)/.test(l)) {
        fence = !fence;

        return l;
      }

      if (fence) {
        return l;
      }

      return l.replace(
        /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/,
        (m, a, x, z) => (++i === n ? a + (x === ' ' ? 'x' : ' ') + z : m),
      );
    })
    .join('\n');
}

// The nth task-list checkbox of rendered comment HTML, set on or off.
const setTaskHtml = (html: string, n: number, on: boolean) => {
  let i = -1;

  return html.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, m =>
    ++i === n
      ? on
        ? /\schecked/.test(m)
          ? m
          : m.replace(/<input/, '<input checked')
        : m.replace(/\schecked(="[^"]*")?/, '')
      : m,
  );
};

// Ticking a task: the checkbox is drawn from the comment's HTML, so the new state is written there at once (the browser's own toggle is cancelled) and put back if saving fails.
async function taskClick(e: MouseEvent) {
  const checkbox = (e.target as HTMLElement).closest<HTMLInputElement>(
    'input.task-list-item-checkbox',
  );

  if (!checkbox || checkbox.disabled || !S.bundle) {
    return;
  }

  const box = checkbox.closest<HTMLElement>('.tl-comment');
  const md = checkbox.closest<HTMLElement>('.markdown-body');

  if (!box || !md) {
    return;
  }

  e.preventDefault();

  const id = box.id.replace(/^c-/, '');
  const b = S.bundle;

  const c =
    String(b.pull.id) === id
      ? b.pull
      : b.timeline.find(x => String(x.id) === id);

  if (!c) {
    return;
  }

  const n = [...md.querySelectorAll('input.task-list-item-checkbox')].indexOf(
    checkbox,
  );

  const body = toggleTask(c.body || '', n);

  if (body === (c.body || '')) {
    return;
  }

  const on = checkbox.checked;
  const was = c.body_html || '';
  c.body_html = setTaskHtml(was, n, on);
  rerender();

  const r =
    c === b.pull
      ? await act('edit', { body, extra: {} }, 'task', true)
      : await act(
          'edit_comment',
          { id: c.id, kind: 'issue_comment', body },
          'task',
          true,
        );

  if (r === undefined) {
    c.body_html = was;
    rerender();
    alert(`Couldn't update the checkbox: ${S.actErr?.m || 'unknown error'}`);

    return;
  }

  c.body = body;
  const key = `${prRef().repo}#${prRef().number}`;
  qc.set(key, b);
  qc.m.get(key)!.at = Date.now() - 20000;

  tauri?.invoke('invalidate_pr', { url: key }).catch(() => {});
}

// Whether a comment with this element id (`c-<id>`) is on the page.
export function hasComment(elId: string) {
  const b = S.bundle;
  const id = elId.replace(/^c-/, '');

  if (!b) {
    return false;
  }

  return (
    String(b.pull.id) === id ||
    b.timeline.some(x => String(x.id) === id) ||
    b.review_comments.some(x => String(x.id) === id)
  );
}

export function commentBoxProps(
  c: CommentLike,
  { isPr = false, flush = false } = {},
): CommentBoxProps {
  return {
    onTask: e => {
      taskClick(e);
    },
    kb: S.kbId === `c-${c.id}`,
    flash: flashFor(`c-${c.id}`),
    c,
    assoc: ASSOC[c.author_association ?? ''],
    bodyHtml: c.body_html && c.body_html.trim() ? liveTasks(c.body_html) : '',
    folded: isFolded(`c:${c.id}`),
    reactions: reactionProps(c.reactions, isPr ? 'pr' : 'issue_comment', c.id!),
    flush,
  };
}

export function hunkRows(hunk: string) {
  const rows: HunkRow[] = [];

  let o = 0;
  let n = 0;

  for (const line of hunk.split('\n')) {
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);

      if (m) {
        o = +m[1];
        n = +m[2];
      }

      rows.push({ kind: 'hunk', text: line });
      continue;
    }

    const t = line[0];
    const txt = line.slice(1);

    if (t === '+') {
      rows.push({ kind: 'add', n: n++, text: txt });
    } else if (t === '-') {
      rows.push({ kind: 'del', o: o++, text: txt });
    } else if (t === '\\') {
      rows.push({ kind: 'meta', text: line });
    } else {
      rows.push({ kind: 'ctx', o: o++, n: n++, text: txt });
    }
  }

  return rows;
}
