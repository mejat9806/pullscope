import { roCls } from '../app/reorder';
import { Icon } from './ui';

import type { ComponentChildren } from 'preact';
import type { RecentEntry, RepoSummary } from '../types';

export interface RcRow {
  ref: string;
  on: boolean;
  st: string;
  icon: string;
  title: string;
  sub: string;
}

export interface SideHandlers {
  side: (tab: string) => void;
  sps: (state: string) => void;
  pf: (event: Event) => void;
  psort: (event: Event) => void;
  pgroup: (event: Event) => void;
  repoFilter: (event: Event) => void;
  repo: (name: string) => void;
  addToken: () => void;
  pickRepos: () => void;
  grip: (event: MouseEvent, name: string) => void;
  open: (el: HTMLElement, event: MouseEvent) => void;
  aux: (el: HTMLElement, event: MouseEvent) => void;
  ctx: (el: HTMLElement, event: MouseEvent) => void;
  rm: (event: MouseEvent, ref: string) => void;
  fold: (event: MouseEvent, key: string) => void;
}

const cap = (text: string) => text[0].toUpperCase() + text.slice(1);

export function SideTabs({
  active,
  hasRepo,
  on,
}: {
  active: string;
  hasRepo: boolean;
  on: SideHandlers;
}) {
  const cls = (text: string) => (active === text ? 'on' : '');

  return (
    <div class="sb-tabs">
      <button
        title="Show the repositories"
        data-side="repos"
        class={cls('repos')}
        onClick={() => on.side('repos')}
      >
        Repos
      </button>
      {hasRepo && (
        <button
          title="Show this repository's pull requests"
          data-side="prs"
          class={cls('prs')}
          onClick={() => on.side('prs')}
        >
          PRs
        </button>
      )}
      <button
        title="Show pull requests you opened recently"
        data-side="recent"
        class={cls('recent')}
        onClick={() => on.side('recent')}
      >
        Recent
      </button>
    </div>
  );
}

export function RcItem({ r: rcRow, on }: { r: RcRow; on: SideHandlers }) {
  return (
    <a
      class={`rc ${rcRow.on ? 'on' : ''}`}
      data-open={rcRow.ref}
      onClick={event => on.open(event.currentTarget, event)}
      onAuxClick={event => on.aux(event.currentTarget, event)}
      onContextMenu={event => on.ctx(event.currentTarget, event)}
    >
      <span class={`rc-i ${rcRow.st}`}>
        <Icon n={rcRow.icon} />
      </span>
      <span class="rc-t">
        <b>{rcRow.title}</b>
        <i>{rcRow.sub}</i>
      </span>
    </a>
  );
}

export function RecentList({
  recent,
  curRef,
  on,
}: {
  recent: RecentEntry[];
  curRef: string;
  on: SideHandlers;
}) {
  if (!recent.length) {
    return <div class="sb-empty">Pull requests you open appear here.</div>;
  }

  return (
    <>
      {recent.map(recentEntry => (
        <a
          class={`rc ${recentEntry.ref === curRef ? 'on' : ''}`}
          data-open={recentEntry.ref}
          onClick={event => on.open(event.currentTarget, event)}
          onAuxClick={event => on.aux(event.currentTarget, event)}
          onContextMenu={event => on.ctx(event.currentTarget, event)}
        >
          <span class={`rc-i ${recentEntry.state}`}>
            <Icon n={recentEntry.icon} />
          </span>
          <span class="rc-t">
            <b>{recentEntry.title}</b>
            <i>{recentEntry.ref}</i>
          </span>
          <button
            class="rc-x"
            data-rm={recentEntry.ref}
            onClick={event => on.rm(event, recentEntry.ref)}
            title="Remove"
          >
            <Icon n="x" />
          </button>
        </a>
      ))}
    </>
  );
}

