import type { ComponentChildren } from 'preact';
import type { Person } from '../types';
import { ErrLine } from './Actions';
import { FoldBtn } from './Comments';
import { useReveal, useScroller } from './req';
import type { FoldFn } from './Comments';
import { Av, I, SP } from './ui';
import { arrange, roCls } from '../app/reorder';

export function MergedBox({ head }: { head: string }) {
  return <div class="TL"><div class="TLI-break" style="margin-left:0"></div><div class="merge-box"><div class="badge"><span class="state-merged" style="background:var(--bgColor-done-emphasis)">{I('git-merge')}</span></div><div class="merge-card merged-card"><div class="row"><div><h3>Pull request successfully merged and closed</h3><p style="font-size:14px;margin-top:4px">You're all set — the <span class="branch">{head}</span> branch can be safely deleted.</p></div></div></div></div></div>;
}

export function ClosedBox({ head }: { head: string }) {
  return <div class="merge-box"><div class="badge"><span class="state-closed" style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))">{I('git-pull-request-closed')}</span></div><div class="merge-card"><div class="row"><div><h3>Closed with unmerged commits</h3><p style="font-size:14px;margin-top:4px">This pull request is closed, but the <span class="branch">{head}</span> branch has unmerged commits.</p></div></div></div></div>;
}

export interface CkItem { st: string; url?: string; icon: string; name: string; req: boolean; desc: string }
export interface CkGroup { k: string; title: string; open: boolean; items: CkItem[] }
export interface MergeBoxHandlers { toggle: (e: Event, k: string) => void; rerun: (e: Event) => void; update: () => void; ready: () => void }
export interface MergeBoxProps {
  draft: boolean; busyReady: boolean; errReady: string;
  rv: { h: string[]; open: boolean; ap: number; cr: number; pend: number; pendNames: string };
  ck: { h: string[]; open: boolean; rerunable: boolean; groups: CkGroup[] } | null;
  behind: boolean; busyUpdate: boolean; baseRef: string; errUpdate: string;
  clean: boolean;
}

const plural = (n: number) => (n === 1 ? '' : 's');

function Sec({ k, h, rerunable, open, children, on }: { k: string; h: string[]; rerunable?: boolean; open: boolean; children: ComponentChildren; on?: MergeBoxHandlers }) {
  return <div class="mb-sec"><button class={`mb-h ${h[0]}`} data-mb={k} onClick={on && ((e) => on.toggle(e, k))}><span class="mb-ic">{I(h[1], 22)}</span><span class="mb-t"><b>{h[2]}</b><i>{h[3] || ''}</i></span>{k === 'ck' && rerunable ? <span class="btn small" id="rerunck" role="button" onClick={on?.rerun}>Re-run failed</span> : ''}{I(open ? 'chevron-up' : 'chevron-down', 16)}</button>{open && children ? <div class="mb-body">{children}</div> : ''}</div>;
}

function CkGroupView({ g, on }: { g: CkGroup; on?: MergeBoxHandlers }) {
  return <><button class="mb-grp" data-mb={`g${g.k}`} onClick={on && ((e) => on.toggle(e, `g${g.k}`))}>{g.title}{SP}{I(g.open ? 'chevron-up' : 'chevron-down', 12)}</button>{g.open ? g.items.map((c) => <a class={`mb-ck ${c.st}`} href={c.url || undefined}>{I(c.icon, 14)}<b>{c.name}</b>{c.req ? <span class="ck-req" title="Required by branch protection">Required</span> : ''}<i>{c.desc}</i></a>) : ''}</>;
}

