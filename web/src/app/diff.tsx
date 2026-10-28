import { LcCards, LcEdit, ReviewBlock, ThreadRow } from '../components/Diff';
import { errMsg } from './actions';
import { hunkRows, isFolded, reactionProps } from './comments';
import { esc, flashFor, load, S, whenParts } from './core';
import { b0open } from './mergebox';

import type { VNode } from 'preact';
import type { ConvHandlers } from '../components/Comments';
import type {
  LcHandlers,
  ReviewBlockProps,
  SugProps,
  TcProps,
  ThreadRowProps,
} from '../components/Diff';
import type {
  Bundle,
  PendingComment,
  ReviewComment,
  TimelineEvent,
} from '../types';

// ---- File diffs: unified or side-by-side, syntax highlighted, with line comments for a draft review ----
S.diffMode = localStorage.getItem('diffmode') || 'unified';

S.pending = load<Record<string, PendingComment[]>>('pending', {});

export const pendKey = () =>
  S.bundle
    ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`
    : '';

export const pendList = () => S.pending![pendKey()] || [];

export const savePending = () =>
  localStorage.setItem('pending', JSON.stringify(S.pending));

export function parsePatch(patch: string) {
  const rows = [];

  let o = 0;
  let n = 0;

  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);

      if (m) {
        o = +m[1];
        n = +m[2];
      }

      rows.push({ t: 'hunk', text: line });
      continue;
    }

    const c = line[0];
    const txt = line.slice(1);

    if (c === '+') {
      rows.push({ t: 'add', n: n++, text: txt });
    } else if (c === '-') {
      rows.push({ t: 'del', o: o++, text: txt });
    } else if (c === '\\') {
      rows.push({ t: 'note', text: line });
    } else {
      rows.push({ t: 'ctx', o: o++, n: n++, text: txt });
    }
  }

  return rows;
}

export const codeHtml = (text: string, path: string) =>
  (window.hlLine && window.hlLine(text, path)) ?? esc(text);

// "+" button + inline editor + saved draft comments for one line
export const lineKey = (path: string, line: number, side: 'LEFT' | 'RIGHT') =>
  `${path}\u001f${side}\u001f${line}`;

// Pending comments are Markdown; show code fences (incl. suggestions) as blocks, everything else as plain text.
export const lcBody = (md: string) =>
  String(md)
    .split(/```/)
    .map((p, i) =>
      i % 2
        ? (() => {
            const m = p.match(/^(\w*)\n?([\s\S]*)$/);

            return `<pre class="lc-code${m![1] === 'suggestion' ? ' sug' : ''}">${m![1] === 'suggestion' ? '<b>Suggested change</b>\n' : ''}${esc(m![2].replace(/\n$/, ''))}</pre>`;
          })()
        : esc(p).replace(/\n/g, '<br>'),
    )
    .join('');

// Existing review threads for one line, shown read-only under it (reply / resolve live in the Conversation tab).
export function threadsFor(path: string) {
  return (S.bundle?.review_comments || []).filter(c => c.path === path);
}

export interface DiffHandlers {
  conv: ConvHandlers;
  lc: LcHandlers;
  plus: (e: Event) => void;
}

export function lineThreads(
  path: string,
  line: number,
  side: 'LEFT' | 'RIGHT',
  cols: number,
  on: DiffHandlers,
): VNode[] {
  const all = threadsFor(path);

  if (!all.length) {
    return [];
  }

  const roots = all.filter(
    c =>
      !c.in_reply_to_id &&
      (c.line ?? c.original_line) === line &&
      (c.side || 'RIGHT') === side,
  );

  if (!roots.length) {
    return [];
  }

  const res = new Set(S.bundle!.resolved_ids || []);
  const b = S.bundle;

  const card = (c: ReviewComment, rootId: number): TcProps => ({
    user: c.user,
    login: c.user?.login || 'ghost',
    at: c.created_at,
    id: c.id,
    root: rootId,
    withMenu: !!S.hasToken,
    bodyHtml: c.body_html || esc(c.body || ''),
    reactions: reactionProps(c.reactions, 'review_comment', c.id),
    sug: null,
    anchorId: false,
  });

  return roots.map(r => {
    const isRes = res.has(r.id);
    const tid = (b!.thread_ids || {})[r.id];
    const list = [r, ...all.filter(c => c.in_reply_to_id === r.id)];

    const p: ThreadRowProps = {
      cols,
      k: `t:${r.id}`,
      def: isRes,
      folded: isFolded(`t:${r.id}`, isRes),
      side: side === 'LEFT' ? 'L' : 'R',
      line,
      outdated: r.line == null,
      resolved: isRes,
      cards: list.map(c => card(c, r.id)),
      reply: S.hasToken
        ? { rid: r.id, ph: 'Write a reply', err: errMsg(`reply-${r.id}`) }
        : null,
      act: tid && S.hasToken ? { tid, res: isRes } : null,
    };

    return <ThreadRow {...p} on={on.conv} />;
  });
}

