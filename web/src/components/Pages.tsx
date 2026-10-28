import { DraftBox } from './Actions';
import type { ComponentChildren } from 'preact';
import type { NpListKey, Template } from '../types';
import { I, SP } from './ui';

export interface NoteRow { id: number | string; read: boolean; ref: string; target: string; title: string; text: string; when: string }
export interface NotesHandlers {
  check: () => void; readAll: () => void; clear: () => void; filter: (f: string) => void; read: (e: MouseEvent, id: number | string) => void; del: (e: MouseEvent, id: number | string) => void
  open: (el: HTMLElement, e: MouseEvent) => void; aux: (el: HTMLElement, e: MouseEvent) => void; ctx: (el: HTMLElement, e: MouseEvent) => void
}
export function NotesPage({ f, rows, unread, total, on }: { f: string; rows: NoteRow[]; unread: number; total: number; on: NotesHandlers }) {
  const tabs: [string, string, number][] = [['all', 'All', total], ['unread', 'Unread', unread], ['read', 'Read', total - unread]];
  return <div class="notes-page"><div class="np-head"><h1>{I('bell')}{SP}Notifications</h1><div class="np-tools"><button class="btn small" id="npcheck" onClick={on.check}>Check now</button><button class="btn small" id="npreadall" onClick={on.readAll} disabled={!unread}>Mark all as read</button><button class="btn small ghost" id="npclear" onClick={on.clear} disabled={!total}>Clear all</button></div></div>{'\n  '}
    <div class="np-tabs">{tabs.map(([k, l, c]) => <button class={f === k ? 'sel' : ''} data-nf={k} onClick={() => on.filter(k)}>{l}<span>{c}</span></button>)}</div>{'\n  '}
    <div class="np-list">{rows.length ? rows.map((n) => <div class={`np-row ${n.read ? '' : 'new'}`}><button class="np-dot" data-nread={n.id} onClick={(e) => on.read(e, n.id)} title={n.read ? 'Mark as unread' : 'Mark as read'}></button>{'\n    '}
      <a class="np-main" data-open={n.ref} data-target={n.target} data-note={n.id} onClick={(e) => on.open(e.currentTarget, e)} onAuxClick={(e) => on.aux(e.currentTarget, e)} onContextMenu={(e) => on.ctx(e.currentTarget, e)}><b>{n.title}</b><span>{n.text}</span><i>{n.ref} · {n.when}</i></a>{'\n    '}
      <button class="np-act" data-nread={n.id} onClick={(e) => on.read(e, n.id)}>{n.read ? 'Mark unread' : 'Mark read'}</button><button class="np-act del" data-ndel={n.id} onClick={(e) => on.del(e, n.id)} title="Delete">{I('x')}</button></div>)
      : <div class="note-empty np-empty">{f === 'unread' ? 'You are all caught up.' : f === 'read' ? 'Nothing read yet.' : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}</div>}</div></div>;
}

export interface NpMetaProps {
  rows: { k: NpListKey; name: string; chips: string[]; free: string[] }[];
  milestones: { number: number; title: string; on: boolean }[]; issues: string;
}
export interface NpMetaHandlers { add: (k: NpListKey, e: Event) => void; del: (k: NpListKey, v: string) => void; mile: (e: Event) => void; issues: (e: Event) => void }
export function NpMeta({ p, on }: { p: NpMetaProps; on: NpMetaHandlers }) {
  return <div class="np-box np-metas" id="npmeta">{p.rows.map((r) => <div class="np-meta"><label class="np-l">{r.name}</label><div class="np-chips">{r.chips.map((x) => <span class="np-chip" data-npdel={r.k} data-v={x} onClick={() => on.del(r.k, x)} title="Remove">{x} ×</span>)}{r.free.length ? <select class="sel np-add" data-npadd={r.k} value="" onChange={(e) => on.add(r.k, e)}><option value="">{`Add ${r.name.toLowerCase()}…`}</option>{r.free.map((x) => <option>{x}</option>)}</select> : ''}</div></div>)}{'\n    '}
    <div class="np-meta"><label class="np-l">Milestone</label><select class="sel" id="npmile" onChange={on.mile}><option value="">None</option>{p.milestones.map((x) => <option value={x.number} selected={x.on}>{x.title}</option>)}</select></div>{'\n    '}
    <div class="np-meta"><label class="np-l">Linked issues <i>closed when this merges</i></label><input class="input" id="npissues" placeholder="e.g. 12, 15" value={p.issues} onInput={on.issues} /></div></div>;
}