export function MergeBox(p: MergeBoxProps & { on?: MergeBoxHandlers }) {
  const { rv, ck, on } = p;
  const rvBody = <><div class="mb-line">{I('check', 14)}{SP}{rv.ap} approval{plural(rv.ap)}</div>{rv.cr ? <div class="mb-line bad">{I('x-circle-fill', 14)}{SP}{rv.cr} requested changes</div> : ''}<div class="mb-line">{I('person', 14)}{SP}{rv.pend} pending review{plural(rv.pend)}{rv.pend ? `: ${rv.pendNames}` : ''}</div></>;
  return <div class="merge-box"><div class="badge"><span style="background:var(--bgColor-success-emphasis)">{I('git-pull-request')}</span></div><div class="merge-card mb-card">
    {p.draft ? <><div class="mb-sec"><div class="mb-h"><span class="mb-ic">{I('git-pull-request-draft', 22)}</span><span class="mb-t"><b>This pull request is still a work in progress</b><i>Draft pull requests cannot be merged.</i></span><button class="btn primary" id="doready" onClick={on?.ready}>{p.busyReady ? 'Updating…' : 'Ready for review'}</button></div></div><ErrLine m={p.errReady} /></> : ''}
    <Sec k="rv" h={rv.h} open={rv.open} on={on}>{rvBody}</Sec>
    {ck ? <Sec k="ck" h={ck.h} rerunable={ck.rerunable} open={ck.open} on={on}>{ck.groups.map((g) => <CkGroupView g={g} on={on} />)}</Sec> : ''}
    {p.behind ? <div class="mb-sec mb-warn"><div class="mb-h"><span class="mb-ic">{I('alert', 22)}</span><span class="mb-t"><b>This branch is out-of-date with the base branch</b><i>Merge the latest changes from {p.baseRef} into this branch.</i></span><button class="btn" id="updbranch" onClick={on?.update}>{p.busyUpdate ? 'Updating…' : 'Update branch'}</button></div></div> : ''}
    <div class="mb-sec"><div class={`mb-h ${p.clean ? 'ok' : 'bad'}`}><span class="mb-ic">{I(p.clean ? 'check-circle-fill' : 'alert', 22)}</span><span class="mb-t"><b>{p.clean ? 'This branch has no conflicts with the base branch' : 'This branch has conflicts that must be resolved'}</b><i>{p.clean ? 'Merging can be performed automatically.' : 'Use the web editor or the command line to resolve conflicts.'}</i></span></div></div><ErrLine m={p.errUpdate} /></div></div>;
}

export interface RvRow { u: Person; st: string; prev?: string; canRe: boolean }
export type SideKey = 'reviewers' | 'assignees' | 'labels' | 'milestone' | 'people';
export interface PrSideHandlers { fold: (k: string, def: boolean) => void; rvtoggle: () => void; rerequest: (e: MouseEvent, login: string) => void; grip: (e: MouseEvent, key: SideKey) => void; edit: (k: SideKey) => void }
export interface PrSideProps {
  reviewers: RvRow[]; showAll: boolean;
  assignees: Person[]; labels: { name: string; color: string }[];
  milestone: { title: string; html_url?: string } | null;
  people: Person[]; peopleCount: number;
  folded: Record<SideKey, boolean>;
}

function ReviewerRow({ r, on }: { r: RvRow; on: PrSideHandlers }) {
  const ic = r.st === 'req' && r.prev
    ? <><span title="Asked to review again" style="margin-right:6px">{I('sync')}</span>{I(r.prev === 'approved' ? 'check' : r.prev === 'changes_requested' ? 'file-diff' : 'comment')}</>
    : I(r.st === 'approved' ? 'check' : r.st === 'changes_requested' ? 'file-diff' : r.st === 'req' ? 'dot-fill' : 'comment');
  return <div class="reviewer"><a href={r.u.html_url}>{Av(r.u, 20)}</a><a class="nm" href={r.u.html_url}>{r.u.login}</a><span class={`st ${r.st === 'approved' ? 'ok' : r.st === 'changes_requested' ? 'bad' : ''}`}>{ic}</span>{r.canRe ? <button class="rerequest" data-rerequest={r.u.login} title={`Ask ${r.u.login} to review again`} onClick={(e) => on.rerequest(e, r.u.login ?? "")}>{I('sync')}</button> : ''}</div>;
}

