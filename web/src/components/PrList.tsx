import { Banners } from './Home';
import { renderIcon, SP } from './ui';

import type { ComponentChildren } from 'preact';
import type { PushBanner } from './Home';

const cap = (text: string) => text[0].toUpperCase() + text.slice(1);

export interface FilterHandlers {
  filter: (event: Event) => void;
  author: (event: Event) => void;
  label: (event: Event) => void;
  status: (event: Event) => void;
  sort: (event: Event) => void;
  clear: () => void;
}

export interface FilterBarProps {
  filter: string;
  authors: string[];
  labels: string[];
  author: string;
  label: string;
  status: string;
  statuses: [string, string][];
  sort: string;
  sorts: [string, string][];
  n: number;
  total: number;
  active: boolean;
}

function Opts({
  arr,
  v: otherValue,
  all,
}: {
  arr: string[];
  v: string;
  all: string;
}) {
  return (
    <>
      <option value="">{all}</option>
      {arr.map(text => (
        <option value={text} selected={text === otherValue}>
          {text}
        </option>
      ))}
    </>
  );
}

export function FilterBar({
  p: props,
  on,
}: {
  p: FilterBarProps;
  on: FilterHandlers;
}) {
  return (
    <div class="prl-filters">
      <span class="pf-search">
        {renderIcon('search')}
        <input
          class="input"
          id="mainfilter"
          placeholder="Filter by title, #, author, branch, label…"
          value={props.filter}
          spellcheck={false}
          onInput={on.filter}
        />
      </span>
      {'\n  '}
      <select class="input" id="pfauthor" onChange={on.author}>
        <Opts arr={props.authors} v={props.author} all="Author: all" />
      </select>
      {'\n  '}
      <select class="input" id="pflabel" onChange={on.label}>
        <Opts arr={props.labels} v={props.label} all="Label: all" />
      </select>
      {'\n  '}
      <select class="input" id="pfstatus" onChange={on.status}>
        <option value="">Status: any</option>
        {props.statuses.map(([key, text]) => (
          <option value={key} selected={key === props.status}>
            {text}
          </option>
        ))}
      </select>
      {'\n  '}
      <select class="input" id="pfsort" onChange={on.sort}>
        {props.sorts.map(([key, text]) => (
          <option value={key} selected={key === props.sort}>
            Sort: {text}
          </option>
        ))}
      </select>
      {'\n  '}
      <span class="pf-count">
        {props.n} of {props.total}
      </span>
      {props.active ? (
        <button
          title="Remove all filters"
          class="btn"
          id="pfclear"
          onClick={on.clear}
        >
          Clear
        </button>
      ) : (
        ''
      )}
    </div>
  );
}

export interface PrlRow {
  ref: string;
  st: string;
  icon: string;
  title: string;
  labels: { name: string; color: string }[];
  meta: string;
  avatar: string;
}

export interface PrListHandlers extends FilterHandlers {
  ps: (text: string) => void;
  open: (el: HTMLElement, event: MouseEvent) => void;
  aux: (el: HTMLElement, event: MouseEvent) => void;
  ctx: (el: HTMLElement, event: MouseEvent) => void;
  compare: (repo: string, branch: string) => void;
  dismiss: (key: string) => void;
}

export interface PrListProps {
  repo: string;
  state: string;
  banners: PushBanner[];
  filterBar: FilterBarProps | null;
  rows: PrlRow[] | null;
  err: string;
  loading: boolean;
  empty: string;
}

