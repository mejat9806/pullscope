import { whenParts } from '../app/core';
import { Av, renderIcon, SP } from './ui';

import type { ComponentChildren } from 'preact';
import type { Person, Verification } from '../types';

export interface CommitRowProps {
  first: string;
  sha: string;
  author: Person | null;
  url: string;
  verification: Verification | undefined;
}

export function CommitRow({
  first,
  sha,
  author,
  url,
  verification,
}: CommitRowProps) {
  const unv = verification && !verification.verified;

  return (
    <div class="commit-row">
      {author ? (
        <span class="TLI-avatar" style="margin-right:8px">
          {Av(author, 20)}
        </span>
      ) : (
        ''
      )}
      <span class="msg" style="flex:0 1 auto">
        <a href={url || '#'}>{first}</a>
      </span>
      <span class="cm-ic">{renderIcon('comment')}</span>
      <span style="flex:1"></span>
      {verification ? (
        <span class={`label-pill ${unv ? 'warn' : 'ok'}`}>
          {unv ? 'Unverified' : 'Verified'}
        </span>
      ) : (
        ''
      )}
      <a class="sha" href={url || '#'}>
        {String(sha).slice(0, 7)}
      </a>
    </div>
  );
}

export interface BarHandlers {
  who: (login: string) => void;
  whoClear: () => void;
  range: (event: Event) => void;
  from: (event: Event) => void;
  to: (event: Event) => void;
  sort: () => void;
}

export interface RangeBarProps {
  range: string;
  from: string;
  to: string;
  desc: boolean;
}

export function RangeBar({
  range,
  from,
  to,
  desc,
  on,
}: RangeBarProps & { on?: BarHandlers }) {
  const opts = [
    ['all', 'Any time'],
    ['1h', 'Last hour'],
    ['24h', 'Last 24 hours'],
    ['7d', 'Last 7 days'],
    ['30d', 'Last 30 days'],
    ['custom', 'Custom range…'],
  ];

  return (
    <div class="date-bar">
      <span class="who-l">{renderIcon('clock')}When</span>
      <select
        class="sel"
        id="crange"
        title="Only show activity from this period"
        onChange={on?.range}
      >
        {opts.map(([otherValue, line]) => (
          <option value={otherValue} selected={range === otherValue}>
            {line}
          </option>
        ))}
      </select>
      {range === 'custom' ? (
        <>
          <input
            type="date"
            class="input"
            id="cfrom"
            value={from}
            title="From"
            onChange={on?.from}
          />
          <span class="who-l">to</span>
          <input
            type="date"
            class="input"
            id="cto"
            value={to}
            title="To"
            onChange={on?.to}
          />
        </>
      ) : (
        ''
      )}
      <span class="sp"></span>
      <button
        class="who-chip"
        id="csort"
        title="Flip the order of the timeline"
        onClick={on?.sort}
      >
        {renderIcon(desc ? 'chevron-down' : 'chevron-up')}
        <span>{desc ? 'Newest first' : 'Oldest first'}</span>
      </button>
    </div>
  );
}

export interface WhoBarProps {
  everyone: boolean;
  people: { u: Person; n: number; on: boolean }[];
}

export function WhoBar({
  everyone,
  people,
  on,
}: WhoBarProps & { on?: BarHandlers }) {
  return (
    <div class="who-bar">
      <span class="who-l">{renderIcon('person')}Show</span>
      <button
        class={`who-chip ${everyone ? 'on' : ''}`}
        data-whoclear="1"
        onClick={on?.whoClear}
      >
        Everyone
      </button>
      {people.map(({ u: person, n: count, on: sel }) => (
        <button
          class={`who-chip ${sel ? 'on' : ''}`}
          data-who={person.login}
          onClick={on && (() => on.who(person.login!))}
          title={`${count} comment${count === 1 ? '' : 's'}`}
        >
          {Av(person, 18)}
          <span>{person.login}</span>
          <i>{count}</i>
        </button>
      ))}
    </div>
  );
}

export function Bars({
  who,
  range,
  on,
}: {
  who: WhoBarProps | null;
  range: RangeBarProps;
  on?: BarHandlers;
}) {
  return (
    <>
      {who && <WhoBar {...who} on={on} />}
      <RangeBar {...range} on={on} />
    </>
  );
}

