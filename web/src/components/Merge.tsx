import type { ComponentChildren } from 'preact';
import type { Person } from '../types';
import { html, Raw } from './html';
import { Av, I, SP, When } from './ui';

export function MergedBox({ head }: { head: string }) {
  return <div class="TL"><div class="TLI-break" style="margin-left:0"></div><div class="merge-box"><div class="badge"><span class="state-merged" style="background:var(--bgColor-done-emphasis)">{I('git-merge')}</span></div><div class="merge-card merged-card"><div class="row"><div><h3>Pull request successfully merged and closed</h3><p style="font-size:14px;margin-top:4px">You're all set — the <span class="branch">{head}</span> branch can be safely deleted.</p></div></div></div></div></div>;
}
export const mergedBoxHtml = (head: string) => html(<MergedBox head={head} />);

export function ClosedBox({ head }: { head: string }) {
  return <div class="merge-box"><div class="badge"><span class="state-closed" style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))">{I('git-pull-request-closed')}</span></div><div class="merge-card"><div class="row"><div><h3>Closed with unmerged commits</h3><p style="font-size:14px;margin-top:4px">This pull request is closed, but the <span class="branch">{head}</span> branch has unmerged commits.</p></div></div></div></div>;
}
export const closedBoxHtml = (head: string) => html(<ClosedBox head={head} />);

export interface CkItem { st: string; url?: string; icon: string; name: string; req: string; desc: string }
export interface CkGroup { k: string; title: string; open: boolean; items: CkItem[] }
export interface MergeBoxProps {
  draft: boolean; busyReady: boolean; errReady: string;
  rv: { h: string[]; open: boolean; ap: number; cr: number; pend: number; pendNames: string };
  ck: { h: string[]; open: boolean; rerunable: boolean; groups: CkGroup[] } | null;
  behind: boolean; busyUpdate: boolean; baseRef: string; errUpdate: string;
  clean: boolean;
}

const plural = (n: number) => (n === 1 ? '' : 's');

function Sec({ k, h, rerunable, open, children }: { k: string; h: string[]; rerunable?: boolean; open: boolean; children: ComponentChildren }) {
  return <div class="mb-sec"><button class={`mb-h ${h[0]}`} data-mb={k}><span class="mb-ic">{I(h[1], 22)}</span><span class="mb-t"><b>{h[2]}</b><i>{h[3] || ''}</i></span>{k === 'ck' && rerunable ? <span class="btn small" id="rerunck" role="button">Re-run failed</span> : ''}{I(open ? 'chevron-up' : 'chevron-down', 16)}</button>{open && children ? <div class="mb-body">{children}</div> : ''}</div>;
}

function CkGroupView({ g }: { g: CkGroup }) {
  return <><button class="mb-grp" data-mb={`g${g.k}`}>{g.title}{SP}{I(g.open ? 'chevron-up' : 'chevron-down', 12)}</button>{g.open ? g.items.map((c) => <a class={`mb-ck ${c.st}`} href={c.url || undefined}>{I(c.icon, 14)}<b>{c.name}</b>{Raw(c.req)}<i>{c.desc}</i></a>) : ''}</>;
}

export function MergeBox(p: MergeBoxProps) {
  const { rv, ck } = p;
  const rvBody = <><div class="mb-line">{I('check', 14)}{SP}{rv.ap} approval{plural(rv.ap)}</div>{rv.cr ? <div class="mb-line bad">{I('x-circle-fill', 14)}{SP}{rv.cr} requested changes</div> : ''}<div class="mb-line">{I('person', 14)}{SP}{rv.pend} pending review{plural(rv.pend)}{rv.pend ? `: ${rv.pendNames}` : ''}</div></>;
  return <div class="merge-box"><div class="badge"><span style="background:var(--bgColor-success-emphasis)">{I('git-pull-request')}</span></div><div class="merge-card mb-card">
    {p.draft ? <><div class="mb-sec"><div class="mb-h"><span class="mb-ic">{I('git-pull-request-draft', 22)}</span><span class="mb-t"><b>This pull request is still a work in progress</b><i>Draft pull requests cannot be merged.</i></span><button class="btn primary" id="doready">{p.busyReady ? 'Updating…' : 'Ready for review'}</button></div></div>{Raw(p.errReady)}</> : ''}
    <Sec k="rv" h={rv.h} open={rv.open}>{rvBody}</Sec>
    {ck ? <Sec k="ck" h={ck.h} rerunable={ck.rerunable} open={ck.open}>{ck.groups.map((g) => <CkGroupView g={g} />)}</Sec> : ''}
    {p.behind ? <div class="mb-sec mb-warn"><div class="mb-h"><span class="mb-ic">{I('alert', 22)}</span><span class="mb-t"><b>This branch is out-of-date with the base branch</b><i>Merge the latest changes from {p.baseRef} into this branch.</i></span><button class="btn" id="updbranch">{p.busyUpdate ? 'Updating…' : 'Update branch'}</button></div></div> : ''}
    <div class="mb-sec"><div class={`mb-h ${p.clean ? 'ok' : 'bad'}`}><span class="mb-ic">{I(p.clean ? 'check-circle-fill' : 'alert', 22)}</span><span class="mb-t"><b>{p.clean ? 'This branch has no conflicts with the base branch' : 'This branch has conflicts that must be resolved'}</b><i>{p.clean ? 'Merging can be performed automatically.' : 'Use the web editor or the command line to resolve conflicts.'}</i></span></div></div>{Raw(p.errUpdate)}</div></div>;
}
export const mergeBoxHtml = (p: MergeBoxProps) => html(<MergeBox {...p} />);