export function PrSide(p: PrSideProps & { on: PrSideHandlers }) {
  const { on } = p, rv = p.reviewers, more = rv.length - 3;
  const rvSection = rv.length
    ? <>{rv.slice(0, 3).map((r) => <ReviewerRow r={r} on={on} />)}{more > 0 ? <><button class="sb-toggle" id="rvtoggle" onClick={on.rvtoggle}><span>+{more} more reviewer{plural(more)}</span>{I(p.showAll ? 'chevron-up' : 'chevron-down')}</button>{p.showAll ? rv.slice(3).map((r) => <ReviewerRow r={r} on={on} />) : ''}</> : ''}</>
    : <div class="sb-none">No reviews</div>;
  const fb = (k: SideKey, n: string) => <SideFold k={'sb:' + n} folded={p.folded[k]} onFold={on.fold} />;
  const head = (k: SideKey, t: string) => <div class="sb-head">{fb(k, t === 'people' ? 'people' : t)}<span>{t}</span><button class="gear-btn" title={`Edit ${t.toLowerCase()}`} onClick={() => on.edit(k)}>{I('gear', 16, 'gear')}</button></div>;
  const box = (k: SideKey) => `sb-item${p.folded[k] ? ' folded' : ''}`;
  const item = (k: SideKey, node: ComponentChildren) => <div class={box(k) + ' ro-it' + roCls('side', k)} data-t={k}>{node}<i class="ro-grip" title="Drag to reorder" onMouseDown={(e) => on.grip(e, k)}>⋮⋮</i></div>;
  const secs: Record<SideKey, ComponentChildren> = {
    reviewers: <><div class="sb-head">{fb('reviewers', 'Reviewers')}<span>Reviewers</span></div>{rvSection}</>,
    assignees: <>{head('assignees', 'Assignees')}{p.assignees.length ? p.assignees.map((u) => <div class="reviewer"><a href={u.html_url}>{Av(u, 20)}</a><a class="nm" href={u.html_url}>{u.login}</a></div>) : <span class="sb-none">No one—</span>}</>,
    labels: <>{head('labels', 'Labels')}{p.labels.length ? p.labels.map((l) => <span class="pill-label" style={`background:#${l.color}33;color:#${l.color};border-color:#${l.color}`}>{l.name}</span>) : <span class="sb-none">None yet</span>}</>,
    milestone: <>{head('milestone', 'Milestone')}{p.milestone ? <a class="sb-link" href={p.milestone.html_url}>{p.milestone.title}</a> : <span class="sb-none">No milestone</span>}</>,
    people: <><div class="sb-head">{fb('people', 'people')}<span>{p.peopleCount} participant{plural(p.peopleCount)}</span></div><div class="participants">{p.people.map((u) => <a href={u.html_url} title={u.login}>{Av(u, 32)}</a>)}</div></>,
  };
  return <div class="pr-side-inner">{arrange(SIDE_KEYS, 'side', (k) => k).map((k) => item(k, secs[k]))}</div>;
}
export const SIDE_KEYS: SideKey[] = ['reviewers', 'assignees', 'labels', 'milestone', 'people'];

function SideFold({ k, folded, onFold }: { k: string; folded: boolean; onFold: (k: string, def: boolean) => void }) {
  return <button ref={useReveal<HTMLButtonElement>(k)} class="fold-btn" data-fold={k} data-def="0" title="Hide section" onClick={(e) => { e.stopPropagation(); onFold(k, false); }}>{I(folded ? 'chevron-right' : 'chevron-down')}</button>;
}

export interface CpRow { i: number; on: boolean; title: string; by: string; when: string; sha: string; hidden: boolean }
export interface CommitsDialogProps {
  rows: CpRow[]; count: number; allOn: boolean;
  since: { on: boolean; n: number } | null;
  filter: string; selLabel: string; hasPick: boolean;
}
export interface CpHandlers { close: () => void; all: () => void; since: () => void; save: () => void; filter: (e: Event) => void; pick: (e: Event, i: number) => void }
export function CommitsDialog(p: CommitsDialogProps & { on?: CpHandlers }) {
  const { on } = p;
  return <div class="dlg-bg" id="dlgbg" onMouseDown={on && ((e) => { if ((e.target as HTMLElement).id === 'dlgbg') on.close(); })}><div class="dlg cp-dlg"><div class="cp-h"><h2>Select commits to view</h2><button class="icon-btn" id="cpx" title="Close" onClick={on?.close}>{I('x')}</button></div>
    <button class={`cp-opt${p.allOn ? ' on' : ''}`} id="cpall" onClick={on?.all}><b>All commits</b><i>{p.count} commit{plural(p.count)}</i></button>
    {p.since ? <button class={`cp-opt${p.since.on ? ' on' : ''}`} id="cpsince" disabled={!p.since.n} onClick={on?.since}><b>Changes since your last review</b><i>{p.since.n ? `${p.since.n} commit${plural(p.since.n)}` : 'No new commits'}</i></button> : ''}
    <div class="cp-sub">Select a commit, or click a second one to view the range between them</div>
    <input class="input cp-q" id="cpq" placeholder="Filter commits…" value={p.filter} onInput={on?.filter} />
    <div class="cp-list" id="cplist" data-q={p.filter.toLowerCase()}>{p.rows.map((r) => <label class={`cp-row${r.on ? ' on' : ''}`} data-cp={r.i} hidden={r.hidden} onClick={on && ((e) => on.pick(e, r.i))}><input type="checkbox" checked={r.on} tabindex={-1} /><span class="cp-t"><b>{r.title}</b><i>{r.by} committed {r.when}</i></span><code>{r.sha}</code></label>).reverse()}</div>
    <div class="btns"><span class="cp-sel">{p.selLabel}</span><span class="sp"></span><button class="btn" id="cpcancel" onClick={on?.close}>Cancel</button><button class="btn primary" id="cpsave" disabled={!p.hasPick} onClick={on?.save}>Save</button></div></div></div>;
}

