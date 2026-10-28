import { flashClass, useFlash } from './flash';
import { useReveal } from './req';
import { Av, I, SP, When } from './ui';

import type { Bundle, CommentLike, Pull, Reactions } from '../types';
import type { FlashProps } from './flash';

const NL = '\n  ';

export interface PrHeaderProps {
  b: Bundle;
  st: string;
  ic: string;
  label: string;
  tab: string;
  split: boolean;
  hideSide: boolean;
  splitOk: boolean;
  commentsTotal: number;
  sq: string[];
}

function Who({ p, st }: { p: Pull; st: string }) {
  const plural = p.commits === 1 ? '' : 's';

  return st === 'merged' ? (
    <>
      <a
        class="author"
        style="text-decoration:underline;text-underline-offset:2px"
        href={p.merged_by!.html_url}
      >
        {p.merged_by!.login}
      </a>{' '}
      merged {p.commits} commit{plural} into
    </>
  ) : (
    <>
      <a class="author" href={p.user.html_url}>
        {p.user.login}
      </a>{' '}
      wants to merge {p.commits} commit{plural} into
    </>
  );
}

export interface PrHeaderHandlers {
  tab: (k: string) => void;
  edit: () => void;
  copy: () => void;
  summary: () => void;
  review: () => void;
  side: () => void;
  split: () => void;
}