export function PrListPage({
  p: props,
  on,
}: {
  p: PrListProps;
  on: PrListHandlers;
}) {
  const body = props.err ? (
    <div class="err" style="padding:16px">
      {props.err}
    </div>
  ) : props.loading ? (
    <div class="spinner" style="margin:48px auto">
      Loading pull requests…
    </div>
  ) : props.rows && props.rows.length ? (
    <>
      {props.rows.map(prlRow => (
        <a
          class="prl-row"
          data-open={prlRow.ref}
          onClick={event => on.open(event.currentTarget, event)}
          onAuxClick={event => on.aux(event.currentTarget, event)}
          onContextMenu={event => on.ctx(event.currentTarget, event)}
        >
          <span class={`rc-i ${prlRow.st}`}>{renderIcon(prlRow.icon)}</span>
          <span class="prl-main">
            <b>{prlRow.title}</b>
            {prlRow.labels.map(item => (
              <span
                class="pill-label"
                style={`background:#${item.color}33;color:#${item.color};border-color:#${item.color};margin:0 0 0 4px`}
              >
                {item.name}
              </span>
            ))}
            <i>{prlRow.meta}</i>
          </span>
          <img
            src={`${prlRow.avatar}&s=40`}
            width={20}
            height={20}
            style="border-radius:50%"
          />
        </a>
      ))}
    </>
  ) : (
    <div class="diff-empty">{props.empty}</div>
  );

  return (
    <div class="pr-page">
      <div class="repoline" style="padding-bottom:16px"></div>
      <Banners items={props.banners} on={on} />
      <div class="prl">
        <div class="prl-head">
          <div>
            <span class="repo-ic">{renderIcon('repo', 16)}</span>
            {SP}
            <b>{props.repo}</b>
          </div>
          <div class="seg">
            {['open', 'closed', 'all'].map(text => (
              <button
                title={`Show ${text} pull requests`}
                data-ps={text}
                class={props.state === text ? 'on' : ''}
                onClick={() => on.ps(text)}
              >
                {cap(text)}
              </button>
            ))}
          </div>
        </div>
        {props.filterBar ? <FilterBar p={props.filterBar} on={on} /> : null}
        {body}
      </div>
    </div>
  );
}

export interface CrumbHandlers {
  home: () => void;
  owner: (option: string) => void;
  repo: (text: string) => void;
}

export interface CrumbProps {
  repo: string;
  trail: { t: string; repo?: string }[];
  extraNode?: ComponentChildren;
  on?: CrumbHandlers;
}

export function Crumbs({ repo, trail, extraNode, on }: CrumbProps) {
  const homeCur = !repo && !trail.length;

  const parts: ComponentChildren[] = [
    homeCur ? (
      <span class="crumb cur home">
        {renderIcon('home', 14)}
        <span>Home</span>
      </span>
    ) : (
      <a class="crumb" data-home="1" onClick={on && on.home} title="Home">
        {renderIcon('home', 14)}
        <span>Home</span>
      </a>
    ),
  ];

  if (repo) {
    const [owner, name] = repo.split('/');

    parts.push(
      <span class="crumb-grp">
        <a
          class="crumb"
          data-owner={owner}
          onClick={on && (() => on.owner(owner))}
          title={`Repositories of ${owner}`}
        >
          {owner}
        </a>
        <span class="crumb-slash">/</span>
        <a
          class="crumb strong"
          data-repo={repo}
          onClick={on && (() => on.repo(repo))}
          title={`All pull requests in ${repo}`}
        >
          {name}
        </a>
      </span>,
    );
  }

  trail.forEach((item, index) =>
    parts.push(
      index === trail.length - 1 ? (
        <span class="crumb cur">{item.t}</span>
      ) : (
        <a
          class="crumb"
          data-repo={item.repo || undefined}
          onClick={on && item.repo ? () => on.repo(item.repo!) : undefined}
        >
          {item.t}
        </a>
      ),
    ),
  );

  return (
    <nav class="repoline crumbs" aria-label="Breadcrumb">
      {parts.map((value, index) => (
        <>
          {index ? (
            <span class="crumb-sep">{renderIcon('chevron-right', 12)}</span>
          ) : (
            ''
          )}
          {value}
        </>
      ))}
      {extraNode}
    </nav>
  );
}