export interface RvRow { u: Person; st: string; prev?: string; canRe: boolean }
export interface PrSideProps {
  reviewers: RvRow[]; showAll: boolean;
  assignees: Person[]; labels: { name: string; color: string }[];
  milestone: { title: string; html_url?: string } | null;
  people: Person[]; peopleCount: number;
  fold: { reviewers: string; assignees: string; labels: string; milestone: string; people: string };
  foldBtn: { reviewers: string; assignees: string; labels: string; milestone: string; people: string };
}

function ReviewerRow({ r }: { r: RvRow }) {
  const ic = r.st === 'req' && r.prev
    ? <><span title="Asked to review again" style="margin-right:6px">{I('sync')}</span>{I(r.prev === 'approved' ? 'check' : r.prev === 'changes_requested' ? 'file-diff' : 'comment')}</>
    : I(r.st === 'approved' ? 'check' : r.st === 'changes_requested' ? 'file-diff' : r.st === 'req' ? 'dot-fill' : 'comment');
  return <div class="reviewer"><a href={r.u.html_url}>{Av(r.u, 20)}</a><a class="nm" href={r.u.html_url}>{r.u.login}</a><span class={`st ${r.st === 'approved' ? 'ok' : r.st === 'changes_requested' ? 'bad' : ''}`}>{ic}</span>{r.canRe ? <button class="rerequest" data-rerequest={r.u.login} title={`Ask ${r.u.login} to review again`}>{I('sync')}</button> : ''}</div>;
}

export function PrSide(p: PrSideProps) {
  const rv = p.reviewers, more = rv.length - 3;
  const rvSection = rv.length
    ? <>{rv.slice(0, 3).map((r) => <ReviewerRow r={r} />)}{more > 0 ? <><button class="sb-toggle" id="rvtoggle"><span>+{more} more reviewer{plural(more)}</span>{I(p.showAll ? 'chevron-up' : 'chevron-down')}</button>{p.showAll ? rv.slice(3).map((r) => <ReviewerRow r={r} />) : ''}</> : ''}</>
    : <div class="sb-none">No reviews</div>;
  const head = (t: string, fb: string) => <div class="sb-head">{Raw(fb)}<span>{t}</span>{I('gear', 16, 'gear')}</div>;
  return <div class="pr-side-inner">
    <div class={`sb-item${p.fold.reviewers}`}><div class="sb-head">{Raw(p.foldBtn.reviewers)}<span>Reviewers</span></div>{rvSection}</div>{'\n  '}
    <div class={`sb-item${p.fold.assignees}`}>{head('Assignees', p.foldBtn.assignees)}{p.assignees.length ? p.assignees.map((u) => <div class="reviewer"><a href={u.html_url}>{Av(u, 20)}</a><a class="nm" href={u.html_url}>{u.login}</a></div>) : <span class="sb-none">No one—</span>}</div>{'\n  '}
    <div class={`sb-item${p.fold.labels}`}>{head('Labels', p.foldBtn.labels)}{p.labels.length ? p.labels.map((l) => <span class="pill-label" style={`background:#${l.color}33;color:#${l.color};border-color:#${l.color}`}>{l.name}</span>) : <span class="sb-none">None yet</span>}</div>{'\n  '}
    <div class={`sb-item${p.fold.milestone}`}>{head('Milestone', p.foldBtn.milestone)}{p.milestone ? <a class="sb-link" href={p.milestone.html_url}>{p.milestone.title}</a> : <span class="sb-none">No milestone</span>}</div>{'\n  '}
    <div class={`sb-item${p.fold.people}`}><div class="sb-head">{Raw(p.foldBtn.people)}<span>{p.peopleCount} participant{plural(p.peopleCount)}</span></div><div class="participants">{p.people.map((u) => <a href={u.html_url} title={u.login}>{Av(u, 32)}</a>)}</div></div></div>;
}
export const prSideHtml = (p: PrSideProps) => html(<PrSide {...p} />);

