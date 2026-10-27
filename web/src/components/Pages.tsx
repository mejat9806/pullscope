import type { ComponentChildren } from 'preact';
import type { Inbox, InboxItem, NpListKey, Template } from '../types';
import { html, Raw } from './html';
import { I, SP } from './ui';

export const landingHtml = (banners: string, err: string, ic: string) => html(<div class="landing">{banners ? <div class="push-wrap">{Raw(banners)}</div> : ''}{Raw(ic)}<h1>Open a pull request</h1><p>Type <code>owner/repo#123</code> or paste a pull request URL in the bar above.<br />Shortcuts: ⌘L address bar · ⌘R reload · ⌘[ ⌘] history</p>{err ? <div class="err">{err}</div> : ''}</div>);

export interface NoteRow { id: number | string; read: boolean; ref: string; target: string; title: string; text: string; when: string }
export function NotesPage({ f, rows, unread, total }: { f: string; rows: NoteRow[]; unread: number; total: number }) {
  const tabs: [string, string, number][] = [['all', 'All', total], ['unread', 'Unread', unread], ['read', 'Read', total - unread]];
  return <div class="notes-page"><div class="np-head"><h1>{I('bell')}{SP}Notifications</h1><div class="np-tools"><button class="btn small" id="npcheck">Check now</button><button class="btn small" id="npreadall" disabled={!unread}>Mark all as read</button><button class="btn small ghost" id="npclear" disabled={!total}>Clear all</button></div></div>{'\n  '}
    <div class="np-tabs">{tabs.map(([k, l, c]) => <button class={f === k ? 'sel' : ''} data-nf={k}>{l}<span>{c}</span></button>)}</div>{'\n  '}
    <div class="np-list">{rows.length ? rows.map((n) => <div class={`np-row ${n.read ? '' : 'new'}`}><button class="np-dot" data-nread={n.id} title={n.read ? 'Mark as unread' : 'Mark as read'}></button>{'\n    '}
      <a class="np-main" data-open={n.ref} data-target={n.target} data-note={n.id}><b>{n.title}</b><span>{n.text}</span><i>{n.ref} · {n.when}</i></a>{'\n    '}
      <button class="np-act" data-nread={n.id}>{n.read ? 'Mark unread' : 'Mark read'}</button><button class="np-act del" data-ndel={n.id} title="Delete">{I('x')}</button></div>)
      : <div class="note-empty np-empty">{f === 'unread' ? 'You are all caught up.' : f === 'read' ? 'Nothing read yet.' : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}</div>}</div></div>;
}
export const notesPageHtml = (p: Parameters<typeof NotesPage>[0]) => html(<NotesPage {...p} />);

export interface NpMetaProps {
  rows: { k: NpListKey; name: string; chips: string[]; free: string[] }[];
  milestones: { number: number; title: string; on: boolean }[]; issues: string;
}
export function NpMeta(p: NpMetaProps) {
  return <div class="np-box np-metas" id="npmeta">{p.rows.map((r) => <div class="np-meta"><label class="np-l">{r.name}</label><div class="np-chips">{r.chips.map((x) => <span class="np-chip" data-npdel={r.k} data-v={x} title="Remove">{x} ×</span>)}{r.free.length ? <select class="sel np-add" data-npadd={r.k}><option value="">{`Add ${r.name.toLowerCase()}…`}</option>{r.free.map((x) => <option>{x}</option>)}</select> : ''}</div></div>)}{'\n    '}
    <div class="np-meta"><label class="np-l">Milestone</label><select class="sel" id="npmile"><option value="">None</option>{p.milestones.map((x) => <option value={x.number} selected={x.on}>{x.title}</option>)}</select></div>{'\n    '}
    <div class="np-meta"><label class="np-l">Linked issues <i>closed when this merges</i></label><input class="input" id="npissues" placeholder="e.g. 12, 15" value={p.issues} /></div></div>;
}
export const npMetaHtml = (p: NpMetaProps) => html(<NpMeta {...p} />);

export interface NewPrProps {
  hasRepos: boolean; repo: string; base: string; head: string; hasBranches: boolean; same: boolean;
  cmp: { kind: 'none' | 'loading' | 'err' | 'ok' | 'same'; text: string; ahead: number; files: number; behind: number };
  title: string; tpls: Template[] | null; tplText: string; draftBox: string; isDraft: boolean; err: string; ready: boolean; meta: string;
}
export function NewPr(p: NewPrProps) {
  const c = p.cmp;
  const cmp = c.kind === 'loading' ? <span class="np-note">Comparing…</span> : c.kind === 'none' ? '' : c.kind === 'err' ? <span class="np-note err">{c.text}</span>
    : c.kind === 'ok' ? <span class="np-note ok">{I('git-commit')}{SP}{c.ahead} commit{c.ahead === 1 ? '' : 's'} · {c.files} file{c.files === 1 ? '' : 's'} changed{c.behind ? ` · ${c.behind} behind ${p.base}` : ''}</span> : <span class="np-note err">These branches are identical — there is nothing to compare.</span>;
  const t = p.tpls;
  return <div class="notes-page np-new"><div class="np-head"><h1>{I('git-pull-request')}{SP}New pull request</h1></div>{'\n  '}
    <div class="np-card"><div class="np-main-col">{'\n    '}
      <div class="np-box"><label class="np-l">Repository</label>{p.hasRepos ? <button type="button" class="sel bp-btn" id="nprepo"><span>{p.repo || 'Choose a repository'}</span>{I('chevron-down', 14)}</button> : <input class="input" id="nprepoin" placeholder="owner/repo" value={p.repo} />}{'\n    '}
        <div class="np-branches"><div><label class="np-l">Base <i>merge into</i></label><button type="button" class="sel bp-btn" id="npbase" data-bp="base" disabled={!p.hasBranches}><span>{p.hasBranches ? p.base || 'Choose a branch' : 'Loading…'}</span>{I('chevron-down', 14)}</button></div>{'\n      '}
          <button class="tb-btn" id="npswap" title="Swap base and head">⇄</button>{'\n      '}
          <div><label class="np-l">Head <i>changes from</i></label><button type="button" class="sel bp-btn" id="nphead" data-bp="head" disabled={!p.hasBranches}><span>{p.hasBranches ? p.head || 'Choose a branch' : 'Loading…'}</span>{I('chevron-down', 14)}</button></div></div>{'\n    '}
        <div class="np-cmp">{p.same ? <span class="np-note err">Base and head are the same branch.</span> : cmp}</div></div>{'\n    '}
      <div class="np-box"><label class="np-l">Title</label><input class="input" id="nptitle" placeholder="Title" value={p.title} /></div>{'\n    '}
      <div class="np-box"><label class="np-l">Description</label>{t && t.length > 1 ? <select class="sel np-tpl" id="nptpl"><option value="">No template</option>{t.map((x, i) => <option value={i} selected={x.body === p.tplText}>Template: {x.name}</option>)}</select> : ''}{Raw(p.draftBox)}</div>{'\n    '}
      <div class="np-box"><label class="np-check"><input type="checkbox" id="npdraft" checked={p.isDraft} /> Create as draft <span>(not ready for review yet)</span></label>{'\n    '}
        {p.err ? <div class="act-err">{p.err}</div> : ''}{'\n    '}
        <div class="np-btns"><button class="btn" id="npcancel">Cancel</button><button class="btn primary" id="npcreate" disabled={!p.ready}>{p.isDraft ? 'Create draft pull request' : 'Create pull request'}</button></div></div>{'\n  '}
    </div><div class="np-side-col">{Raw(p.meta)}</div></div></div>;
}
export const newPrHtml = (p: NewPrProps) => html(<NewPr {...p} />);

export interface IbRow { ref: string; avatar: string; title: string; sub: string; fresh: boolean; comments: number }
export interface InboxProps { loading: boolean; err: string; secs: { title: string; sub: string; rows: IbRow[] }[] | null }
export function InboxPage({ loading, err, secs }: InboxProps) {
  const body: ComponentChildren = err ? <div class="diff-empty err">{err}</div> : !secs ? <div class="skel"><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>
    : secs.map((s) => <section class="ib-sec"><h2>{s.title}<span>{s.rows.length}</span></h2><p>{s.sub}</p>{s.rows.length ? s.rows.map((r) => <a class="ib-row" data-open={r.ref}><img src={r.avatar} alt="" /><span class="ib-t"><b>{r.title}</b><i>{r.sub}</i></span>{r.fresh ? <span class="ib-new">New activity</span> : ''}{r.comments ? <span class="ib-c">{I('comment')}{SP}{r.comments}</span> : ''}</a>) : <div class="ib-none">Nothing here. Nice.</div>}</section>);
  return <div class="notes-page"><div class="np-head"><h1>{I('checklist')}{SP}Inbox</h1><div class="np-tools"><button class="btn small" id="ibrefresh" disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></div></div>{body}</div>;
}
export const inboxPageHtml = (p: InboxProps) => html(<InboxPage {...p} />);

export const skeletonHtml = () => html(<div class="skel" aria-busy="true"><div class="sk sk-crumb"></div><div class="sk sk-title"></div><div class="sk sk-pill"></div><div class="sk sk-line w60"></div><div class="sk-tabs"><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>{[0, 1, 2].map((i) => <div class="sk-row" style={`--i:${i}`}><div class="sk sk-av"></div><div class="sk-card"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div></div>)}</div>);

export interface PrLayoutProps { header: string; body: string; side: { kind: 'none' } | { kind: 'rail'; ic: string } | { kind: 'aside'; x: string; inner: string } }
export const splitPageHtml = (header: string, split: string) => html(<div class="pr-page is-split">{Raw(header)}{Raw(split)}</div>);
export function prPageHtml(p: PrLayoutProps) {
  const s = p.side;
  return html(<div class="pr-page">{Raw(p.header)}<div class="pr-layout"><main class="pr-main">{Raw(p.body)}</main>{s.kind === 'rail' ? <button class="pane-rail side-rail" data-show="side" title="Show details">{Raw(s.ic)}<span>Details</span></button> : s.kind === 'aside' ? <aside class="pr-side"><div class="side-top"><span>Details</span><button class="fold-btn" data-hide="side" title="Hide this panel">{Raw(s.x)}</button></div>{Raw(s.inner)}</aside> : ''}</div></div>);
}

export const gateHtmlStr = (alertIc: string, err: string) => html(<div class="gate"><div class="gate-card"><img src="logo.png" alt="" width={72} height={72} /><h1>Sign in to Pullscope</h1>{'\n  '}
  <p class="gate-err">{Raw(alertIc)}{SP}No GitHub sign-in or token was found.</p>{'\n  '}
  <p>Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing.</p>{'\n  '}
  {err ? <p class="gate-err">{err}</p> : ''}{'\n  '}
  <div class="btns" style="justify-content:center"><button class="btn primary" id="gatego">Sign in with GitHub</button><button class="btn" id="gatetok">Use a token instead</button></div>{'\n  '}
  <small>Tip: running <code>gh auth login</code> in a terminal also works.</small></div></div>);