export function PrHeader({
  b,
  st,
  ic,
  label,
  tab,
  split,
  hideSide,
  splitOk,
  commentsTotal,
  sq,
  on,
}: PrHeaderProps & { on?: PrHeaderHandlers }) {
  const p = b.pull;
  const n = p.number;

  const at =
    st === 'merged'
      ? p.merged_at
      : st === 'closed'
        ? p.closed_at
        : p.created_at;

  const tabs: [string, string, string, number][] = [
    ['conversation', 'comment-discussion', 'Conversation', commentsTotal + 0],
    ['timeline', 'clock', 'Timeline', b.timeline.length],
    ['commits', 'git-commit', 'Commits', p.commits],
    ['checks', 'checklist', 'Checks', (b.checks || []).length],
    ['files', 'file-diff', 'Files changed', p.changed_files],
  ];

  return (
    <>
      <div class="pr-title-area">
        <h1 class="pr-title">
          <span>{p.title}</span>
          <span class="num">#{n}</span>
          {p.state === 'open' && !p.merged ? (
            <button
              class="copy-btn"
              id="editpr"
              onClick={on?.edit}
              title="Edit title and description"
            >
              {I('pencil')}
            </button>
          ) : (
            ''
          )}
          <button
            class="copy-btn"
            id="prsummary"
            onClick={on?.summary}
            title="Copy a short summary (title, status, size, reviewers, link)"
          >
            {I('copy')}
          </button>
        </h1>
        {NL}
        <div class="pr-meta">
          <span class={`state-pill state-${st}`}>
            {I(ic)}
            {SP}
            {label}
          </span>
          <span>
            <Who p={p} st={st} />
          </span>
          {SP}
          <span class="branch" title={`${p.base.repo.full_name}:${p.base.ref}`}>
            {p.base.label}
          </span>
          {SP}
          <span>from</span>
          {SP}
          <span class="branch">{p.head.label}</span>
          <button
            class="copy-btn"
            id="copybranch"
            onClick={on?.copy}
            aria-label="Copy head branch name to clipboard"
          >
            {I('copy')}
          </button>
          <span>{When(at!)}</span>
        </div>
      </div>
      {NL}
      <div class="pr-tabs">
        <span class="mini" title={p.title}>
          <b>#{n}</b>
          {SP}
          {p.title}
        </span>
        <nav>
          {tabs.map(([k, i, t, c]) => (
            <a
              data-tab={k}
              class={tab === k ? 'sel' : ''}
              onClick={() => on?.tab(k)}
            >
              {I(i)}
              {t}
              <span class="counter">{c}</span>
            </a>
          ))}
        </nav>
        {NL}
        <div class="tools">
          <button
            class="split-btn"
            id="review"
            onClick={on?.review}
            title="Submit a review"
          >
            {I('eye')}
            <span>Review</span>
          </button>
          <button
            class={`split-btn ${hideSide || split ? '' : 'on'}`}
            id="sidetoggle"
            onClick={on?.side}
            title="Show or hide the details panel"
            disabled={tab !== 'conversation' || split}
            style={tab !== 'conversation' ? 'visibility:hidden' : ''}
          >
            {I('sidebar-expand')}
            <span>Details</span>
          </button>
          <button
            class={`split-btn ${splitOk && split ? 'on' : ''}`}
            id="split"
            onClick={on?.split}
            title={
              splitOk
                ? 'Split view: commits beside conversation'
                : 'Split view is available on the Conversation and Commits tabs'
            }
            disabled={!splitOk}
          >
            {I('columns')}
            <span>Split view</span>
          </button>
          <div class="diffstat">
            <span class="add">+{p.additions}</span>
            <span class="del">-{p.deletions}</span>
            <span class="sq">
              {sq.map(c => (
                <i class={c}></i>
              ))}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export type FoldFn = (e: Event, k: string, def: boolean) => void;

export function FoldBtn({
  k,
  title,
  def,
  folded,
  onFold,
}: {
  k: string;
  title: string;
  def: boolean;
  folded: boolean;
  onFold?: FoldFn;
}) {
  return (
    <button
      ref={useReveal<HTMLButtonElement>(k)}
      class="fold-btn"
      data-fold={k}
      data-def={def ? 1 : 0}
      title={title}
      onClick={onFold && (e => onFold(e, k, def))}
    >
      {I(folded ? 'chevron-right' : 'chevron-down')}
    </button>
  );
}

export interface ReactionDef {
  k: keyof Reactions;
  e: string;
}

export interface ReactHandlers {
  toggle: (e: Event, kind: string, id: number | string, c: string) => void;
  add: (e: Event, btn: HTMLElement) => void;
  hover: (kind: string, id: number | string) => void;
}

export interface ReactionsProps {
  r: Reactions;
  kind: string;
  id: number;
  defs: ReactionDef[];
}

export function ReactionsBar({
  r,
  kind,
  id,
  defs,
  on,
}: ReactionsProps & { on?: ReactHandlers }) {
  const live = !!(kind && id);

  const items = defs
    .filter(({ k }) => (r?.[k] ?? 0) > 0)
    .map(({ k, e }) =>
      live ? (
        <span
          class="reaction rc-btn"
          data-rck={kind}
          data-rcid={id}
          data-rcc={k}
          title="Click to add or remove your reaction"
          onClick={on && (ev => on.toggle(ev, kind, id, k))}
          onMouseEnter={on && (() => on.hover(kind, id))}
        >
          <span class="e">{e}</span>
          <span>{r?.[k]}</span>
        </span>
      ) : (
        <span class="reaction">
          <span class="e">{e}</span>
          <span>{r?.[k]}</span>
        </span>
      ),
    );

  const add = live ? (
    <span class="react-wrap">
      <button
        class="react-add"
        data-rk={kind}
        data-rid={id}
        title="Add reaction"
        onClick={on && (ev => on.add(ev, ev.currentTarget as HTMLElement))}
        onMouseEnter={on && (() => on.hover(kind, id))}
      >
        {I('smiley')}
      </button>
    </span>
  ) : null;

  return items.length || add ? (
    <div class="reactions">
      {items}
      {add}
    </div>
  ) : null;
}

export interface ConvHandlers {
  fold: FoldFn;
  menu: (e: Event, btn: HTMLElement) => void;
  react: ReactHandlers;
  thread: (e: Event, node: string, how: string) => void;
  sug: (e: Event, id: string) => void;
  reply: (id: string) => void;
}

export interface CommentBoxProps {
  onTask?: (e: MouseEvent) => void;
  kb?: boolean;
  flash?: FlashProps;
  c: CommentLike;
  assoc: string | undefined;
  bodyHtml: string;
  folded: boolean;
  reactions: ReactionsProps;
  flush?: boolean;
}

export function CommentBox({
  onTask,
  kb,
  flash,
  c,
  assoc,
  bodyHtml,
  folded,
  reactions,
  flush,
  on,
}: CommentBoxProps & { on?: ConvHandlers }) {
  const u = c.user || c.actor;
  const k = `c:${c.id}`;
  const ref = useFlash(flash, kb);

  return (
    <div
      ref={ref}
      class={`tl-comment${folded ? ' folded' : ''}${kb ? ' kb' : ''}${flashClass(flash)}`}
      id={`c-${c.id ?? ''}`}
      style={flush ? 'margin-bottom:0' : undefined}
    >
      <div class="avatar-col">
        <a href={u?.html_url}>{Av(u, 40)}</a>
      </div>
      {NL}
      <div class="cbox">
        <div class="chead">
          <div>
            <FoldBtn
              k={k}
              title="Hide this comment"
              def={false}
              folded={folded}
              onFold={on?.fold}
            />
            {SP}
            <a class="author u" href={u?.html_url}>
              <span
                class="author"
                style="font-weight:600;color:var(--fgColor-default)"
              >
                {u?.login || 'ghost'}
              </span>
            </a>{' '}
            commented{SP}
            <a class="ts" href={c.html_url || '#'}>
              {When((c.created_at || c.submitted_at)!)}
            </a>
          </div>
          {NL}
          <div class="rt">
            {assoc ? <span class="assoc">{assoc}</span> : ''}
            <button
              class="cm-btn"
              data-cm={c.id}
              title="Comment actions"
              onClick={on && (e => on.menu(e, e.currentTarget as HTMLElement))}
            >
              ⋯
            </button>
          </div>
        </div>
        {NL}
        <div class="cbody">
          {bodyHtml ? (
            <div
              class="markdown-body"
              onClick={onTask}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <span class="empty">No description provided.</span>
          )}
        </div>
        <ReactionsBar {...reactions} on={on?.react} />
      </div>
    </div>
  );
}

export interface HunkRow {
  kind: 'hunk' | 'add' | 'del' | 'ctx' | 'meta';
  o?: number;
  n?: number;
  text: string;
}

export function DiffHunkTable({ rows }: { rows: HunkRow[] }) {
  return (
    <table class="diff">
      <colgroup>
        <col style="width:50px" />
        <col style="width:50px" />
        <col />
      </colgroup>
      {rows.map(r => {
        if (r.kind === 'hunk') {
          return (
            <tr class="hunk">
              <td class="num">…</td>
              <td class="num">…</td>
              <td class="code">{r.text}</td>
            </tr>
          );
        }

        if (r.kind === 'add') {
          return (
            <tr class="add">
              <td class="num"></td>
              <td class="num">{r.n}</td>
              <td class="code" data-marker="+">
                {r.text}
              </td>
            </tr>
          );
        }

        if (r.kind === 'del') {
          return (
            <tr class="del">
              <td class="num">{r.o}</td>
              <td class="num"></td>
              <td class="code" data-marker="-">
                {r.text}
              </td>
            </tr>
          );
        }

        if (r.kind === 'meta') {
          return (
            <tr>
              <td class="num"></td>
              <td class="num"></td>
              <td class="code" style="color:var(--fgColor-muted)">
                {r.text}
              </td>
            </tr>
          );
        }

        return (
          <tr>
            <td class="num">{r.o}</td>
            <td class="num">{r.n}</td>
            <td class="code" data-marker=" ">
              {r.text}
            </td>
          </tr>
        );
      })}
    </table>
  );
}
