import { DraftBox } from './Actions';
import { renderIcon, SP } from './ui';

import type { ComponentChildren } from 'preact';
import type { NpListKey, Template } from '../types';

export interface NoteRow {
  id: number | string;
  read: boolean;
  ref: string;
  target: string;
  title: string;
  text: string;
  when: string;
}

export interface NotesHandlers {
  check: () => void;
  readAll: () => void;
  clear: () => void;
  filter: (field: string) => void;
  read: (event: MouseEvent, id: number | string) => void;
  del: (event: MouseEvent, id: number | string) => void;
  open: (el: HTMLElement, event: MouseEvent) => void;
  aux: (el: HTMLElement, event: MouseEvent) => void;
  ctx: (el: HTMLElement, event: MouseEvent) => void;
}

export function NotesPage({
  f: field,
  rows,
  unread,
  total,
  on,
}: {
  f: string;
  rows: NoteRow[];
  unread: number;
  total: number;
  on: NotesHandlers;
}) {
  const tabs: [string, string, number][] = [
    ['all', 'All', total],
    ['unread', 'Unread', unread],
    ['read', 'Read', total - unread],
  ];

  return (
    <div class="notes-page">
      <div class="np-head">
        <h1>
          {renderIcon('bell')}
          {SP}Notifications
        </h1>
        <div class="np-tools">
          <button class="btn small" id="npcheck" onClick={on.check}>
            Check now
          </button>
          <button
            class="btn small"
            id="npreadall"
            onClick={on.readAll}
            disabled={!unread}
          >
            Mark all as read
          </button>
          <button
            class="btn small ghost"
            id="npclear"
            onClick={on.clear}
            disabled={!total}
          >
            Clear all
          </button>
        </div>
      </div>
      {'\n  '}
      <div class="np-tabs">
        {tabs.map(([key, line, count]) => (
          <button
            class={field === key ? 'sel' : ''}
            data-nf={key}
            onClick={() => on.filter(key)}
          >
            {line}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {'\n  '}
      <div class="np-list">
        {rows.length ? (
          rows.map(noteRow => (
            <div class={`np-row ${noteRow.read ? '' : 'new'}`}>
              <button
                class="np-dot"
                data-nread={noteRow.id}
                onClick={event => on.read(event, noteRow.id)}
                title={noteRow.read ? 'Mark as unread' : 'Mark as read'}
              ></button>
              {'\n    '}
              <a
                class="np-main"
                data-open={noteRow.ref}
                data-target={noteRow.target}
                data-note={noteRow.id}
                onClick={event => on.open(event.currentTarget, event)}
                onAuxClick={event => on.aux(event.currentTarget, event)}
                onContextMenu={event => on.ctx(event.currentTarget, event)}
              >
                <b>{noteRow.title}</b>
                <span>{noteRow.text}</span>
                <i>
                  {noteRow.ref} · {noteRow.when}
                </i>
              </a>
              {'\n    '}
              <button
                class="np-act"
                data-nread={noteRow.id}
                onClick={event => on.read(event, noteRow.id)}
              >
                {noteRow.read ? 'Mark unread' : 'Mark read'}
              </button>
              <button
                class="np-act del"
                data-ndel={noteRow.id}
                onClick={event => on.del(event, noteRow.id)}
                title="Delete"
              >
                {renderIcon('x')}
              </button>
            </div>
          ))
        ) : (
          <div class="note-empty np-empty">
            {field === 'unread'
              ? 'You are all caught up.'
              : field === 'read'
                ? 'Nothing read yet.'
                : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}
          </div>
        )}
      </div>
    </div>
  );
}

export interface NpMetaProps {
  rows: { k: NpListKey; name: string; chips: string[]; free: string[] }[];
  milestones: { number: number; title: string; on: boolean }[];
  issues: string;
}

export interface NpMetaHandlers {
  add: (npListKey: NpListKey, event: Event) => void;
  del: (npListKey: NpListKey, value: string) => void;
  mile: (event: Event) => void;
  issues: (event: Event) => void;
}

export function NpMeta({
  p: props,
  on,
}: {
  p: NpMetaProps;
  on: NpMetaHandlers;
}) {
  return (
    <div class="np-box np-metas" id="npmeta">
      {props.rows.map(row => (
        <div class="np-meta">
          <label class="np-l">{row.name}</label>
          <div class="np-chips">
            {row.chips.map(text => (
              <span
                class="np-chip"
                data-npdel={row.k}
                data-v={text}
                onClick={() => on.del(row.k, text)}
                title="Remove"
              >
                {text} ×
              </span>
            ))}
            {row.free.length ? (
              <select
                class="sel np-add"
                data-npadd={row.k}
                value=""
                onChange={event => on.add(row.k, event)}
              >
                <option value="">{`Add ${row.name.toLowerCase()}…`}</option>
                {row.free.map(text => (
                  <option>{text}</option>
                ))}
              </select>
            ) : (
              ''
            )}
          </div>
        </div>
      ))}
      {'\n    '}
      <div class="np-meta">
        <label class="np-l">Milestone</label>
        <select class="sel" id="npmile" onChange={on.mile}>
          <option value="">None</option>
          {props.milestones.map(item => (
            <option value={item.number} selected={item.on}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      {'\n    '}
      <div class="np-meta">
        <label class="np-l">
          Linked issues <i>closed when this merges</i>
        </label>
        <input
          class="input"
          id="npissues"
          placeholder="e.g. 12, 15"
          value={props.issues}
          onInput={on.issues}
        />
      </div>
    </div>
  );
}

export interface NewPrProps {
  hasRepos: boolean;
  repo: string;
  base: string;
  head: string;
  hasBranches: boolean;
  same: boolean;
  cmp: {
    kind: 'none' | 'loading' | 'err' | 'ok' | 'same';
    text: string;
    ahead: number;
    files: number;
    behind: number;
  };
  title: string;
  tpls: Template[] | null;
  tplText: string;
  seq: number;
  isDraft: boolean;
  err: string;
  ready: boolean;
  meta: NpMetaProps | null;
}

export interface NewPrHandlers extends NpMetaHandlers {
  cancel: () => void;
  repo: (event: MouseEvent) => void;
  repoIn: (event: Event) => void;
  base: (event: MouseEvent) => void;
  head: (event: MouseEvent) => void;
  swap: () => void;
  tpl: (event: Event) => void;
  title: (event: Event) => void;
  draft: (event: Event) => void;
  create: () => void;
}

export function NewPr({ p: props, on }: { p: NewPrProps; on: NewPrHandlers }) {
  const item = props.cmp;

  const cmp =
    item.kind === 'loading' ? (
      <span class="np-note">Comparing…</span>
    ) : item.kind === 'none' ? (
      ''
    ) : item.kind === 'err' ? (
      <span class="np-note err">{item.text}</span>
    ) : item.kind === 'ok' ? (
      <span class="np-note ok">
        {renderIcon('git-commit')}
        {SP}
        {item.ahead} commit{item.ahead === 1 ? '' : 's'} · {item.files} file
        {item.files === 1 ? '' : 's'} changed
        {item.behind ? ` · ${item.behind} behind ${props.base}` : ''}
      </span>
    ) : (
      <span class="np-note err">
        These branches are identical — there is nothing to compare.
      </span>
    );

  const templates = props.tpls;

  return (
    <div class="notes-page np-new" key={props.seq}>
      <div class="np-head">
        <h1>
          {renderIcon('git-pull-request')}
          {SP}New pull request
        </h1>
      </div>
      {'\n  '}
      <div class="np-card">
        <div class="np-main-col">
          {'\n    '}
          <div class="np-box">
            <label class="np-l">Repository</label>
            {props.hasRepos ? (
              <button
                type="button"
                class="sel bp-btn"
                id="nprepo"
                onClick={on.repo}
              >
                <span>{props.repo || 'Choose a repository'}</span>
                {renderIcon('chevron-down', 14)}
              </button>
            ) : (
              <input
                class="input"
                id="nprepoin"
                placeholder="owner/repo"
                value={props.repo}
                onChange={on.repoIn}
              />
            )}
            {'\n    '}
            <div class="np-branches">
              <div>
                <label class="np-l">
                  Base <i>merge into</i>
                </label>
                <button
                  type="button"
                  class="sel bp-btn"
                  id="npbase"
                  data-bp="base"
                  onClick={on.base}
                  disabled={!props.hasBranches}
                >
                  <span>
                    {props.hasBranches
                      ? props.base || 'Choose a branch'
                      : 'Loading…'}
                  </span>
                  {renderIcon('chevron-down', 14)}
                </button>
              </div>
              {'\n      '}
              <button
                class="tb-btn"
                id="npswap"
                onClick={on.swap}
                title="Swap base and head"
              >
                ⇄
              </button>
              {'\n      '}
              <div>
                <label class="np-l">
                  Head <i>changes from</i>
                </label>
                <button
                  type="button"
                  class="sel bp-btn"
                  id="nphead"
                  data-bp="head"
                  onClick={on.head}
                  disabled={!props.hasBranches}
                >
                  <span>
                    {props.hasBranches
                      ? props.head || 'Choose a branch'
                      : 'Loading…'}
                  </span>
                  {renderIcon('chevron-down', 14)}
                </button>
              </div>
            </div>
            {'\n    '}
            <div class="np-cmp">
              {props.same ? (
                <span class="np-note err">
                  Base and head are the same branch.
                </span>
              ) : (
                cmp
              )}
            </div>
          </div>
          {'\n    '}
          <div class="np-box">
            <label class="np-l">Title</label>
            <input
              class="input"
              id="nptitle"
              placeholder="Title"
              value={props.title}
              onInput={on.title}
            />
          </div>
          {'\n    '}
          <div class="np-box">
            <label class="np-l">Description</label>
            {templates && templates.length > 1 ? (
              <select
                class="sel np-tpl"
                id="nptpl"
                value={String(
                  templates.findIndex(
                    template => template.body === props.tplText,
                  ),
                )}
                onChange={on.tpl}
              >
                <option value="-1">No template</option>
                {templates.map((template, index) => (
                  <option value={index}>Template: {template.name}</option>
                ))}
              </select>
            ) : (
              ''
            )}
            <DraftBox
              k="newpr"
              ph="Describe your changes"
              rows={8}
              submit={props.ready ? on.create : undefined}
            />
          </div>
          {'\n    '}
          <div class="np-box">
            <label class="np-check">
              <input
                type="checkbox"
                id="npdraft"
                checked={props.isDraft}
                onChange={on.draft}
              />{' '}
              Create as draft <span>(not ready for review yet)</span>
            </label>
            {'\n    '}
            {props.err ? <div class="act-err">{props.err}</div> : ''}
            {'\n    '}
            <div class="np-btns">
              <button class="btn" id="npcancel" onClick={on.cancel}>
                Cancel
              </button>
              <button
                class="btn primary"
                id="npcreate"
                onClick={on.create}
                disabled={!props.ready}
              >
                {props.isDraft
                  ? 'Create draft pull request'
                  : 'Create pull request'}
              </button>
            </div>
          </div>
          {'\n  '}
        </div>
        <div class="np-side-col">
          {props.meta ? <NpMeta p={props.meta} on={on} /> : ''}
        </div>
      </div>
    </div>
  );
}

export interface IbRow {
  ref: string;
  avatar: string;
  title: string;
  sub: string;
  fresh: boolean;
  comments: number;
  updated: string;
  pinned: boolean;
  snz: string;
  sel: boolean;
  snzOpen: boolean;
}

export interface InboxSec {
  title: string;
  sub: string;
  key: string;
  closed: boolean;
  rows: IbRow[];
  first: boolean;
  last: boolean;
  ro: string;
}

export interface InboxProps {
  loading: boolean;
  err: string;
  sort: string;
  sorts: [string, string][];
  q: string;
  custom: boolean;
  views: string[];
  view: string;
  naming: boolean;
  secs: InboxSec[] | null;
}

export interface InboxHandlers {
  refresh: () => void;
  sort: (event: Event) => void;
  query: (event: Event) => void;
  fold: (key: string) => void;
  foldAll: (closed: boolean) => void;
  move: (title: string, by: number) => void;
  grip: (event: MouseEvent, title: string) => void;
  resetOrder: () => void;
  pin: (ref: string) => void;
  snooze: (
    ref: string,
    kind: 'tomorrow' | 'week' | 'activity' | 'off',
    updated: string,
  ) => void;
  snoozeMenu: (ref: string) => void;
  viewApply: (name: string) => void;
  viewSave: (name: string) => void;
  viewDelete: (name: string) => void;
  viewNaming: (on: boolean) => void;
  open: (el: HTMLElement, event: MouseEvent) => void;
  aux: (el: HTMLElement, event: MouseEvent) => void;
  ctx: (el: HTMLElement, event: MouseEvent) => void;
}

function ViewsBar({
  views,
  view,
  naming,
  on,
}: {
  views: string[];
  view: string;
  naming: boolean;
  on: InboxHandlers;
}) {
  if (naming) {
    return (
      <span class="ib-views">
        <input
          class="input"
          placeholder="Name this view"
          autofocus
          ref={el => el?.focus()}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              on.viewSave((event.target as HTMLInputElement).value);
            } else if (event.key === 'Escape') {
              on.viewNaming(false);
            }
          }}
        />
        <button class="btn small" onClick={() => on.viewNaming(false)}>
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span class="ib-views">
      {views.length ? (
        <label>
          View
          <select
            class="input"
            onChange={event =>
              on.viewApply((event.target as HTMLSelectElement).value)
            }
          >
            <option value="">Choose…</option>
            {views.map(otherValue => (
              <option value={otherValue} selected={otherValue === view}>
                {otherValue}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        class="btn small"
        title="Save the current filter and sort as a view"
        onClick={() => on.viewNaming(true)}
      >
        Save view
      </button>
      {view ? (
        <button
          class="btn small"
          title={`Delete view “${view}”`}
          onClick={() => on.viewDelete(view)}
        >
          Delete view
        </button>
      ) : null}
    </span>
  );
}

export function InboxPage({
  p: { loading, err, secs, sort, sorts, q: query, custom, views, view, naming },
  on,
}: {
  p: InboxProps;
  on: InboxHandlers;
}) {
  const body: ComponentChildren = err ? (
    <div class="diff-empty err">{err}</div>
  ) : !secs ? (
    <div class="skel">
      <div class="sk sk-line"></div>
      <div class="sk sk-line w80"></div>
      <div class="sk sk-line w60"></div>
    </div>
  ) : (
    secs.map(inboxSec => (
      <section
        key={inboxSec.title}
        data-t={inboxSec.title}
        class={`ib-sec${inboxSec.closed ? ' closed' : ''}${inboxSec.ro}`}
      >
        <h2 class="ib-h" onClick={() => on.fold(inboxSec.key)}>
          <i
            class="ib-grip"
            title="Drag to move this section"
            onClick={event => event.stopPropagation()}
            onMouseDown={event => on.grip(event, inboxSec.title)}
          >
            ⋮⋮
          </i>
          {renderIcon(inboxSec.closed ? 'chevron-right' : 'chevron-down')}
          {inboxSec.title}
          <span>{inboxSec.rows.length}</span>
          <em class="ib-mv">
            <button
              title="Move up"
              disabled={inboxSec.first}
              onClick={event => {
                event.stopPropagation();
                on.move(inboxSec.title, -1);
              }}
            >
              {renderIcon('chevron-up')}
            </button>
            <button
              title="Move down"
              disabled={inboxSec.last}
              onClick={event => {
                event.stopPropagation();
                on.move(inboxSec.title, 1);
              }}
            >
              {renderIcon('chevron-down')}
            </button>
          </em>
        </h2>
        {inboxSec.closed ? (
          ''
        ) : (
          <>
            <p>{inboxSec.sub}</p>
            {inboxSec.rows.length ? (
              inboxSec.rows.map(ibRow => (
                <a
                  class={`ib-row${ibRow.sel ? ' sel' : ''}${ibRow.pinned ? ' pinned' : ''}`}
                  data-open={ibRow.ref}
                  onClick={event => on.open(event.currentTarget, event)}
                  onAuxClick={event => on.aux(event.currentTarget, event)}
                  onContextMenu={event => on.ctx(event.currentTarget, event)}
                >
                  <img src={ibRow.avatar} alt="" />
                  <span class="ib-t">
                    <b>{ibRow.title}</b>
                    <i>{ibRow.sub}</i>
                  </span>
                  {ibRow.fresh ? <span class="ib-new">New activity</span> : ''}
                  {ibRow.snz ? <span class="ib-snz">{ibRow.snz}</span> : ''}
                  {ibRow.comments ? (
                    <span class="ib-c">
                      {renderIcon('comment')}
                      {SP}
                      {ibRow.comments}
                    </span>
                  ) : (
                    ''
                  )}
                  <span
                    class="ib-acts"
                    onClick={event => event.stopPropagation()}
                  >
                    {ibRow.snzOpen ? (
                      <>
                        {ibRow.snz ? (
                          <button
                            onClick={() =>
                              on.snooze(ibRow.ref, 'off', ibRow.updated)
                            }
                          >
                            Wake
                          </button>
                        ) : (
                          ''
                        )}
                        <button
                          onClick={() =>
                            on.snooze(ibRow.ref, 'tomorrow', ibRow.updated)
                          }
                        >
                          Tomorrow
                        </button>
                        <button
                          onClick={() =>
                            on.snooze(ibRow.ref, 'week', ibRow.updated)
                          }
                        >
                          Next week
                        </button>
                        <button
                          onClick={() =>
                            on.snooze(ibRow.ref, 'activity', ibRow.updated)
                          }
                        >
                          Until activity
                        </button>
                      </>
                    ) : null}
                    <button
                      class={ibRow.pinned ? 'on' : ''}
                      title={ibRow.pinned ? 'Unpin' : 'Pin to the top'}
                      onClick={() => on.pin(ibRow.ref)}
                    >
                      {renderIcon('bookmark')}
                    </button>
                    <button
                      title="Snooze"
                      onClick={() => on.snoozeMenu(ibRow.ref)}
                    >
                      {renderIcon('clock')}
                    </button>
                  </span>
                </a>
              ))
            ) : (
              <div class="ib-none">
                {query ? 'No matches.' : 'Nothing here. Nice.'}
              </div>
            )}
          </>
        )}
      </section>
    ))
  );

  const allClosed = !!secs && secs.every(inboxSec => inboxSec.closed);

  return (
    <div class="notes-page">
      <div class="np-head">
        <h1>
          {renderIcon('checklist')}
          {SP}Inbox
        </h1>
        <div class="np-tools">
          <button
            class="btn small"
            id="ibrefresh"
            onClick={on.refresh}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>
      <div class="ib-bar">
        <input
          class="input"
          placeholder="Filter by title, repository, author or #…"
          value={query}
          onInput={on.query}
        />
        <label>
          Sort
          <select class="input" onChange={on.sort}>
            {sorts.map(([key, text]) => (
              <option value={key} selected={key === sort}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <button
          class="btn small"
          onClick={() => on.foldAll(!allClosed)}
          disabled={!secs}
        >
          {allClosed ? 'Expand all' : 'Collapse all'}
        </button>
        {custom ? (
          <button class="btn small" onClick={on.resetOrder}>
            Reset order
          </button>
        ) : (
          ''
        )}
        <ViewsBar views={views} view={view} naming={naming} on={on} />
      </div>
      {body}
    </div>
  );
}

export const Skeleton = () => (
  <div class="skel" aria-busy="true">
    <div class="sk sk-crumb"></div>
    <div class="sk sk-title"></div>
    <div class="sk sk-pill"></div>
    <div class="sk sk-line w60"></div>
    <div class="sk-tabs">
      <i class="sk"></i>
      <i class="sk"></i>
      <i class="sk"></i>
    </div>
    {[0, 1, 2].map(index => (
      <div class="sk-row" style={`--i:${index}`}>
        <div class="sk sk-av"></div>
        <div class="sk-card">
          <div class="sk sk-line w40"></div>
          <div class="sk sk-line"></div>
          <div class="sk sk-line w80"></div>
          <div class="sk sk-line w60"></div>
        </div>
      </div>
    ))}
  </div>
);

export type PrSideKind =
  | { kind: 'none' }
  | { kind: 'rail' }
  | { kind: 'aside'; inner: ComponentChildren; on: { hide: () => void } };

export interface PrLayoutHandlers {
  show: () => void;
}

export function PrLayout({
  header,
  body,
  side,
  on,
}: {
  header: ComponentChildren;
  body: ComponentChildren;
  side: PrSideKind;
  on: PrLayoutHandlers;
}) {
  return (
    <div class="pr-page">
      {header}
      <div class="pr-layout">
        <main class="pr-main">{body}</main>
        {side.kind === 'rail' ? (
          <button
            class="pane-rail side-rail"
            data-show="side"
            onClick={on.show}
            title="Show details"
          >
            {renderIcon('columns')}
            <span>Details</span>
          </button>
        ) : side.kind === 'aside' ? (
          <aside class="pr-side">
            <div class="side-top">
              <span>Details</span>
              <button
                class="fold-btn"
                data-hide="side"
                onClick={side.on.hide}
                title="Hide this panel"
              >
                {renderIcon('x')}
              </button>
            </div>
            {side.inner}
          </aside>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export const SplitLayout = ({
  header,
  split,
}: {
  header: ComponentChildren;
  split: ComponentChildren;
}) => (
  <div class="pr-page is-split">
    {header}
    {split}
  </div>
);

export const Gate = ({
  err,
  go,
  tok,
}: {
  err: string;
  go: () => void;
  tok: () => void;
}) => (
  <div class="gate">
    <div class="gate-card">
      <img src="logo.png" alt="" width={72} height={72} />
      <h1>Sign in to Pullscope</h1>
      {'\n  '}
      <p class="gate-err">
        {renderIcon('alert')}
        {SP}No GitHub sign-in or token was found.
      </p>
      {'\n  '}
      <p>
        Pullscope needs your GitHub account to load pull requests. Without one
        GitHub allows only 60 requests an hour, so the app would be slow and
        keep failing.
      </p>
      {'\n  '}
      {err ? <p class="gate-err">{err}</p> : ''}
      {'\n  '}
      <div class="btns" style="justify-content:center">
        <button class="btn primary" id="gatego" onClick={go}>
          Sign in with GitHub
        </button>
        <button class="btn" id="gatetok" onClick={tok}>
          Use a token instead
        </button>
      </div>
      {'\n  '}
      <small>
        Tip: running <code>gh auth login</code> in a terminal also works.
      </small>
    </div>
  </div>
);