export interface NewPrProps {
  hasRepos: boolean; repo: string; base: string; head: string; hasBranches: boolean; same: boolean;
  cmp: { kind: 'none' | 'loading' | 'err' | 'ok' | 'same'; text: string; ahead: number; files: number; behind: number };
  title: string; tpls: Template[] | null; tplText: string; seq: number; isDraft: boolean; err: string; ready: boolean; meta: NpMetaProps | null;
}
export interface NewPrHandlers extends NpMetaHandlers {
  cancel: () => void; repo: (e: MouseEvent) => void; repoIn: (e: Event) => void; base: (e: MouseEvent) => void; head: (e: MouseEvent) => void; swap: () => void;
  tpl: (e: Event) => void; title: (e: Event) => void; draft: (e: Event) => void; create: () => void;
}
export function NewPr({ p, on }: { p: NewPrProps; on: NewPrHandlers }) {
  const c = p.cmp;
  const cmp = c.kind === 'loading' ? <span class="np-note">Comparing…</span> : c.kind === 'none' ? '' : c.kind === 'err' ? <span class="np-note err">{c.text}</span>
    : c.kind === 'ok' ? <span class="np-note ok">{I('git-commit')}{SP}{c.ahead} commit{c.ahead === 1 ? '' : 's'} · {c.files} file{c.files === 1 ? '' : 's'} changed{c.behind ? ` · ${c.behind} behind ${p.base}` : ''}</span> : <span class="np-note err">These branches are identical — there is nothing to compare.</span>;
  const t = p.tpls;
  return <div class="notes-page np-new" key={p.seq}><div class="np-head"><h1>{I('git-pull-request')}{SP}New pull request</h1></div>{'\n  '}
    <div class="np-card"><div class="np-main-col">{'\n    '}
      <div class="np-box"><label class="np-l">Repository</label>{p.hasRepos ? <button type="button" class="sel bp-btn" id="nprepo" onClick={on.repo}><span>{p.repo || 'Choose a repository'}</span>{I('chevron-down', 14)}</button> : <input class="input" id="nprepoin" placeholder="owner/repo" value={p.repo} onChange={on.repoIn} />}{'\n    '}
        <div class="np-branches"><div><label class="np-l">Base <i>merge into</i></label><button type="button" class="sel bp-btn" id="npbase" data-bp="base" onClick={on.base} disabled={!p.hasBranches}><span>{p.hasBranches ? p.base || 'Choose a branch' : 'Loading…'}</span>{I('chevron-down', 14)}</button></div>{'\n      '}
          <button class="tb-btn" id="npswap" onClick={on.swap} title="Swap base and head">⇄</button>{'\n      '}
          <div><label class="np-l">Head <i>changes from</i></label><button type="button" class="sel bp-btn" id="nphead" data-bp="head" onClick={on.head} disabled={!p.hasBranches}><span>{p.hasBranches ? p.head || 'Choose a branch' : 'Loading…'}</span>{I('chevron-down', 14)}</button></div></div>{'\n    '}
        <div class="np-cmp">{p.same ? <span class="np-note err">Base and head are the same branch.</span> : cmp}</div></div>{'\n    '}
      <div class="np-box"><label class="np-l">Title</label><input class="input" id="nptitle" placeholder="Title" value={p.title} onInput={on.title} /></div>{'\n    '}
      <div class="np-box"><label class="np-l">Description</label>{t && t.length > 1 ? <select class="sel np-tpl" id="nptpl" value={String(t.findIndex((x) => x.body === p.tplText))} onChange={on.tpl}><option value="-1">No template</option>{t.map((x, i) => <option value={i}>Template: {x.name}</option>)}</select> : ''}<DraftBox k="newpr" ph="Describe your changes" rows={8} submit={p.ready ? on.create : undefined} /></div>{'\n    '}
      <div class="np-box"><label class="np-check"><input type="checkbox" id="npdraft" checked={p.isDraft} onChange={on.draft} /> Create as draft <span>(not ready for review yet)</span></label>{'\n    '}
        {p.err ? <div class="act-err">{p.err}</div> : ''}{'\n    '}
        <div class="np-btns"><button class="btn" id="npcancel" onClick={on.cancel}>Cancel</button><button class="btn primary" id="npcreate" onClick={on.create} disabled={!p.ready}>{p.isDraft ? 'Create draft pull request' : 'Create pull request'}</button></div></div>{'\n  '}
    </div><div class="np-side-col">{p.meta ? <NpMeta p={p.meta} on={on} /> : ''}</div></div></div>;
}

