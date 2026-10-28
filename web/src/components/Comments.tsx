import { flashClass, useFlash } from './flash';
import { useReveal } from './req';
import { Av, renderIcon, SP, When } from './ui';

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

function Who({ p: pull, st }: { p: Pull; st: string }) {
  const plural = pull.commits === 1 ? '' : 's';

  return st === 'merged' ? (
    <>
      <a
        class="author"
        style="text-decoration:underline;text-underline-offset:2px"
        href={pull.merged_by!.html_url}
      >
        {pull.merged_by!.login}
      </a>{' '}
      merged {pull.commits} commit{plural} into
    </>
  ) : (
    <>
      <a class="author" href={pull.user.html_url}>
        {pull.user.login}
      </a>{' '}
      wants to merge {pull.commits} commit{plural} into
    </>
  );
}

export interface PrHeaderHandlers {
  tab: (key: string) => void;
  edit: () => void;
  copy: () => void;
  summary: () => void;
  review: () => void;
  side: () => void;
  split: () => void;
}

export function PrHeader({
  b: bundle,
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
  const pull = bundle.pull;
  const count = pull.number;

  const at =
    st === 'merged'
      ? pull.merged_at
      : st === 'closed'
        ? pull.closed_at
        : pull.created_at;

  const tabs: [string, string, string, number][] = [
    ['conversation', 'comment-discussion', 'Conversation', commentsTotal + 0],
    ['timeline', 'clock', 'Timeline', bundle.timeline.length],
    ['commits', 'git-commit', 'Commits', pull.commits],
    ['checks', 'checklist', 'Checks', (bundle.checks || []).length],
    ['files', 'file-diff', 'Files changed', pull.changed_files],
  ];

  return (
    <>
      <div class="pr-title-area">
        <h1 class="pr-title">
          <span>{pull.title}</span>
          <span class="num">#{count}</span>
          {pull.state === 'open' && !pull.merged ? (
            <button
              class="copy-btn"
              id="editpr"
              onClick={on?.edit}
              title="Edit title and description"
            >
              {renderIcon('pencil')}
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
            {renderIcon('copy')}
          </button>
        </h1>
        {NL}
        <div class="pr-meta">
          <span class={`state-pill state-${st}`}>
            {renderIcon(ic)}
            {SP}
            {label}
          </span>
          <span>
            <Who p={pull} st={st} />
          </span>
          {SP}
          <span
            class="branch"
            title={`${pull.base.repo.full_name}:${pull.base.ref}`}
          >
            {pull.base.label}
          </span>
          {SP}
          <span>from</span>
          {SP}
          <span class="branch">{pull.head.label}</span>
          <button
            class="copy-btn"
            id="copybranch"
            onClick={on?.copy}
            aria-label="Copy head branch name to clipboard"
          >
            {renderIcon('copy')}
          </button>
          <span>{When(at!)}</span>
        </div>
      </div>
      {NL}
      <div class="pr-tabs">
        <span class="mini" title={pull.title}>
          <b>#{count}</b>
          {SP}
          {pull.title}
        </span>
        <nav>
          {tabs.map(([key, text, otherText, otherCount]) => (
            <a
              data-tab={key}
              class={tab === key ? 'sel' : ''}
              onClick={() => on?.tab(key)}
            >
              {renderIcon(text)}
              {otherText}
              <span class="counter">{otherCount}</span>
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
            {renderIcon('eye')}
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
            {renderIcon('sidebar-expand')}
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
            {renderIcon('columns')}
            <span>Split view</span>
          </button>
          <div class="diffstat">
            <span class="add">+{pull.additions}</span>
            <span class="del">-{pull.deletions}</span>
            <span class="sq">
              {sq.map(color => (
                <i class={color}></i>
              ))}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export type FoldFn = (event: Event, key: string, def: boolean) => void;

export function FoldBtn({
  k: key,
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
      ref={useReveal<HTMLButtonElement>(key)}
      class="fold-btn"
      data-fold={key}
      data-def={def ? 1 : 0}
      title={title}
      onClick={onFold && (event => onFold(event, key, def))}
    >
      {renderIcon(folded ? 'chevron-right' : 'chevron-down')}
    </button>
  );
}

export interface ReactionDef {
  k: keyof Reactions;
  e: string;
}

export interface ReactHandlers {
  toggle: (
    event: Event,
    kind: string,
    id: number | string,
    color: string,
  ) => void;
  add: (event: Event, btn: HTMLElement) => void;
  hover: (kind: string, id: number | string) => void;
}

export interface ReactionsProps {
  r: Reactions;
  kind: string;
  id: number;
  defs: ReactionDef[];
}

export function ReactionsBar({
  r: reactions,
  kind,
  id,
  defs,
  on,
}: ReactionsProps & { on?: ReactHandlers }) {
  const live = !!(kind && id);

  const items = defs
    .filter(({ k: otherKind }) => (reactions?.[otherKind] ?? 0) > 0)
    .map(({ k: otherKind, e: text }) =>
      live ? (
        <span
          class="reaction rc-btn"
          data-rck={kind}
          data-rcid={id}
          data-rcc={otherKind}
          title="Click to add or remove your reaction"
          onClick={on && (ev => on.toggle(ev, kind, id, otherKind))}
          onMouseEnter={on && (() => on.hover(kind, id))}
        >
          <span class="e">{text}</span>
          <span>{reactions?.[otherKind]}</span>
        </span>
      ) : (
        <span class="reaction">
          <span class="e">{text}</span>
          <span>{reactions?.[otherKind]}</span>
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
        {renderIcon('smiley')}
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
  menu: (event: Event, btn: HTMLElement) => void;
  react: ReactHandlers;
  thread: (event: Event, node: string, how: string) => void;
  sug: (event: Event, id: string) => void;
  reply: (id: string) => void;
}

export interface CommentBoxProps {
  onTask?: (event: MouseEvent) => void;
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
  c: commentLike,
  assoc,
  bodyHtml,
  folded,
  reactions,
  flush,
  on,
}: CommentBoxProps & { on?: ConvHandlers }) {
  const user = commentLike.user || commentLike.actor;
  const key = `c:${commentLike.id}`;
  const ref = useFlash(flash, kb);

  return (
    <div
      ref={ref}
      class={`tl-comment${folded ? ' folded' : ''}${kb ? ' kb' : ''}${flashClass(flash)}`}
      id={`c-${commentLike.id ?? ''}`}
      style={flush ? 'margin-bottom:0' : undefined}
    >
      <div class="avatar-col">
        <a href={user?.html_url}>{Av(user, 40)}</a>
      </div>
      {NL}
      <div class="cbox">
        <div class="chead">
          <div>
            <FoldBtn
              k={key}
              title="Hide this comment"
              def={false}
              folded={folded}
              onFold={on?.fold}
            />
            {SP}
            <a class="author u" href={user?.html_url}>
              <span
                class="author"
                style="font-weight:600;color:var(--fgColor-default)"
              >
                {user?.login || 'ghost'}
              </span>
            </a>{' '}
            commented{SP}
            <a class="ts" href={commentLike.html_url || '#'}>
              {When((commentLike.created_at || commentLike.submitted_at)!)}
            </a>
          </div>
          {NL}
          <div class="rt">
            {assoc ? <span class="assoc">{assoc}</span> : ''}
            <button
              class="cm-btn"
              data-cm={commentLike.id}
              title="Comment actions"
              onClick={
                on &&
                (event => on.menu(event, event.currentTarget as HTMLElement))
              }
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
      {rows.map(hunkRow => {
        if (hunkRow.kind === 'hunk') {
          return (
            <tr class="hunk">
              <td class="num">…</td>
              <td class="num">…</td>
              <td class="code">{hunkRow.text}</td>
            </tr>
          );
        }

        if (hunkRow.kind === 'add') {
          return (
            <tr class="add">
              <td class="num"></td>
              <td class="num">{hunkRow.n}</td>
              <td class="code" data-marker="+">
                {hunkRow.text}
              </td>
            </tr>
          );
        }

        if (hunkRow.kind === 'del') {
          return (
            <tr class="del">
              <td class="num">{hunkRow.o}</td>
              <td class="num"></td>
              <td class="code" data-marker="-">
                {hunkRow.text}
              </td>
            </tr>
          );
        }

        if (hunkRow.kind === 'meta') {
          return (
            <tr>
              <td class="num"></td>
              <td class="num"></td>
              <td class="code" style="color:var(--fgColor-muted)">
                {hunkRow.text}
              </td>
            </tr>
          );
        }

        return (
          <tr>
            <td class="num">{hunkRow.o}</td>
            <td class="num">{hunkRow.n}</td>
            <td class="code" data-marker=" ">
              {hunkRow.text}
            </td>
          </tr>
        );
      })}
    </table>
  );
}
