import { LcCards, LcEdit, ReviewBlock, ThreadRow } from '../components/Diff';
import { errMsg } from './actions';
import { hunkRows, isFolded, reactionProps } from './comments';
import { appState, esc, flashFor, load, whenParts } from './core';
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
appState.diffMode = localStorage.getItem('diffmode') || 'unified';

appState.pending = load<Record<string, PendingComment[]>>('pending', {});

export const pendKey = () =>
  appState.bundle
    ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
    : '';

export const pendList = () => appState.pending![pendKey()] || [];

export const savePending = () =>
  localStorage.setItem('pending', JSON.stringify(appState.pending));

export function parsePatch(patch: string) {
  const rows = [];

  let offset = 0;
  let count = 0;

  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/);

      if (match) {
        offset = +match[1];
        count = +match[2];
      }

      rows.push({ t: 'hunk', text: line });
      continue;
    }

    const color = line[0];
    const txt = line.slice(1);

    if (color === '+') {
      rows.push({ t: 'add', n: count++, text: txt });
    } else if (color === '-') {
      rows.push({ t: 'del', o: offset++, text: txt });
    } else if (color === '\\') {
      rows.push({ t: 'note', text: line });
    } else {
      rows.push({ t: 'ctx', o: offset++, n: count++, text: txt });
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
    .map((path, index) =>
      index % 2
        ? (() => {
            const match = path.match(/^(\w*)\n?([\s\S]*)$/);

            return `<pre class="lc-code${match![1] === 'suggestion' ? ' sug' : ''}">${match![1] === 'suggestion' ? '<b>Suggested change</b>\n' : ''}${esc(match![2].replace(/\n$/, ''))}</pre>`;
          })()
        : esc(path).replace(/\n/g, '<br>'),
    )
    .join('');

// Existing review threads for one line, shown read-only under it (reply / resolve live in the Conversation tab).
export function threadsFor(path: string) {
  return (appState.bundle?.review_comments || []).filter(
    reviewComment => reviewComment.path === path,
  );
}

export interface DiffHandlers {
  conv: ConvHandlers;
  lc: LcHandlers;
  plus: (event: Event) => void;
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
    reviewComment =>
      !reviewComment.in_reply_to_id &&
      (reviewComment.line ?? reviewComment.original_line) === line &&
      (reviewComment.side || 'RIGHT') === side,
  );

  if (!roots.length) {
    return [];
  }

  const res = new Set(appState.bundle!.resolved_ids || []);
  const bundle = appState.bundle;

  const card = (reviewComment: ReviewComment, rootId: number): TcProps => ({
    user: reviewComment.user,
    login: reviewComment.user?.login || 'ghost',
    at: reviewComment.created_at,
    id: reviewComment.id,
    root: rootId,
    withMenu: !!appState.hasToken,
    bodyHtml: reviewComment.body_html || esc(reviewComment.body || ''),
    reactions: reactionProps(
      reviewComment.reactions,
      'review_comment',
      reviewComment.id,
    ),
    sug: null,
    anchorId: false,
  });

  return roots.map(reviewComment => {
    const isRes = res.has(reviewComment.id);
    const tid = (bundle!.thread_ids || {})[reviewComment.id];

    const list = [
      reviewComment,
      ...all.filter(
        otherReviewComment =>
          otherReviewComment.in_reply_to_id === reviewComment.id,
      ),
    ];

    const props: ThreadRowProps = {
      cols,
      k: `t:${reviewComment.id}`,
      def: isRes,
      folded: isFolded(`t:${reviewComment.id}`, isRes),
      side: side === 'LEFT' ? 'L' : 'R',
      line,
      outdated: reviewComment.line == null,
      resolved: isRes,
      cards: list.map(otherReviewComment =>
        card(otherReviewComment, reviewComment.id),
      ),
      reply: appState.hasToken
        ? {
            rid: reviewComment.id,
            ph: 'Write a reply',
            err: errMsg(`reply-${reviewComment.id}`),
          }
        : null,
      act: tid && appState.hasToken ? { tid, res: isRes } : null,
    };

    return <ThreadRow {...props} on={on.conv} />;
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
  const key = lineKey(path, line, side);
  const th = lineThreads(path, line, side, cols, on);

  const mine = pendList().filter(
    pendingComment =>
      pendingComment.path === path &&
      pendingComment.line === line &&
      pendingComment.side === side,
  );

  const open = canComment && appState.lcOpen === key;

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
              cards={mine.map(pendingComment => ({
                id: pendingComment.id,
                body: lcBody(pendingComment.body),
              }))}
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
  const open = appState.lcOpen && String(appState.lcOpen).includes(path);

  if (open) {
    return diffTableBuild(patch, path, canComment, on);
  }

  const key = `${(appState.busySels || []).join(',')}|${appState.flash?.id}${appState.flash?.n}|${window.hlLine ? 1 : 0}|${appState.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter(pendingComment => pendingComment.path === path))}|${threadsFor(
    path,
  )
    .map(
      reviewComment =>
        `${reviewComment.id}:${reviewComment.updated_at || ''}${JSON.stringify(reviewComment.reactions || {})}${
          (appState.bundle!.resolved_ids || []).includes(reviewComment.id)
            ? 'r'
            : ''
        }${
          isFolded(
            `t:${reviewComment.id}`,
            (appState.bundle!.resolved_ids || []).includes(reviewComment.id),
          )
            ? 'f'
            : ''
        }`,
    )
    .join(
      ',',
    )}|${appState.hasToken ? 1 : 0}|${appState.actErr && String(appState.actErr.k).startsWith('reply-') ? appState.actErr.k + appState.actErr.m : ''}`;

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

  if (appState.diffMode === 'split') {
    let index = 0;

    while (index < rows.length) {
      const value = rows[index];

      if (value.t === 'hunk') {
        out.push(
          <tr class="hunk">
            <td class="num"></td>
            <td class="code" colspan={3}>
              {value.text}
            </td>
          </tr>,
        );

        index++;
        continue;
      }

      if (value.t === 'note') {
        index++;
        continue;
      }

      if (value.t === 'ctx') {
        out.push(
          <tr>
            <td class="num">{value.o}</td>
            <Code text={value.text} path={path} marker=" " />
            <td class="num">
              {value.n}
              {plus(value.n!, 'RIGHT')}
            </td>
            <Code text={value.text} path={path} marker=" " />
          </tr>,
          ...lineExtras(path, value.n!, 'RIGHT', 4, canComment, on, value.text),
        );

        index++;
        continue;
      }

      const dels = [];
      const adds = [];

      while (rows[index] && rows[index].t === 'del') {
        dels.push(rows[index++]);
      }

      while (rows[index] && rows[index].t === 'add') {
        adds.push(rows[index++]);
      }

      for (
        let otherIndex = 0;
        otherIndex < Math.max(dels.length, adds.length);
        otherIndex++
      ) {
        const otherValue = dels[otherIndex];
        const innerValue = adds[otherIndex];

        out.push(
          <tr>
            <td class={`num${otherValue ? ' del' : ' empty'}`}>
              {otherValue ? (
                <>
                  {otherValue.o}
                  {plus(otherValue.o!, 'LEFT')}
                </>
              ) : (
                ''
              )}
            </td>
            {otherValue ? (
              <Code text={otherValue.text} path={path} cls=" del" marker="-" />
            ) : (
              <td class="code empty"></td>
            )}
            <td class={`num${innerValue ? ' add' : ' empty'}`}>
              {innerValue ? (
                <>
                  {innerValue.n}
                  {plus(innerValue.n!, 'RIGHT')}
                </>
              ) : (
                ''
              )}
            </td>
            {innerValue ? (
              <Code text={innerValue.text} path={path} cls=" add" marker="+" />
            ) : (
              <td class="code empty"></td>
            )}
          </tr>,
          ...(otherValue
            ? lineExtras(path, otherValue.o!, 'LEFT', 4, canComment, on)
            : []),
          ...(innerValue
            ? lineExtras(
                path,
                innerValue.n!,
                'RIGHT',
                4,
                canComment,
                on,
                innerValue.text,
              )
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

  for (const value of rows) {
    if (value.t === 'hunk') {
      out.push(
        <tr class="hunk">
          <td class="num">…</td>
          <td class="num">…</td>
          <td class="code">{value.text}</td>
        </tr>,
      );
    } else if (value.t === 'note') {
      out.push(
        <tr>
          <td class="num"></td>
          <td class="num"></td>
          <td class="code" style="color:var(--fgColor-muted)">
            {value.text}
          </td>
        </tr>,
      );
    } else if (value.t === 'add') {
      out.push(
        <tr class="add">
          <td class="num"></td>
          <td class="num">
            {value.n}
            {plus(value.n!, 'RIGHT')}
          </td>
          <Code text={value.text} path={path} marker="+" />
        </tr>,
        ...lineExtras(path, value.n!, 'RIGHT', 3, canComment, on, value.text),
      );
    } else if (value.t === 'del') {
      out.push(
        <tr class="del">
          <td class="num">
            {value.o}
            {plus(value.o!, 'LEFT')}
          </td>
          <td class="num"></td>
          <Code text={value.text} path={path} marker="-" />
        </tr>,
        ...lineExtras(path, value.o!, 'LEFT', 3, canComment, on),
      );
    } else {
      out.push(
        <tr>
          <td class="num">{value.o}</td>
          <td class="num">
            {value.n}
            {plus(value.n!, 'RIGHT')}
          </td>
          <Code text={value.text} path={path} marker=" " />
        </tr>,
        ...lineExtras(path, value.n!, 'RIGHT', 3, canComment, on, value.text),
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
export const sugOf = (item: { body?: string | null }) => {
  const match = (item.body || '').match(
    /```suggestion[^\n]*\n([\s\S]*?)\n?```/,
  );

  return match ? match[1] : null;
};

export function suggestProps(
  reviewComment: ReviewComment,
  bundle: Bundle,
  list: ReviewComment[],
): SugProps | null {
  const text = sugOf(reviewComment);

  if (text !== null && appState.applied?.has(String(reviewComment.id))) {
    return { kind: 'note', text: 'Applying suggestion…' };
  }

  if (
    text === null ||
    !b0open() ||
    list.some(otherReviewComment =>
      (bundle.resolved_ids || []).includes(otherReviewComment.id),
    )
  ) {
    return null;
  }

  const pull = bundle.pull;

  const mine =
    (pull.head.repo && !pull.head.repo.fork) ||
    (pull.head.repo && pull.head.repo.full_name === pull.base.repo.full_name);

  if (!reviewComment.line) {
    return {
      kind: 'note',
      text: 'Outdated suggestion — the lines have changed.',
    };
  }

  return {
    kind: 'btn',
    id: reviewComment.id,
    disabled: !pull.head.repo,
    ref: pull.head.ref,
    mine: !!mine,
  };
}

export function reviewBlockProps(
  timelineEvent: TimelineEvent,
  bundle: Bundle,
): ReviewBlockProps | null {
  const resolved = new Set(bundle.resolved_ids || []);

  const isRes = (list: ReviewComment[]) =>
    list.some(reviewComment => resolved.has(reviewComment.id));

  const stateMap: Record<string, string[]> = {
    approved: ['check', 'success', 'approved these changes'],
    changes_requested: ['file-diff', 'danger', 'requested changes'],
    commented: ['eye', '', 'reviewed'],
    dismissed: ['x', '', 'dismissed a review'],
  };

  const [ic, kind, verb] = stateMap[timelineEvent.state!.toLowerCase()] || [
    'eye',
    '',
    'reviewed',
  ];

  const mine = bundle.review_comments.filter(
    reviewComment => reviewComment.pull_request_review_id === timelineEvent.id,
  );

  const mineIds = new Set(mine.map(reviewComment => reviewComment.id));

  const cs = [
    ...mine,
    ...bundle.review_comments.filter(
      reviewComment =>
        reviewComment.pull_request_review_id !== timelineEvent.id &&
        mineIds.has(reviewComment.in_reply_to_id!),
    ),
  ].filter(
    reviewComment =>
      !appState.who.length ||
      appState.who.includes(timelineEvent.user?.login ?? '') ||
      appState.who.includes(reviewComment.user?.login),
  );

  const hasBody = timelineEvent.body_html && timelineEvent.body_html.trim();
  const byPath: Record<string, ReviewComment[]> = {};

  cs.forEach(reviewComment =>
    (byPath[
      `${reviewComment.path}\u0000${reviewComment.original_position ?? reviewComment.position}`
    ] ||= []).push(reviewComment),
  );

  const all = Object.values(byPath).map(reviewComments =>
    reviewComments.sort(
      (leftReviewComment, rightReviewComment) =>
        (leftReviewComment.in_reply_to_id ? 1 : 0) -
          (rightReviewComment.in_reply_to_id ? 1 : 0) ||
        leftReviewComment.id - rightReviewComment.id,
    ),
  );

  const allRes = all.length > 0 && all.every(isRes);
  const nres = all.filter(isRes).length;
  const rk = `r:${timelineEvent.id}`;

  const lists = appState.unres
    ? all.filter(reviewComments => !isRes(reviewComments))
    : all;

  if (appState.unres && !lists.length) {
    return null;
  }

  const threads = lists.map(list => ({
    folded: isFolded(`t:${list[0].id}`, isRes(list)),
    k: `t:${list[0].id}`,
    def: isRes(list),
    path: list[0].path,
    resolved: isRes(list),
    tid: (bundle.thread_ids || {})[list[0].id]
      ? bundle.thread_ids[list[0].id]
      : null,
    hunk: hunkRows(list[0].diff_hunk || ''),
    cards: list.map((reviewComment): TcProps => ({
      user: reviewComment.user,
      login: reviewComment.user.login,
      at: reviewComment.created_at,
      id: reviewComment.id,
      root: list[0].id,
      withMenu: true,
      bodyHtml: reviewComment.body_html || '',
      reactions: reactionProps(
        reviewComment.reactions,
        'review_comment',
        reviewComment.id,
      ),
      sug: suggestProps(reviewComment, bundle, list),
      anchorId: true,
      kb: appState.kbId === `c-${reviewComment.id}`,
      flash: flashFor(`c-${reviewComment.id}`),
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
    user: timelineEvent.user,
    verb,
    url: timelineEvent.html_url ?? '',
    at: whenParts(timelineEvent.submitted_at!).text,
    sum,
    bodyHtml: hasBody ? timelineEvent.body_html! : '',
    threads,
    allRes,
  };
}

void ReviewBlock;