export function FoldBar({
  folded,
  onClick,
}: {
  folded: boolean;
  onClick?: () => void;
}) {
  return (
    <div class="fold-bar">
      <button
        class="btn small"
        id="foldallconv"
        title="Collapse or expand every comment, review and thread"
        onClick={onClick}
      >
        {renderIcon('chevron-down')}
        {SP}
        <span>
          {folded ? 'Expand all conversations' : 'Collapse all conversations'}
        </span>
      </button>
    </div>
  );
}

const Time = ({ at }: { at: string }) => (
  <a class="time">{whenParts(at).text}</a>
);

const actor = (person?: Person | null) =>
  person ? (
    <a class="actor" href={person.html_url}>
      {person.login}
    </a>
  ) : (
    <span class="actor">ghost</span>
  );

export function CommitRun({
  n: count,
  first,
  last,
  onTab,
}: {
  n: number;
  first: string;
  last: string;
  onTab?: (key: string) => void;
}) {
  return (
    <div class="TLI">
      <div class="TLI-badge">{renderIcon('git-commit')}</div>
      <div class="TLI-body">
        <div class="row">
          <a
            data-tab="commits"
            class="run"
            onClick={onTab && (() => onTab('commits'))}
          >
            <b>{count} commits</b>
            {SP}
            <span class="mono">
              {first} … {last}
            </span>{' '}
            · view in Commits
          </a>
        </div>
      </div>
    </div>
  );
}

export function Committed({ row }: { row: ComponentChildren }) {
  return (
    <div class="TLI">
      <div class="TLI-badge">{renderIcon('git-commit')}</div>
      <div class="TLI-body">{row}</div>
    </div>
  );
}

export interface ReferencedProps {
  actor: Person | null | undefined;
  at: string;
  commit: { author?: Person | null; html_url: string; sha: string } | null;
  msg: string;
}