export interface CpRow { i: number; on: boolean; title: string; by: string; when: string; sha: string }
export interface CommitsDialogProps {
  rows: CpRow[]; count: number; allOn: boolean;
  since: { on: boolean; n: number } | null;
  filter: string; q: string; selLabel: string; hasPick: boolean;
}
export function CommitsDialog(p: CommitsDialogProps) {
  return <div class="dlg-bg" id="dlgbg"><div class="dlg cp-dlg"><div class="cp-h"><h2>Select commits to view</h2><button class="icon-btn" id="cpx" title="Close">{I('x')}</button></div>
    <button class={`cp-opt${p.allOn ? ' on' : ''}`} id="cpall"><b>All commits</b><i>{p.count} commit{plural(p.count)}</i></button>
    {p.since ? <button class={`cp-opt${p.since.on ? ' on' : ''}`} id="cpsince" disabled={!p.since.n}><b>Changes since your last review</b><i>{p.since.n ? `${p.since.n} commit${plural(p.since.n)}` : 'No new commits'}</i></button> : ''}
    <div class="cp-sub">Select a commit, or click a second one to view the range between them</div>
    <input class="input cp-q" id="cpq" placeholder="Filter commits…" value={p.filter} />
    <div class="cp-list" id="cplist" data-q={p.q}>{p.rows.map((r) => <label class={`cp-row${r.on ? ' on' : ''}`} data-cp={r.i}><input type="checkbox" checked={r.on} tabindex={-1} /><span class="cp-t"><b>{r.title}</b><i>{r.by} committed {Raw(r.when)}</i></span><code>{r.sha}</code></label>).reverse()}</div>
    <div class="btns"><span class="cp-sel">{p.selLabel}</span><span class="sp"></span><button class="btn" id="cpcancel">Cancel</button><button class="btn primary" id="cpsave" disabled={!p.hasPick}>Save</button></div></div></div>;
}
export const commitsDialogHtml = (p: CommitsDialogProps) => html(<CommitsDialog {...p} />);

export interface FcBarProps { label: string; count: number | null; code: string | null; nav: { prevOff: boolean; nextOff: boolean } | null; title: string | null; hasRange: boolean }
export function FcBar(p: FcBarProps) {
  return <div class="fc-bar"><button class="btn small" id="fcbtn" title="Choose which commits to view">{I('git-commit')}{SP}{p.label}{p.count !== null ? <>{SP}<span class="counter">{p.count}</span></> : ''}{p.code ? <>{SP}<code>{p.code}</code></> : ''}{SP}▾</button>{p.nav ? <div class="seg-ctl"><button data-fstep="-1" disabled={p.nav.prevOff}>‹ Prev</button><button data-fstep="1" disabled={p.nav.nextOff}>Next ›</button></div> : ''}{p.hasRange ? <><span class="fc-t">{p.title}</span><button class="link-btn" id="fcall">Show all commits</button></> : ''}</div>;
}
export const fcBarHtml = (p: FcBarProps) => html(<FcBar {...p} />);

export interface FilesBarProps { mode: string; sort: string; pending: number; allFolded: boolean; names: string }
const SORTS: [string, string][] = [['path', 'GitHub order'], ['pathz', 'Path Z–A'], ['most', 'Most changed'], ['least', 'Least changed'], ['comments', 'Most comments'], ['status', 'By status']];
export function FilesBar(p: FilesBarProps) {
  return <div class="files-bar"><div class="seg-ctl"><button class={p.mode === 'unified' ? 'on' : ''} data-dmode="unified">Unified</button><button class={p.mode === 'split' ? 'on' : ''} data-dmode="split">Split</button></div><select class="input fsort" id="fsort" title="Sort files">{SORTS.map(([v, t]) => <option value={v} selected={p.sort === v}>{t}</option>)}</select>{p.pending ? <button class="btn small primary" id="finishrev">Finish review · {p.pending} comment{plural(p.pending)}</button> : ''}<button class="link-btn" data-foldall={p.allFolded ? 'open' : 'close'} data-files={p.names}>{p.allFolded ? 'Expand all files' : 'Collapse all files'}</button></div>;
}
export const filesBarHtml = (p: FilesBarProps) => html(<FilesBar {...p} />);