export interface FilesHandlers { commits: () => void; all: () => void; step: (n: number) => void; mode: (m: string) => void; sort: (e: Event) => void; finish: () => void; foldAll: (open: boolean, names: string[]) => void; fold: (e: Event, k: string, def: boolean) => void }
export interface FcBarProps { label: string; count: number | null; code: string | null; nav: { prevOff: boolean; nextOff: boolean } | null; title: string | null; hasRange: boolean }
export function FcBar(p: FcBarProps & { on?: FilesHandlers }) {
  const { on } = p;
  return <div class="fc-bar"><button class="btn small" id="fcbtn" title="Choose which commits to view" onClick={on?.commits}>{I('git-commit')}{SP}{p.label}{p.count !== null ? <>{SP}<span class="counter">{p.count}</span></> : ''}{p.code ? <>{SP}<code>{p.code}</code></> : ''}{SP}▾</button>{p.nav ? <div class="seg-ctl"><button data-fstep="-1" disabled={p.nav.prevOff} onClick={on && (() => on.step(-1))}>‹ Prev</button><button data-fstep="1" disabled={p.nav.nextOff} onClick={on && (() => on.step(1))}>Next ›</button></div> : ''}{p.hasRange ? <><span class="fc-t">{p.title}</span><button class="link-btn" id="fcall" onClick={on?.all}>Show all commits</button></> : ''}</div>;
}

export interface FilesBarProps { mode: string; sort: string; pending: number; allFolded: boolean; names: string[]; viewed?: number; total?: number; onViewedAll?: () => void }
const SORTS: [string, string][] = [['path', 'GitHub order'], ['pathz', 'Path Z–A'], ['most', 'Most changed'], ['least', 'Least changed'], ['comments', 'Most comments'], ['status', 'By status']];
export function FilesBar(p: FilesBarProps & { on?: FilesHandlers }) {
  const { on } = p;
  return <div class="files-bar"><div class="seg-ctl"><button class={p.mode === 'unified' ? 'on' : ''} data-dmode="unified" onClick={on && (() => on.mode('unified'))}>Unified</button><button class={p.mode === 'split' ? 'on' : ''} data-dmode="split" onClick={on && (() => on.mode('split'))}>Split</button></div><select class="input fsort" id="fsort" title="Sort files" onChange={on?.sort}>{SORTS.map(([v, t]) => <option value={v} selected={p.sort === v}>{t}</option>)}</select>{p.total ? <button class="link-btn fv-prog" title={p.viewed === p.total ? 'Clear all viewed marks' : 'Mark every file as viewed'} onClick={p.onViewedAll}>{p.viewed}/{p.total} viewed</button> : ''}{p.pending ? <button class="btn small primary" id="finishrev" onClick={on?.finish}>Finish review · {p.pending} comment{plural(p.pending)}</button> : ''}<button class="link-btn" data-foldall={p.allFolded ? 'open' : 'close'} data-files={p.names.join('\n')} onClick={on && (() => on.foldAll(p.allFolded, p.names))}>{p.allFolded ? 'Expand all files' : 'Collapse all files'}</button></div>;
}

export interface FileHeadProps { name: string; folded: boolean; closed: boolean; add: number; del: number; sq: string[]; viewed?: boolean; onViewed?: () => void; children?: ComponentChildren }
export function FileBox(p: FileHeadProps & { on?: FilesHandlers }) {
  const { on } = p, rv = useReveal<HTMLDivElement>(`f:${p.name}`);
  return <div class={`file${p.folded ? ' folded' : ''}`}><div ref={rv} class="file-head" data-fold={`f:${p.name}`} onClick={on && ((e) => on.fold(e, `f:${p.name}`, false))}><span class="tgl">{I(p.closed ? 'chevron-right' : 'chevron-down')}</span><span class="stat"><span class="a">+{p.add}</span>{SP}<span class="d">−{p.del}</span></span><span class="sq">{p.sq.map((c) => <i class={c}></i>)}</span><span class="path">{p.name}</span>{p.onViewed ? <label class={`fv${p.viewed ? ' on' : ''}`} title="Mark this file as viewed" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={!!p.viewed} onChange={p.onViewed} /> Viewed</label> : ''}</div>{p.children}</div>;
}