// An issue reference in the commit message becomes its own link: the text before and after it stay links to the commit.
const Linked = ({ msg, url }: { msg: string; url: string }) => {
  const match = msg.match(/^([\s\S]*?)#(\d+)([\s\S]*)$/);

  return match ? (
    <>
      <a href={url}>{match[1]}</a>
      <a href="#" style="color:var(--fgColor-accent)">
        #{match[2]}
      </a>
      <a href="#">{match[3]}</a>
    </>
  ) : (
    <a href={url}>{msg}</a>
  );
};

export function Referenced({
  actor: person,
  at,
  commit: ci,
  msg,
}: ReferencedProps) {
  return (
    <div class="TLI">
      <div class="TLI-badge">{renderIcon('cross-reference')}</div>
      <div class="TLI-body stack">
        <div class="row" style="min-height:32px">
          {actor(person)}
          {SP}
          <span>added a commit that referenced this pull request</span>
          {SP}
          <Time at={at} />
        </div>
        {ci ? (
          <div class="line2">
            <div class="commit-row">
              <span class="TLI-avatar" style="margin:0 8px 0 0">
                {Av(ci.author || person, 20)}
              </span>
              <span class="msg" style="flex:0 1 auto">
                <Linked msg={msg} url={ci.html_url} />
              </span>
              <span
                class="mono"
                style="background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px"
              >
                …
              </span>
              <span class="cm-ic">{renderIcon('comment')}</span>
              <span style="flex:1"></span>
              <a class="sha" href={ci.html_url}>
                {ci.sha.slice(0, 7)}
              </a>
            </div>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export function MergedRow({
  actor: person,
  commit,
  base,
  at,
}: {
  actor: Person | null | undefined;
  commit: string;
  base: string;
  at: string;
}) {
  return (
    <div class="TLI mergedrow">
      <div class="TLI-badge done">{renderIcon('git-merge')}</div>
      <div class="TLI-avatar">{Av(person, 20)}</div>
      <div class="TLI-body">
        <div class="row">
          {actor(person)}
          {SP}
          <span>
            merged commit{' '}
            <b class="mono" style="color:var(--fgColor-default);font-size:12px">
              {commit}
            </b>{' '}
            into <span class="branch">{base}</span>
          </span>
          {SP}
          <Time at={at} />
        </div>
      </div>
    </div>
  );
}

export interface CrossRefProps {
  actor: Person | null | undefined;
  at: string;
  isPr: boolean;
  open: boolean;
  icon: string;
  url: string;
  title: string;
  repo: string;
  number: number;
}

export function CrossRef(props: CrossRefProps) {
  return (
    <div class="TLI">
      <div class="TLI-badge">{renderIcon('cross-reference')}</div>
      <div class="TLI-body">
        <div class="row">
          {actor(props.actor)}
          {SP}
          <span>mentioned this {props.isPr ? 'pull request' : 'issue'}</span>
          {SP}
          <Time at={props.at} />
        </div>
        {'\n        '}
        <div class="ref-card">
          <span
            style={`color:var(--fgColor-${props.open ? 'success' : 'done'});margin-top:2px`}
          >
            {renderIcon(props.icon)}
          </span>
          <div>
            <a class="t" href={props.url} style="color:var(--fgColor-default)">
              {props.title}
            </a>
            <span class="r">
              {props.repo}#{props.number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LabelRow({
  actor: person,
  verb,
  color,
  name,
  at,
}: {
  actor: Person | null | undefined;
  verb: string;
  color: string;
  name: string;
  at: string;
}) {
  return (
    <div class="TLI condensed">
      <div class="TLI-badge">{renderIcon('tag')}</div>
      <div class="TLI-avatar">{Av(person, 20)}</div>
      <div class="TLI-body">
        {actor(person)}
        {SP}
        <span>{verb}</span>
        {SP}
        <span
          class="pill-label"
          style={`background:#${color};color:#fff;margin:0`}
        >
          {name}
        </span>
        {SP}
        <span>label</span>
        {SP}
        <Time at={at} />
      </div>
    </div>
  );
}

export interface SimpleProps {
  actor: Person | null | undefined;
  ic: string;
  text: ComponentChildren;
  kind: string;
  at: string;
}

export function Simple({ actor: person, ic, text, kind, at }: SimpleProps) {
  return (
    <div class="TLI">
      <div class={`TLI-badge ${kind}`}>{renderIcon(ic)}</div>
      <div class="TLI-avatar">{Av(person, 20)}</div>
      <div class="TLI-body">
        <div class="row">
          {actor(person)}
          {SP}
          <span>{text}</span>
          {SP}
          <Time at={at} />
        </div>
      </div>
    </div>
  );
}

export interface CheckRowData {
  name: string;
  st: string;
  url?: string;
  desc: string;
  req: boolean;
  status: string;
  dur: string;
}

export interface ChecksProps {
  head: [string, string];
  summary: string;
  headIcon: string;
  rows: (CheckRowData & { icon: string })[];
}

export function Checks({ head, summary, headIcon, rows }: ChecksProps) {
  return (
    <div class="checks">
      <div class={`ck-head ${head[0]}`}>
        {renderIcon(headIcon, 20)}
        <div>
          <b>{head[1]}</b>
          <span>{summary}</span>
        </div>
      </div>
      {rows.map(value => (
        <a
          class={`ck-row ${value.st}`}
          href={value.url ? value.url : undefined}
        >
          <span class="ck-i">{renderIcon(value.icon)}</span>
          <span class="ck-n">
            <b>{value.name}</b>
            {value.req ? (
              <span class="ck-req" title="Required by branch protection">
                Required
              </span>
            ) : (
              ''
            )}
            <i>{value.desc}</i>
          </span>
          <span class="ck-s">{value.status}</span>
          <span class="ck-d">{value.dur}</span>
        </a>
      ))}
    </div>
  );
}

export interface AttItem {
  k: string;
  ic: string;
  text: string;
  id?: string;
  title?: string;
  dataTab?: string;
}

export interface AttentionHandlers {
  next: () => void;
  unres: () => void;
  tab: (key: string) => void;
}

export function Attention({
  items,
  unres,
  showUnres,
  on,
}: {
  items: AttItem[];
  unres: boolean;
  showUnres: boolean;
  on?: AttentionHandlers;
}) {
  return (
    <div class="attn">
      {items.map(it => (
        <button
          class={`att-i ${it.k}`}
          id={it.id}
          title={it.title}
          data-tab={it.dataTab}
          onClick={
            on &&
            (it.id === 'nextun'
              ? on.next
              : it.dataTab
                ? () => on.tab(it.dataTab!)
                : undefined)
          }
        >
          {renderIcon(it.ic)}
          <span>{it.text}</span>
        </button>
      ))}
      {showUnres ? (
        <>
          <span class="sp"></span>
          <button
            class={`att-tog ${unres ? 'on' : ''}`}
            id="unres"
            title="Hide everything except review threads that are still open"
            onClick={on?.unres}
          >
            {renderIcon('comment')}Unresolved only
          </button>
        </>
      ) : (
        ''
      )}
    </div>
  );
}