export interface IbRow { ref: string; avatar: string; title: string; sub: string; fresh: boolean; comments: number }
export interface InboxSec { title: string; sub: string; key: string; closed: boolean; rows: IbRow[]; first: boolean; last: boolean; lift: boolean; over: '' | 'before' | 'after' }
export interface InboxProps { loading: boolean; err: string; sort: string; sorts: [string, string][]; q: string; custom: boolean; secs: InboxSec[] | null }
export interface InboxHandlers { refresh: () => void; sort: (e: Event) => void; query: (e: Event) => void; fold: (key: string) => void; foldAll: (closed: boolean) => void; move: (title: string, by: number) => void; grip: (e: MouseEvent, title: string) => void; resetOrder: () => void; open: (el: HTMLElement, e: MouseEvent) => void; aux: (el: HTMLElement, e: MouseEvent) => void; ctx: (el: HTMLElement, e: MouseEvent) => void }
export function InboxPage({ p: { loading, err, secs, sort, sorts, q, custom }, on }: { p: InboxProps; on: InboxHandlers }) {
  const body: ComponentChildren = err ? <div class="diff-empty err">{err}</div> : !secs ? <div class="skel"><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>
    : secs.map((s) => <section key={s.title} data-t={s.title} class={`ib-sec${s.closed ? ' closed' : ''}${s.lift ? ' ib-lift' : ''}${s.over ? ' ib-over-' + s.over : ''}`}><h2 class="ib-h" onClick={() => on.fold(s.key)}><i class="ib-grip" title="Drag to move this section" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => on.grip(e, s.title)}>⋮⋮</i>{I(s.closed ? 'chevron-right' : 'chevron-down')}{s.title}<span>{s.rows.length}</span><em class="ib-mv"><button title="Move up" disabled={s.first} onClick={(e) => { e.stopPropagation(); on.move(s.title, -1); }}>{I('chevron-up')}</button><button title="Move down" disabled={s.last} onClick={(e) => { e.stopPropagation(); on.move(s.title, 1); }}>{I('chevron-down')}</button></em></h2>{s.closed ? '' : <><p>{s.sub}</p>{s.rows.length ? s.rows.map((r) => <a class="ib-row" data-open={r.ref} onClick={(e) => on.open(e.currentTarget, e)} onAuxClick={(e) => on.aux(e.currentTarget, e)} onContextMenu={(e) => on.ctx(e.currentTarget, e)}><img src={r.avatar} alt="" /><span class="ib-t"><b>{r.title}</b><i>{r.sub}</i></span>{r.fresh ? <span class="ib-new">New activity</span> : ''}{r.comments ? <span class="ib-c">{I('comment')}{SP}{r.comments}</span> : ''}</a>) : <div class="ib-none">{q ? 'No matches.' : 'Nothing here. Nice.'}</div>}</>}</section>);
  const allClosed = !!secs && secs.every((s) => s.closed);
  return <div class="notes-page"><div class="np-head"><h1>{I('checklist')}{SP}Inbox</h1><div class="np-tools"><button class="btn small" id="ibrefresh" onClick={on.refresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></div></div>
    <div class="ib-bar"><input class="input" placeholder="Filter by title, repository, author or #…" value={q} onInput={on.query} /><label>Sort<select class="input" onChange={on.sort}>{sorts.map(([k, t]) => <option value={k} selected={k === sort}>{t}</option>)}</select></label><button class="btn small" onClick={() => on.foldAll(!allClosed)} disabled={!secs}>{allClosed ? 'Expand all' : 'Collapse all'}</button>{custom ? <button class="btn small" onClick={on.resetOrder}>Reset order</button> : ''}</div>{body}</div>;
}

export const Skeleton = () => (<div class="skel" aria-busy="true"><div class="sk sk-crumb"></div><div class="sk sk-title"></div><div class="sk sk-pill"></div><div class="sk sk-line w60"></div><div class="sk-tabs"><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>{[0, 1, 2].map((i) => <div class="sk-row" style={`--i:${i}`}><div class="sk sk-av"></div><div class="sk-card"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div></div>)}</div>);

export type PrSideKind = { kind: 'none' } | { kind: 'rail' } | { kind: 'aside'; inner: ComponentChildren; on: { hide: () => void } };
export interface PrLayoutHandlers { show: () => void }
export function PrLayout({ header, body, side, on }: { header: ComponentChildren; body: ComponentChildren; side: PrSideKind; on: PrLayoutHandlers }) {
  return <div class="pr-page">{header}<div class="pr-layout"><main class="pr-main">{body}</main>{side.kind === 'rail' ? <button class="pane-rail side-rail" data-show="side" onClick={on.show} title="Show details">{I('columns')}<span>Details</span></button> : side.kind === 'aside' ? <aside class="pr-side"><div class="side-top"><span>Details</span><button class="fold-btn" data-hide="side" onClick={side.on.hide} title="Hide this panel">{I('x')}</button></div>{side.inner}</aside> : ''}</div></div>;
}
export const SplitLayout = ({ header, split }: { header: ComponentChildren; split: ComponentChildren }) => <div class="pr-page is-split">{header}{split}</div>;

export const Gate = ({ err, go, tok }: { err: string; go: () => void; tok: () => void }) => (<div class="gate"><div class="gate-card"><img src="logo.png" alt="" width={72} height={72} /><h1>Sign in to Pullscope</h1>{'\n  '}
  <p class="gate-err">{I('alert')}{SP}No GitHub sign-in or token was found.</p>{'\n  '}
  <p>Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing.</p>{'\n  '}
  {err ? <p class="gate-err">{err}</p> : ''}{'\n  '}
  <div class="btns" style="justify-content:center"><button class="btn primary" id="gatego" onClick={go}>Sign in with GitHub</button><button class="btn" id="gatetok" onClick={tok}>Use a token instead</button></div>{'\n  '}
  <small>Tip: running <code>gh auth login</code> in a terminal also works.</small></div></div>);