export function CommitsList({ rows }: { rows: ComponentChildren[] }) {
  return <div style="border:1px solid var(--borderColor-default);border-radius:6px">{rows.length ? rows.map((r) => <div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">{r}</div>) : <div class="diff-empty">No commits listed.</div>}</div>;
}

export interface CmRow { sha: string; on: boolean; author: Person | null | undefined; initial: string; title: string; sub: string; n: number }
export interface SplitHandlers { hide: (k: string, v: boolean) => void; flip: () => void; pick: (sha: string) => void; gutter: (e: MouseEvent) => void; fold: FoldFn; scroll: (id: string, e: Event) => void }
function CmItem({ c, on }: { c: CmRow; on?: SplitHandlers }) {
  return <div class={`cm ${c.on ? 'on' : ''}`} data-sha={c.sha} onClick={on && (() => on.pick(c.sha))}><span class="cm-av">{c.author ? Av(c.author, 24) : <i>{c.initial}</i>}</span><span class="cm-t"><b>{c.title}</b><i>{c.sub}</i></span>{c.n ? <span class="cm-n">{I('comment')}{c.n}</span> : ''}<code>{c.sha.slice(0, 7)}</code></div>;
}
export interface SplitProps {
  hl: boolean; hr: boolean; flip: boolean; lw: number;
  allOn: boolean; allSub: string; rows: CmRow[]; count: number; subTitle: string;
  foldList: boolean; foldDiff: boolean;
  diff: ComponentChildren; right: ComponentChildren;
}
function Rail({ k, label, ic, on }: { k: string; label: string; ic: string; on?: SplitHandlers }) {
  return <button class="pane-rail" data-show={k} title={`Show ${label}`} onClick={on && (() => on.hide(k, false))}>{I(ic)}<span>{label}</span></button>;
}
export function SplitView(p: SplitProps & { on?: SplitHandlers }) {
  const { on } = p, pl = useScroller('l'), pr = useScroller('r');
  const left = p.hl ? <Rail k="l" label="Commits" ic="git-commit" on={on} /> : <section class="pane pane-l"><div class={`fold-sec${p.foldList ? ' folded' : ''}`}><div class="pane-h">{I('git-commit')}<span>Commits</span><span class="counter">{p.count}</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip="" title="Swap sides (F)" onClick={on?.flip}>⇄</button><FoldBtn k="cm-list" title="Collapse commit list" def={false} folded={p.foldList} onFold={on?.fold} /><button class="fold-btn" data-hide="l" title="Hide this panel" onClick={on && (() => on.hide('l', true))}>{I('x')}</button></div><div class="cm-list"><div class={`cm all ${p.allOn ? 'on' : ''}`} data-sha="" onClick={on && (() => on.pick(''))}><span class="cm-av"><i>{I('diff')}</i></span><span class="cm-t"><b>All changes</b><i>{p.allSub}</i></span></div>{p.rows.map((c) => <CmItem c={c} on={on} />)}</div></div><div class={`fold-sec${p.foldDiff ? ' folded' : ''}`}><div class="pane-h sub">{I('file-diff')}<span>{p.subTitle}</span><span class="sp"></span><FoldBtn k="cm-diff" title="Collapse changes" def={false} folded={p.foldDiff} onFold={on?.fold} /></div><div class="pane-body" ref={pl} onScroll={on && ((e) => on.scroll('l', e))}>{p.diff}</div></div></section>;
  const right = p.hr ? <Rail k="r" label="Conversation" ic="comment-discussion" on={on} /> : <section class="pane pane-r"><div class="pane-h">{I('comment-discussion')}<span>Conversation</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip="" title="Swap sides (F)" onClick={on?.flip}>⇄</button><button class="fold-btn" data-hide="r" title="Hide this panel" onClick={on && (() => on.hide('r', true))}>{I('x')}</button></div><div class="pane-body" ref={pr} onScroll={on && ((e) => on.scroll('r', e))}>{p.right}</div></section>;
  return <div class={`split ${p.hl ? 'hl' : ''} ${p.hr ? 'hr' : ''} ${p.flip ? 'flip' : ''}`}>{left}{p.hl || p.hr ? '' : <div class="gutter" id="gutter" title="Drag to resize" onMouseDown={on?.gutter}></div>}{right}</div>;
}