export function lineExtras(
  path: string,
  line: number,
  side: 'LEFT' | 'RIGHT',
  cols: number,
  canComment: boolean,
  on: DiffHandlers,
  text?: string,
): VNode[] {
  const k = lineKey(path, line, side);
  const th = lineThreads(path, line, side, cols, on);

  const mine = pendList().filter(
    c => c.path === path && c.line === line && c.side === side,
  );

  const open = canComment && S.lcOpen === k;

  if (!mine.length && !open) {
    return th;
  }

  return [
    ...th,
    <tr class="lc-row">
      <td colspan={cols}>
        <div class="lc">
          {mine.length ? (
            <LcCards
              cards={mine.map(c => ({ id: c.id, body: lcBody(c.body) }))}
              on={on.lc}
            />
          ) : (
            ''
          )}
          {open ? (
            <LcEdit
              code={side === 'RIGHT' && text !== undefined ? text : null}
              on={on.lc}
            />
          ) : (
            ''
          )}
        </div>
      </td>
    </tr>,
  ];
}

// Built diff rows are cached per file as vnodes: Preact skips an identical vnode, so redraws, tab switches and returning to a PR do not rebuild or re-diff thousands of rows.
export const diffCache = new Map<string, { patch: string; node: VNode }>();

export function diffTable(
  patch: string,
  path: string,
  canComment: boolean,
  on: DiffHandlers,
): VNode {
  const open = S.lcOpen && String(S.lcOpen).includes(path);

  if (open) {
    return diffTableBuild(patch, path, canComment, on);
  }

  const key = `${(S.busySels || []).join(',')}|${S.flash?.id}${S.flash?.n}|${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter(c => c.path === path))}|${threadsFor(
    path,
  )
    .map(
      c =>
        `${c.id}:${c.updated_at || ''}${JSON.stringify(c.reactions || {})}${
          (S.bundle!.resolved_ids || []).includes(c.id) ? 'r' : ''
        }${
          isFolded(`t:${c.id}`, (S.bundle!.resolved_ids || []).includes(c.id))
            ? 'f'
            : ''
        }`,
    )
    .join(
      ',',
    )}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith('reply-') ? S.actErr.k + S.actErr.m : ''}`;

  const hit = diffCache.get(key);

  if (hit && hit.patch === patch) {
    return hit.node;
  }

  const node = diffTableBuild(patch, path, canComment, on);
  diffCache.set(key, { patch, node });

  if (diffCache.size > 400) {
    diffCache.delete(diffCache.keys().next().value!);
  }

  return node;
}

const Code = ({
  text,
  path,
  cls = '',
  marker,
}: {
  text: string;
  path: string;
  cls?: string;
  marker?: string;
}) => (
  <td
    class={`code${cls}`}
    data-marker={marker}
    dangerouslySetInnerHTML={{ __html: codeHtml(text, path) }}
  />
);