export function RepoList({
  repos,
  repo,
  filter,
  on,
}: {
  repos: RepoSummary[];
  repo: string | null;
  filter: string;
  on: SideHandlers;
}) {
  const field = filter.toLowerCase();

  const shown = repos.filter(repoSummary =>
    repoSummary.full_name.toLowerCase().includes(field),
  );

  return (
    <>
      <input
        class="input sb-filter"
        id="repofilter"
        placeholder="Find a repository…"
        value={filter}
        onInput={on.repoFilter}
      />
      <button
        title="Choose which repositories Pullscope follows"
        class="sb-btn"
        id="pickrepos"
        onClick={on.pickRepos}
      >
        Choose repositories…
      </button>
      {shown.length ? (
        shown.map(repoSummary => (
          <a
            class={`rc ro-it ${repo === repoSummary.full_name ? 'on' : ''}${roCls('repos', repoSummary.full_name)}`}
            data-repo={repoSummary.full_name}
            data-t={repoSummary.full_name}
            onClick={() => on.repo(repoSummary.full_name)}
          >
            <span
              class={`rc-i ${repoSummary.private ? 'closed' : ''}`}
              style="color:var(--fgColor-muted)"
            >
              <Icon n={repoSummary.private ? 'lock' : 'repo'} />
            </span>
            <span class="rc-t">
              <b>{repoSummary.full_name.split('/')[1]}</b>
              <i>{repoSummary.full_name.split('/')[0]}</i>
            </span>
            <i
              class="ro-grip"
              title="Drag to reorder"
              onClick={event => event.stopPropagation()}
              onMouseDown={event => on.grip(event, repoSummary.full_name)}
            >
              ⋮⋮
            </i>
          </a>
        ))
      ) : (
        <div class="sb-empty">No matches.</div>
      )}
    </>
  );
}

function Sel({
  id,
  opts,
  v: otherValue,
  onChange,
}: {
  id: string;
  opts: [string, string][];
  v: string;
  onChange: (event: Event) => void;
}) {
  return (
    <select class="input sb-sel" id={id} onChange={onChange}>
      {opts.map(([key, text]) => (
        <option value={key} selected={key === otherValue}>
          {text}
        </option>
      ))}
    </select>
  );
}

export interface SideHeadProps {
  repo: string;
  state: string;
  filter: string;
  sort: string;
  group: string;
  sorts: [string, string][];
  groups: [string, string][];
}

export function SideHead({
  p: props,
  on,
}: {
  p: SideHeadProps;
  on: SideHandlers;
}) {
  return (
    <>
      <div class="sb-repo">
        <button
          class="fold-btn"
          data-side="repos"
          title="All repositories"
          onClick={() => on.side('repos')}
        >
          <Icon n="chevron-left" />
        </button>
        <b title={props.repo}>{props.repo}</b>
      </div>
      <div class="seg sb-seg">
        {['open', 'closed', 'all'].map(text => (
          <button
            title={`Show ${text} pull requests`}
            data-sps={text}
            class={props.state === text ? 'on' : ''}
            onClick={() => on.sps(text)}
          >
            {cap(text)}
          </button>
        ))}
      </div>
      <input
        class="input sb-filter"
        id="prfilter"
        placeholder="Filter by title, #, author, label…"
        value={props.filter}
        onInput={on.pf}
      />
      <div class="sb-ctl">
        <label>
          Sort
          <Sel
            id="prsort"
            opts={props.sorts}
            v={props.sort}
            onChange={on.psort}
          />
        </label>
        <label>
          Group
          <Sel
            id="prgroup"
            opts={props.groups}
            v={props.group}
            onChange={on.pgroup}
          />
        </label>
      </div>
    </>
  );
}

export interface PrGroup {
  key: string;
  folded: string;
  closed: boolean;
  name: string;
  rows: RcRow[];
}

export function PrGroups({
  groups,
  on,
}: {
  groups: PrGroup[];
  on: SideHandlers;
}) {
  return (
    <>
      {groups.map(prGroup => (
        <div class={`pg${prGroup.folded}`}>
          <div
            class="pg-h"
            data-fold={prGroup.key}
            onClick={event => on.fold(event, prGroup.key)}
          >
            <Icon n={prGroup.closed ? 'chevron-right' : 'chevron-down'} />
            <span>{prGroup.name}</span>
            <i>{prGroup.rows.length}</i>
          </div>
          <div class="pg-b">
            {prGroup.rows.map(rcRow => (
              <RcItem r={rcRow} on={on} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function Sidebar({
  sideTab,
  hasRepo,
  on,
  children,
}: {
  sideTab: string;
  hasRepo: boolean;
  on: SideHandlers;
  children: ComponentChildren;
}) {
  return (
    <aside class="sidebar">
      <SideTabs active={sideTab} hasRepo={hasRepo} on={on} />
      <div class="sb-list">{children}</div>
    </aside>
  );
}