export interface FileHeadProps { name: string; folded: string; closed: boolean; add: number; del: number; sq: string[]; body: string }
export function FileBox(p: FileHeadProps) {
  return <div class={`file${p.folded}`}><div class="file-head" data-fold={`f:${p.name}`}><span class="tgl">{I(p.closed ? 'chevron-right' : 'chevron-down')}</span><span class="stat"><span class="a">+{p.add}</span>{SP}<span class="d">−{p.del}</span></span><span class="sq">{p.sq.map((c) => <i class={c}></i>)}</span><span class="path">{p.name}</span></div>{Raw(p.body)}</div>;
}
export const fileBoxHtml = (p: FileHeadProps) => html(<FileBox {...p} />);

export function CommitsList({ rows }: { rows: string[] }) {
  return <div style="border:1px solid var(--borderColor-default);border-radius:6px">{rows.length ? rows.map((r) => <div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">{Raw(r)}</div>) : <div class="diff-empty">No commits listed.</div>}</div>;
}
export const commitsListHtml = (rows: string[]) => html(<CommitsList rows={rows} />);

export interface CmRow { sha: string; on: boolean; avatar: string; initial: string; title: string; sub: string; n: number }
function CmItem({ c }: { c: CmRow }) {
  return <div class={`cm ${c.on ? 'on' : ''}`} data-sha={c.sha}><span class="cm-av">{c.avatar ? Raw(c.avatar) : <i>{c.initial}</i>}</span><span class="cm-t"><b>{c.title}</b><i>{c.sub}</i></span>{c.n ? <span class="cm-n">{I('comment')}{c.n}</span> : ''}<code>{c.sha.slice(0, 7)}</code></div>;
}
export interface SplitProps {
  hl: boolean; hr: boolean; flip: boolean; lw: number;
  allOn: boolean; allSub: string; rows: CmRow[]; count: number; subTitle: string;
  foldList: string; foldDiff: string; foldBtnList: string; foldBtnDiff: string;
  diff: string; right: string;
}
function Rail({ k, label, ic }: { k: string; label: string; ic: string }) {
  return <button class="pane-rail" data-show={k} title={`Show ${label}`}>{I(ic)}<span>{label}</span></button>;
}
export function SplitView(p: SplitProps) {
  const left = p.hl ? <Rail k="l" label="Commits" ic="git-commit" /> : <section class="pane pane-l"><div class={`fold-sec${p.foldList}`}><div class="pane-h">{I('git-commit')}<span>Commits</span><span class="counter">{p.count}</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip="" title="Swap sides (F)">⇄</button>{Raw(p.foldBtnList)}<button class="fold-btn" data-hide="l" title="Hide this panel">{I('x')}</button></div><div class="cm-list"><div class={`cm all ${p.allOn ? 'on' : ''}`} data-sha=""><span class="cm-av"><i>{I('diff')}</i></span><span class="cm-t"><b>All changes</b><i>{p.allSub}</i></span></div>{p.rows.map((c) => <CmItem c={c} />)}</div></div><div class={`fold-sec${p.foldDiff}`}><div class="pane-h sub">{I('file-diff')}<span>{p.subTitle}</span><span class="sp"></span>{Raw(p.foldBtnDiff)}</div><div class="pane-body">{Raw(p.diff)}</div></div></section>;
  const right = p.hr ? <Rail k="r" label="Conversation" ic="comment-discussion" /> : <section class="pane pane-r"><div class="pane-h">{I('comment-discussion')}<span>Conversation</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip="" title="Swap sides (F)">⇄</button><button class="fold-btn" data-hide="r" title="Hide this panel">{I('x')}</button></div><div class="pane-body">{Raw(p.right)}</div></section>;
  return <div class={`split ${p.hl ? 'hl' : ''} ${p.hr ? 'hr' : ''} ${p.flip ? 'flip' : ''}`} style={`--lw:${p.lw}%`}>{left}{p.hl || p.hr ? '' : <div class="gutter" id="gutter" title="Drag to resize"></div>}{right}</div>;
}
export const splitViewHtml = (p: SplitProps) => html(<SplitView {...p} />);