export function diffTableBuild(
  patch: string,
  path: string,
  canComment: boolean,
  on: DiffHandlers,
): VNode {
  const rows = parsePatch(patch);

  const plus = (line: number, side: 'LEFT' | 'RIGHT') =>
    canComment ? (
      <button
        class="lc-plus"
        data-lc={lineKey(path, line, side)}
        title="Add a comment on this line"
        onClick={on.plus}
      >
        +
      </button>
    ) : null;

  const out: VNode[] = [];

  if (S.diffMode === 'split') {
    let i = 0;

    while (i < rows.length) {
      const r = rows[i];

      if (r.t === 'hunk') {
        out.push(
          <tr class="hunk">
            <td class="num"></td>
            <td class="code" colspan={3}>
              {r.text}
            </td>
          </tr>,
        );

        i++;
        continue;
      }

      if (r.t === 'note') {
        i++;
        continue;
      }

      if (r.t === 'ctx') {
        out.push(
          <tr>
            <td class="num">{r.o}</td>
            <Code text={r.text} path={path} marker=" " />
            <td class="num">
              {r.n}
              {plus(r.n!, 'RIGHT')}
            </td>
            <Code text={r.text} path={path} marker=" " />
          </tr>,
          ...lineExtras(path, r.n!, 'RIGHT', 4, canComment, on, r.text),
        );

        i++;
        continue;
      }

      const dels = [];
      const adds = [];

      while (rows[i] && rows[i].t === 'del') {
        dels.push(rows[i++]);
      }

      while (rows[i] && rows[i].t === 'add') {
        adds.push(rows[i++]);
      }

      for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
        const d = dels[k];
        const a = adds[k];

        out.push(
          <tr>
            <td class={`num${d ? ' del' : ' empty'}`}>
              {d ? (
                <>
                  {d.o}
                  {plus(d.o!, 'LEFT')}
                </>
              ) : (
                ''
              )}
            </td>
            {d ? (
              <Code text={d.text} path={path} cls=" del" marker="-" />
            ) : (
              <td class="code empty"></td>
            )}
            <td class={`num${a ? ' add' : ' empty'}`}>
              {a ? (
                <>
                  {a.n}
                  {plus(a.n!, 'RIGHT')}
                </>
              ) : (
                ''
              )}
            </td>
            {a ? (
              <Code text={a.text} path={path} cls=" add" marker="+" />
            ) : (
              <td class="code empty"></td>
            )}
          </tr>,
          ...(d ? lineExtras(path, d.o!, 'LEFT', 4, canComment, on) : []),
          ...(a
            ? lineExtras(path, a.n!, 'RIGHT', 4, canComment, on, a.text)
            : []),
        );
      }
    }

    return (
      <table class="diff sbs">
        <colgroup>
          <col style="width:64px" />
          <col />
          <col style="width:64px" />
          <col />
        </colgroup>
        <tbody>{out}</tbody>
      </table>
    );
  }

  for (const r of rows) {
    if (r.t === 'hunk') {
      out.push(
        <tr class="hunk">
          <td class="num">…</td>
          <td class="num">…</td>
          <td class="code">{r.text}</td>
        </tr>,
      );
    } else if (r.t === 'note') {
      out.push(
        <tr>
          <td class="num"></td>
          <td class="num"></td>
          <td class="code" style="color:var(--fgColor-muted)">
            {r.text}
          </td>
        </tr>,
      );
    } else if (r.t === 'add') {
      out.push(
        <tr class="add">
          <td class="num"></td>
          <td class="num">
            {r.n}
            {plus(r.n!, 'RIGHT')}
          </td>
          <Code text={r.text} path={path} marker="+" />
        </tr>,
        ...lineExtras(path, r.n!, 'RIGHT', 3, canComment, on, r.text),
      );
    } else if (r.t === 'del') {
      out.push(
        <tr class="del">
          <td class="num">
            {r.o}
            {plus(r.o!, 'LEFT')}
          </td>
          <td class="num"></td>
          <Code text={r.text} path={path} marker="-" />
        </tr>,
        ...lineExtras(path, r.o!, 'LEFT', 3, canComment, on),
      );
    } else {
      out.push(
        <tr>
          <td class="num">{r.o}</td>
          <td class="num">
            {r.n}
            {plus(r.n!, 'RIGHT')}
          </td>
          <Code text={r.text} path={path} marker=" " />
        </tr>,
        ...lineExtras(path, r.n!, 'RIGHT', 3, canComment, on, r.text),
      );
    }
  }

  return (
    <table class="diff">
      <colgroup>
        <col style="width:64px" />
        <col style="width:64px" />
        <col />
      </colgroup>
      <tbody>{out}</tbody>
    </table>
  );
}

// ```suggestion blocks in a review comment can be applied as a commit on the PR branch
export const sugOf = (c: { body?: string | null }) => {
  const m = (c.body || '').match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/);

  return m ? m[1] : null;
};

