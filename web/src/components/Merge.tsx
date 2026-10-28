import { arrange, roCls } from '../app/reorder';
import { ErrLine } from './Actions';
import { FoldBtn } from './Comments';
import { useReveal, useScroller } from './req';
import { Av, renderIcon, SP } from './ui';

import type { ComponentChildren } from 'preact';
import type { Person } from '../types';
import type { FoldFn } from './Comments';

export function MergedBox({ head }: { head: string }) {
  return (
    <div class="TL">
      <div class="TLI-break" style="margin-left:0"></div>
      <div class="merge-box">
        <div class="badge">
          <span
            class="state-merged"
            style="background:var(--bgColor-done-emphasis)"
          >
            {renderIcon('git-merge')}
          </span>
        </div>
        <div class="merge-card merged-card">
          <div class="row">
            <div>
              <h3>Pull request successfully merged and closed</h3>
              <p style="font-size:14px;margin-top:4px">
                You're all set — the <span class="branch">{head}</span> branch
                can be safely deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClosedBox({ head }: { head: string }) {
  return (
    <div class="merge-box">
      <div class="badge">
        <span
          class="state-closed"
          style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))"
        >
          {renderIcon('git-pull-request-closed')}
        </span>
      </div>
      <div class="merge-card">
        <div class="row">
          <div>
            <h3>Closed with unmerged commits</h3>
            <p style="font-size:14px;margin-top:4px">
              This pull request is closed, but the{' '}
              <span class="branch">{head}</span> branch has unmerged commits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface CkItem {
  st: string;
  url?: string;
  icon: string;
  name: string;
  req: boolean;
  desc: string;
}

export interface CkGroup {
  k: string;
  title: string;
  open: boolean;
  items: CkItem[];
}

export interface MergeBoxHandlers {
  toggle: (event: Event, key: string) => void;
  rerun: (event: Event) => void;
  update: () => void;
  ready: () => void;
}

export interface MergeBoxProps {
  draft: boolean;
  busyReady: boolean;
  errReady: string;
  rv: {
    h: string[];
    open: boolean;
    ap: number;
    cr: number;
    pend: number;
    pendNames: string;
  };
  ck: {
    h: string[];
    open: boolean;
    rerunable: boolean;
    groups: CkGroup[];
  } | null;
  behind: boolean;
  busyUpdate: boolean;
  baseRef: string;
  errUpdate: string;
  clean: boolean;
}

const plural = (count: number) => (count === 1 ? '' : 's');

function Sec({
  k: key,
  h: hashs,
  rerunable,
  open,
  children,
  on,
}: {
  k: string;
  h: string[];
  rerunable?: boolean;
  open: boolean;
  children: ComponentChildren;
  on?: MergeBoxHandlers;
}) {
  return (
    <div class="mb-sec">
      <button
        class={`mb-h ${hashs[0]}`}
        data-mb={key}
        onClick={on && (event => on.toggle(event, key))}
      >
        <span class="mb-ic">{renderIcon(hashs[1], 22)}</span>
        <span class="mb-t">
          <b>{hashs[2]}</b>
          <i>{hashs[3] || ''}</i>
        </span>
        {key === 'ck' && rerunable ? (
          <span
            class="btn small"
            id="rerunck"
            role="button"
            onClick={on?.rerun}
          >
            Re-run failed
          </span>
        ) : (
          ''
        )}
        {renderIcon(open ? 'chevron-up' : 'chevron-down', 16)}
      </button>
      {open && children ? <div class="mb-body">{children}</div> : ''}
    </div>
  );
}

function CkGroupView({
  g: ckGroup,
  on,
}: {
  g: CkGroup;
  on?: MergeBoxHandlers;
}) {
  return (
    <>
      <button
        class="mb-grp"
        data-mb={`g${ckGroup.k}`}
        onClick={on && (event => on.toggle(event, `g${ckGroup.k}`))}
      >
        {ckGroup.title}
        {SP}
        {renderIcon(ckGroup.open ? 'chevron-up' : 'chevron-down', 12)}
      </button>
      {ckGroup.open
        ? ckGroup.items.map(ckItem => (
            <a class={`mb-ck ${ckItem.st}`} href={ckItem.url || undefined}>
              {renderIcon(ckItem.icon, 14)}
              <b>{ckItem.name}</b>
              {ckItem.req ? (
                <span class="ck-req" title="Required by branch protection">
                  Required
                </span>
              ) : (
                ''
              )}
              <i>{ckItem.desc}</i>
            </a>
          ))
        : ''}
    </>
  );
}

export function MergeBox(props: MergeBoxProps & { on?: MergeBoxHandlers }) {
  const { rv, ck, on } = props;

  const rvBody = (
    <>
      <div class="mb-line">
        {renderIcon('check', 14)}
        {SP}
        {rv.ap} approval{plural(rv.ap)}
      </div>
      {rv.cr ? (
        <div class="mb-line bad">
          {renderIcon('x-circle-fill', 14)}
          {SP}
          {rv.cr} requested changes
        </div>
      ) : (
        ''
      )}
      <div class="mb-line">
        {renderIcon('person', 14)}
        {SP}
        {rv.pend} pending review{plural(rv.pend)}
        {rv.pend ? `: ${rv.pendNames}` : ''}
      </div>
    </>
  );

  return (
    <div class="merge-box">
      <div class="badge">
        <span style="background:var(--bgColor-success-emphasis)">
          {renderIcon('git-pull-request')}
        </span>
      </div>
      <div class="merge-card mb-card">
        {props.draft ? (
          <>
            <div class="mb-sec">
              <div class="mb-h">
                <span class="mb-ic">
                  {renderIcon('git-pull-request-draft', 22)}
                </span>
                <span class="mb-t">
                  <b>This pull request is still a work in progress</b>
                  <i>Draft pull requests cannot be merged.</i>
                </span>
                <button class="btn primary" id="doready" onClick={on?.ready}>
                  {props.busyReady ? 'Updating…' : 'Ready for review'}
                </button>
              </div>
            </div>
            <ErrLine m={props.errReady} />
          </>
        ) : (
          ''
        )}
        <Sec k="rv" h={rv.h} open={rv.open} on={on}>
          {rvBody}
        </Sec>
        {ck ? (
          <Sec k="ck" h={ck.h} rerunable={ck.rerunable} open={ck.open} on={on}>
            {ck.groups.map(ckGroup => (
              <CkGroupView g={ckGroup} on={on} />
            ))}
          </Sec>
        ) : (
          ''
        )}
        {props.behind ? (
          <div class="mb-sec mb-warn">
            <div class="mb-h">
              <span class="mb-ic">{renderIcon('alert', 22)}</span>
              <span class="mb-t">
                <b>This branch is out-of-date with the base branch</b>
                <i>
                  Merge the latest changes from {props.baseRef} into this
                  branch.
                </i>
              </span>
              <button class="btn" id="updbranch" onClick={on?.update}>
                {props.busyUpdate ? 'Updating…' : 'Update branch'}
              </button>
            </div>
          </div>
        ) : (
          ''
        )}
        <div class="mb-sec">
          <div class={`mb-h ${props.clean ? 'ok' : 'bad'}`}>
            <span class="mb-ic">
              {renderIcon(props.clean ? 'check-circle-fill' : 'alert', 22)}
            </span>
            <span class="mb-t">
              <b>
                {props.clean
                  ? 'This branch has no conflicts with the base branch'
                  : 'This branch has conflicts that must be resolved'}
              </b>
              <i>
                {props.clean
                  ? 'Merging can be performed automatically.'
                  : 'Use the web editor or the command line to resolve conflicts.'}
              </i>
            </span>
          </div>
        </div>
        <ErrLine m={props.errUpdate} />
      </div>
    </div>
  );
}

export interface RvRow {
  u: Person;
  st: string;
  prev?: string;
  canRe: boolean;
}

export type SideKey =
  'reviewers' | 'assignees' | 'labels' | 'milestone' | 'people';

export interface PrSideHandlers {
  fold: (key: string, def: boolean) => void;
  rvtoggle: () => void;
  rerequest: (event: MouseEvent, login: string) => void;
  grip: (event: MouseEvent, key: SideKey) => void;
  edit: (sideKey: SideKey) => void;
}

export interface PrSideProps {
  reviewers: RvRow[];
  showAll: boolean;
  assignees: Person[];
  labels: { name: string; color: string }[];
  milestone: { title: string; html_url?: string } | null;
  people: Person[];
  peopleCount: number;
  folded: Record<SideKey, boolean>;
}

const VISIBLE_REVIEWERS = 5;

function ReviewerRow({ r: rvRow, on }: { r: RvRow; on: PrSideHandlers }) {
  const ic =
    rvRow.st === 'req' && rvRow.prev ? (
      <>
        <span title="Asked to review again" style="margin-right:6px">
          {renderIcon('sync')}
        </span>
        {renderIcon(
          rvRow.prev === 'approved'
            ? 'check'
            : rvRow.prev === 'changes_requested'
              ? 'file-diff'
              : 'comment',
        )}
      </>
    ) : (
      renderIcon(
        rvRow.st === 'approved'
          ? 'check'
          : rvRow.st === 'changes_requested'
            ? 'file-diff'
            : rvRow.st === 'req'
              ? 'dot-fill'
              : 'comment',
      )
    );

  const verdict = rvRow.st === 'req' ? rvRow.prev : rvRow.st;

  const verdictClass =
    verdict === 'approved'
      ? 'ok'
      : verdict === 'changes_requested'
        ? 'bad'
        : verdict
          ? ''
          : 'wait';

  return (
    <div class="reviewer">
      <a href={rvRow.u.html_url}>{Av(rvRow.u, 20)}</a>
      <a class="nm" href={rvRow.u.html_url}>
        {rvRow.u.login}
      </a>
      <span class={`st ${verdictClass}`}>{ic}</span>
      {rvRow.canRe ? (
        <button
          class="rerequest"
          data-rerequest={rvRow.u.login}
          title={`Ask ${rvRow.u.login} to review again`}
          onClick={event => on.rerequest(event, rvRow.u.login ?? '')}
        >
          {renderIcon('sync')}
        </button>
      ) : (
        ''
      )}
    </div>
  );
}

export function PrSide(props: PrSideProps & { on: PrSideHandlers }) {
  const { on } = props;
  const rv = props.reviewers;
  const more = rv.length - VISIBLE_REVIEWERS;

  const rvSection = rv.length ? (
    <>
      {rv.slice(0, VISIBLE_REVIEWERS).map(rvRow => (
        <ReviewerRow r={rvRow} on={on} />
      ))}
      {more > 0 ? (
        <>
          <button class="sb-toggle" id="rvtoggle" onClick={on.rvtoggle}>
            <span>
              +{more} more reviewer{plural(more)}
            </span>
            {renderIcon(props.showAll ? 'chevron-up' : 'chevron-down')}
          </button>
          {props.showAll
            ? rv
                .slice(VISIBLE_REVIEWERS)
                .map(rvRow => <ReviewerRow r={rvRow} on={on} />)
            : ''}
        </>
      ) : (
        ''
      )}
    </>
  ) : (
    <div class="sb-none">No reviews</div>
  );

  const fb = (sideKey: SideKey, name: string) => (
    <SideFold
      k={`sb:${name}`}
      folded={props.folded[sideKey]}
      onFold={on.fold}
    />
  );

  const head = (sideKey: SideKey, text: string) => (
    <div class="sb-head">
      {fb(sideKey, text === 'people' ? 'people' : text)}
      <span>{text}</span>
      <button
        class="gear-btn"
        title={`Edit ${text.toLowerCase()}`}
        onClick={() => on.edit(sideKey)}
      >
        {renderIcon('gear', 16, 'gear')}
      </button>
    </div>
  );

  const box = (sideKey: SideKey) =>
    `sb-item${props.folded[sideKey] ? ' folded' : ''}`;

  const item = (sideKey: SideKey, node: ComponentChildren) => (
    <div
      class={`${box(sideKey)} ro-it${roCls('side', sideKey)}`}
      data-t={sideKey}
    >
      {node}
      <i
        class="ro-grip"
        title="Drag to reorder"
        onMouseDown={event => on.grip(event, sideKey)}
      >
        ⋮⋮
      </i>
    </div>
  );

  const secs: Record<SideKey, ComponentChildren> = {
    reviewers: (
      <>
        <div class="sb-head">
          {fb('reviewers', 'Reviewers')}
          <span>Reviewers</span>
        </div>
        {rvSection}
      </>
    ),
    assignees: (
      <>
        {head('assignees', 'Assignees')}
        {props.assignees.length ? (
          props.assignees.map(person => (
            <div class="reviewer">
              <a href={person.html_url}>{Av(person, 20)}</a>
              <a class="nm" href={person.html_url}>
                {person.login}
              </a>
            </div>
          ))
        ) : (
          <span class="sb-none">No one—</span>
        )}
      </>
    ),
    labels: (
      <>
        {head('labels', 'Labels')}
        {props.labels.length ? (
          props.labels.map(otherItem => (
            <span
              class="pill-label"
              style={`background:#${otherItem.color}33;color:#${otherItem.color};border-color:#${otherItem.color}`}
            >
              {otherItem.name}
            </span>
          ))
        ) : (
          <span class="sb-none">None yet</span>
        )}
      </>
    ),
    milestone: (
      <>
        {head('milestone', 'Milestone')}
        {props.milestone ? (
          <a class="sb-link" href={props.milestone.html_url}>
            {props.milestone.title}
          </a>
        ) : (
          <span class="sb-none">No milestone</span>
        )}
      </>
    ),
    people: (
      <>
        <div class="sb-head">
          {fb('people', 'people')}
          <span>
            {props.peopleCount} participant{plural(props.peopleCount)}
          </span>
        </div>
        <div class="participants">
          {props.people.map(person => (
            <a href={person.html_url} title={person.login}>
              {Av(person, 32)}
            </a>
          ))}
        </div>
      </>
    ),
  };

  return (
    <div class="pr-side-inner">
      {arrange(SIDE_KEYS, 'side', sideKey => sideKey).map(sideKey =>
        item(sideKey, secs[sideKey]),
      )}
    </div>
  );
}

export const SIDE_KEYS: SideKey[] = [
  'reviewers',
  'assignees',
  'labels',
  'milestone',
  'people',
];

function SideFold({
  k: key,
  folded,
  onFold,
}: {
  k: string;
  folded: boolean;
  onFold: (otherKey: string, def: boolean) => void;
}) {
  return (
    <button
      ref={useReveal<HTMLButtonElement>(key)}
      class="fold-btn"
      data-fold={key}
      data-def="0"
      title="Hide section"
      onClick={event => {
        event.stopPropagation();
        onFold(key, false);
      }}
    >
      {renderIcon(folded ? 'chevron-right' : 'chevron-down')}
    </button>
  );
}

export interface CpRow {
  i: number;
  on: boolean;
  title: string;
  by: string;
  when: string;
  sha: string;
  hidden: boolean;
}

export interface CommitsDialogProps {
  rows: CpRow[];
  count: number;
  allOn: boolean;
  since: { on: boolean; n: number } | null;
  filter: string;
  selLabel: string;
  hasPick: boolean;
}

export interface CpHandlers {
  close: () => void;
  all: () => void;
  since: () => void;
  save: () => void;
  filter: (event: Event) => void;
  pick: (event: Event, index: number) => void;
}

export function CommitsDialog(props: CommitsDialogProps & { on?: CpHandlers }) {
  const { on } = props;

  return (
    <div
      class="dlg-bg"
      id="dlgbg"
      onMouseDown={
        on &&
        (event => {
          if ((event.target as HTMLElement).id === 'dlgbg') {
            on.close();
          }
        })
      }
    >
      <div class="dlg cp-dlg">
        <div class="cp-h">
          <h2>Select commits to view</h2>
          <button class="icon-btn" id="cpx" title="Close" onClick={on?.close}>
            {renderIcon('x')}
          </button>
        </div>
        <button
          class={`cp-opt${props.allOn ? ' on' : ''}`}
          id="cpall"
          onClick={on?.all}
        >
          <b>All commits</b>
          <i>
            {props.count} commit{plural(props.count)}
          </i>
        </button>
        {props.since ? (
          <button
            class={`cp-opt${props.since.on ? ' on' : ''}`}
            id="cpsince"
            disabled={!props.since.n}
            onClick={on?.since}
          >
            <b>Changes since your last review</b>
            <i>
              {props.since.n
                ? `${props.since.n} commit${plural(props.since.n)}`
                : 'No new commits'}
            </i>
          </button>
        ) : (
          ''
        )}
        <div class="cp-sub">
          Select a commit, or click a second one to view the range between them
        </div>
        <input
          class="input cp-q"
          id="cpq"
          placeholder="Filter commits…"
          value={props.filter}
          onInput={on?.filter}
        />
        <div class="cp-list" id="cplist" data-q={props.filter.toLowerCase()}>
          {props.rows
            .map(cpRow => (
              <label
                class={`cp-row${cpRow.on ? ' on' : ''}`}
                data-cp={cpRow.i}
                hidden={cpRow.hidden}
                onClick={on && (event => on.pick(event, cpRow.i))}
              >
                <input type="checkbox" checked={cpRow.on} tabindex={-1} />
                <span class="cp-t">
                  <b>{cpRow.title}</b>
                  <i>
                    {cpRow.by} committed {cpRow.when}
                  </i>
                </span>
                <code>{cpRow.sha}</code>
              </label>
            ))
            .reverse()}
        </div>
        <div class="btns">
          <span class="cp-sel">{props.selLabel}</span>
          <span class="sp"></span>
          <button class="btn" id="cpcancel" onClick={on?.close}>
            Cancel
          </button>
          <button
            class="btn primary"
            id="cpsave"
            disabled={!props.hasPick}
            onClick={on?.save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export interface FilesHandlers {
  commits: () => void;
  all: () => void;
  step: (count: number) => void;
  mode: (message: string) => void;
  sort: (event: Event) => void;
  finish: () => void;
  foldAll: (open: boolean, names: string[]) => void;
  fold: (event: Event, key: string, def: boolean) => void;
}

export interface FcBarProps {
  label: string;
  count: number | null;
  code: string | null;
  nav: { prevOff: boolean; nextOff: boolean } | null;
  title: string | null;
  hasRange: boolean;
}

export function FcBar(props: FcBarProps & { on?: FilesHandlers }) {
  const { on } = props;

  return (
    <div class="fc-bar">
      <button
        class="btn small"
        id="fcbtn"
        title="Choose which commits to view"
        onClick={on?.commits}
      >
        {renderIcon('git-commit')}
        {SP}
        {props.label}
        {props.count !== null ? (
          <>
            {SP}
            <span class="counter">{props.count}</span>
          </>
        ) : (
          ''
        )}
        {props.code ? (
          <>
            {SP}
            <code>{props.code}</code>
          </>
        ) : (
          ''
        )}
        {SP}▾
      </button>
      {props.nav ? (
        <div class="seg-ctl">
          <button
            data-fstep="-1"
            disabled={props.nav.prevOff}
            onClick={on && (() => on.step(-1))}
          >
            ‹ Prev
          </button>
          <button
            data-fstep="1"
            disabled={props.nav.nextOff}
            onClick={on && (() => on.step(1))}
          >
            Next ›
          </button>
        </div>
      ) : (
        ''
      )}
      {props.hasRange ? (
        <>
          <span class="fc-t">{props.title}</span>
          <button class="link-btn" id="fcall" onClick={on?.all}>
            Show all commits
          </button>
        </>
      ) : (
        ''
      )}
    </div>
  );
}

export interface FilesBarProps {
  mode: string;
  sort: string;
  pending: number;
  allFolded: boolean;
  names: string[];
  viewed?: number;
  total?: number;
  onViewedAll?: () => void;
}

const SORTS: [string, string][] = [
  ['path', 'GitHub order'],
  ['pathz', 'Path Z–A'],
  ['most', 'Most changed'],
  ['least', 'Least changed'],
  ['comments', 'Most comments'],
  ['status', 'By status'],
];

export function FilesBar(props: FilesBarProps & { on?: FilesHandlers }) {
  const { on } = props;

  return (
    <div class="files-bar">
      <div class="seg-ctl">
        <button
          class={props.mode === 'unified' ? 'on' : ''}
          data-dmode="unified"
          onClick={on && (() => on.mode('unified'))}
        >
          Unified
        </button>
        <button
          class={props.mode === 'split' ? 'on' : ''}
          data-dmode="split"
          onClick={on && (() => on.mode('split'))}
        >
          Split
        </button>
      </div>
      <select
        class="input fsort"
        id="fsort"
        title="Sort files"
        onChange={on?.sort}
      >
        {SORTS.map(([otherValue, text]) => (
          <option value={otherValue} selected={props.sort === otherValue}>
            {text}
          </option>
        ))}
      </select>
      {props.total ? (
        <button
          class="link-btn fv-prog"
          title={
            props.viewed === props.total
              ? 'Clear all viewed marks'
              : 'Mark every file as viewed'
          }
          onClick={props.onViewedAll}
        >
          {props.viewed}/{props.total} viewed
        </button>
      ) : (
        ''
      )}
      {props.pending ? (
        <button class="btn small primary" id="finishrev" onClick={on?.finish}>
          Finish review · {props.pending} comment{plural(props.pending)}
        </button>
      ) : (
        ''
      )}
      <button
        class="link-btn"
        data-foldall={props.allFolded ? 'open' : 'close'}
        data-files={props.names.join('\n')}
        onClick={on && (() => on.foldAll(props.allFolded, props.names))}
      >
        {props.allFolded ? 'Expand all files' : 'Collapse all files'}
      </button>
    </div>
  );
}

export interface FileHeadProps {
  name: string;
  folded: boolean;
  closed: boolean;
  add: number;
  del: number;
  sq: string[];
  viewed?: boolean;
  onViewed?: () => void;
  children?: ComponentChildren;
}

export function FileBox(props: FileHeadProps & { on?: FilesHandlers }) {
  const { on } = props;
  const rv = useReveal<HTMLDivElement>(`f:${props.name}`);

  return (
    <div class={`file${props.folded ? ' folded' : ''}`}>
      <div
        ref={rv}
        class="file-head"
        data-fold={`f:${props.name}`}
        onClick={on && (event => on.fold(event, `f:${props.name}`, false))}
      >
        <span class="tgl">
          {renderIcon(props.closed ? 'chevron-right' : 'chevron-down')}
        </span>
        <span class="stat">
          <span class="a">+{props.add}</span>
          {SP}
          <span class="d">−{props.del}</span>
        </span>
        <span class="sq">
          {props.sq.map(color => (
            <i class={color}></i>
          ))}
        </span>
        <span class="path">{props.name}</span>
        {props.onViewed ? (
          <label
            class={`fv${props.viewed ? ' on' : ''}`}
            title="Mark this file as viewed"
            onClick={event => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!props.viewed}
              onChange={props.onViewed}
            />{' '}
            Viewed
          </label>
        ) : (
          ''
        )}
      </div>
      {props.children}
    </div>
  );
}

export function CommitsList({ rows }: { rows: ComponentChildren[] }) {
  return (
    <div style="border:1px solid var(--borderColor-default);border-radius:6px">
      {rows.length ? (
        rows.map(value => (
          <div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">
            {value}
          </div>
        ))
      ) : (
        <div class="diff-empty">No commits listed.</div>
      )}
    </div>
  );
}

export interface CmRow {
  sha: string;
  on: boolean;
  author: Person | null | undefined;
  initial: string;
  title: string;
  sub: string;
  n: number;
}

export interface SplitHandlers {
  hide: (key: string, flag: boolean) => void;
  flip: () => void;
  pick: (sha: string) => void;
  gutter: (event: MouseEvent) => void;
  fold: FoldFn;
  scroll: (id: string, event: Event) => void;
}

function CmItem({ c: cmRow, on }: { c: CmRow; on?: SplitHandlers }) {
  return (
    <div
      class={`cm ${cmRow.on ? 'on' : ''}`}
      data-sha={cmRow.sha}
      onClick={on && (() => on.pick(cmRow.sha))}
    >
      <span class="cm-av">
        {cmRow.author ? Av(cmRow.author, 24) : <i>{cmRow.initial}</i>}
      </span>
      <span class="cm-t">
        <b>{cmRow.title}</b>
        <i>{cmRow.sub}</i>
      </span>
      {cmRow.n ? (
        <span class="cm-n">
          {renderIcon('comment')}
          {cmRow.n}
        </span>
      ) : (
        ''
      )}
      <code>{cmRow.sha.slice(0, 7)}</code>
    </div>
  );
}

export interface SplitProps {
  hl: boolean;
  hr: boolean;
  flip: boolean;
  lw: number;
  allOn: boolean;
  allSub: string;
  rows: CmRow[];
  count: number;
  subTitle: string;
  foldList: boolean;
  foldDiff: boolean;
  diff: ComponentChildren;
  right: ComponentChildren;
}

function Rail({
  k: key,
  label,
  ic,
  on,
}: {
  k: string;
  label: string;
  ic: string;
  on?: SplitHandlers;
}) {
  return (
    <button
      class="pane-rail"
      data-show={key}
      title={`Show ${label}`}
      onClick={on && (() => on.hide(key, false))}
    >
      {renderIcon(ic)}
      <span>{label}</span>
    </button>
  );
}

export function SplitView(props: SplitProps & { on?: SplitHandlers }) {
  const { on } = props;
  const pl = useScroller('l');
  const pr = useScroller('r');

  const left = props.hl ? (
    <Rail k="l" label="Commits" ic="git-commit" on={on} />
  ) : (
    <section class="pane pane-l">
      <div class={`fold-sec${props.foldList ? ' folded' : ''}`}>
        <div class="pane-h">
          {renderIcon('git-commit')}
          <span>Commits</span>
          <span class="counter">{props.count}</span>
          <span class="sp"></span>
          <button
            class="fold-btn flip-btn"
            data-flip=""
            title="Swap sides (F)"
            onClick={on?.flip}
          >
            ⇄
          </button>
          <FoldBtn
            k="cm-list"
            title="Collapse commit list"
            def={false}
            folded={props.foldList}
            onFold={on?.fold}
          />
          <button
            class="fold-btn"
            data-hide="l"
            title="Hide this panel"
            onClick={on && (() => on.hide('l', true))}
          >
            {renderIcon('x')}
          </button>
        </div>
        <div class="cm-list">
          <div
            class={`cm all ${props.allOn ? 'on' : ''}`}
            data-sha=""
            onClick={on && (() => on.pick(''))}
          >
            <span class="cm-av">
              <i>{renderIcon('diff')}</i>
            </span>
            <span class="cm-t">
              <b>All changes</b>
              <i>{props.allSub}</i>
            </span>
          </div>
          {props.rows.map(cmRow => (
            <CmItem c={cmRow} on={on} />
          ))}
        </div>
      </div>
      <div class={`fold-sec${props.foldDiff ? ' folded' : ''}`}>
        <div class="pane-h sub">
          {renderIcon('file-diff')}
          <span>{props.subTitle}</span>
          <span class="sp"></span>
          <FoldBtn
            k="cm-diff"
            title="Collapse changes"
            def={false}
            folded={props.foldDiff}
            onFold={on?.fold}
          />
        </div>
        <div
          class="pane-body"
          ref={pl}
          onScroll={on && (event => on.scroll('l', event))}
        >
          {props.diff}
        </div>
      </div>
    </section>
  );

  const right = props.hr ? (
    <Rail k="r" label="Conversation" ic="comment-discussion" on={on} />
  ) : (
    <section class="pane pane-r">
      <div class="pane-h">
        {renderIcon('comment-discussion')}
        <span>Conversation</span>
        <span class="sp"></span>
        <button
          class="fold-btn flip-btn"
          data-flip=""
          title="Swap sides (F)"
          onClick={on?.flip}
        >
          ⇄
        </button>
        <button
          class="fold-btn"
          data-hide="r"
          title="Hide this panel"
          onClick={on && (() => on.hide('r', true))}
        >
          {renderIcon('x')}
        </button>
      </div>
      <div
        class="pane-body"
        ref={pr}
        onScroll={on && (event => on.scroll('r', event))}
      >
        {props.right}
      </div>
    </section>
  );

  return (
    <div
      class={`split ${props.hl ? 'hl' : ''} ${props.hr ? 'hr' : ''} ${props.flip ? 'flip' : ''}`}
    >
      {left}
      {props.hl || props.hr ? (
        ''
      ) : (
        <div
          class="gutter"
          id="gutter"
          title="Drag to resize"
          onMouseDown={on?.gutter}
        ></div>
      )}
      {right}
    </div>
  );
}