export function suggestProps(
  c: ReviewComment,
  b: Bundle,
  list: ReviewComment[],
): SugProps | null {
  const t = sugOf(c);

  if (t !== null && S.applied?.has(String(c.id))) {
    return { kind: 'note', text: 'Applying suggestion…' };
  }

  if (
    t === null ||
    !b0open() ||
    list.some(x => (b.resolved_ids || []).includes(x.id))
  ) {
    return null;
  }

  const p = b.pull;

  const mine =
    (p.head.repo && !p.head.repo.fork) ||
    (p.head.repo && p.head.repo.full_name === p.base.repo.full_name);

  if (!c.line) {
    return {
      kind: 'note',
      text: 'Outdated suggestion — the lines have changed.',
    };
  }

  return {
    kind: 'btn',
    id: c.id,
    disabled: !p.head.repo,
    ref: p.head.ref,
    mine: !!mine,
  };
}

export function reviewBlockProps(
  e: TimelineEvent,
  b: Bundle,
): ReviewBlockProps | null {
  const resolved = new Set(b.resolved_ids || []);
  const isRes = (list: ReviewComment[]) => list.some(c => resolved.has(c.id));

  const stateMap: Record<string, string[]> = {
    approved: ['check', 'success', 'approved these changes'],
    changes_requested: ['file-diff', 'danger', 'requested changes'],
    commented: ['eye', '', 'reviewed'],
    dismissed: ['x', '', 'dismissed a review'],
  };

  const [ic, kind, verb] = stateMap[e.state!.toLowerCase()] || [
    'eye',
    '',
    'reviewed',
  ];

  const mine = b.review_comments.filter(c => c.pull_request_review_id === e.id);
  const mineIds = new Set(mine.map(c => c.id));

  const cs = [
    ...mine,
    ...b.review_comments.filter(
      c => c.pull_request_review_id !== e.id && mineIds.has(c.in_reply_to_id!),
    ),
  ].filter(
    c =>
      !S.who.length ||
      S.who.includes(e.user?.login ?? '') ||
      S.who.includes(c.user?.login),
  );

  const hasBody = e.body_html && e.body_html.trim();
  const byPath: Record<string, ReviewComment[]> = {};

  cs.forEach(c =>
    (byPath[`${c.path}\u0000${c.original_position ?? c.position}`] ||= []).push(
      c,
    ),
  );

  const all = Object.values(byPath).map(l =>
    l.sort(
      (x, y) =>
        (x.in_reply_to_id ? 1 : 0) - (y.in_reply_to_id ? 1 : 0) || x.id - y.id,
    ),
  );

  const allRes = all.length > 0 && all.every(isRes);
  const nres = all.filter(isRes).length;
  const rk = `r:${e.id}`;
  const lists = S.unres ? all.filter(l => !isRes(l)) : all;

  if (S.unres && !lists.length) {
    return null;
  }

  const threads = lists.map(list => ({
    folded: isFolded(`t:${list[0].id}`, isRes(list)),
    k: `t:${list[0].id}`,
    def: isRes(list),
    path: list[0].path,
    resolved: isRes(list),
    tid: (b.thread_ids || {})[list[0].id] ? b.thread_ids[list[0].id] : null,
    hunk: hunkRows(list[0].diff_hunk || ''),
    cards: list.map((c): TcProps => ({
      user: c.user,
      login: c.user.login,
      at: c.created_at,
      id: c.id,
      root: list[0].id,
      withMenu: true,
      bodyHtml: c.body_html || '',
      reactions: reactionProps(c.reactions, 'review_comment', c.id),
      sug: suggestProps(c, b, list),
      anchorId: true,
      kb: S.kbId === `c-${c.id}`,
      flash: flashFor(`c-${c.id}`),
    })),
    reply: {
      rid: list[0].id,
      ph: 'Reply…',
      err: errMsg(`reply-${list[0].id}`),
    },
  }));

  const sum = all.length
    ? {
        ok: allRes,
        allRes,
        text: `${all.length} thread${all.length === 1 ? '' : 's'}${nres ? ` · ${nres} resolved` : ''}`,
      }
    : null;

  return {
    folded: isFolded(rk, allRes),
    k: rk,
    kind,
    ic,
    user: e.user,
    verb,
    url: e.html_url ?? '',
    at: whenParts(e.submitted_at!).text,
    sum,
    bodyHtml: hasBody ? e.body_html! : '',
    threads,
    allRes,
  };
}

void ReviewBlock;
