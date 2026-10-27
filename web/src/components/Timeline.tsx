import type { Person, Verification } from '../types';
import { html, Raw } from './html';
import { when } from '../app/core';
import { Av, I, SP } from './ui';

export interface CommitRowProps { first: string; sha: string; author: Person | null; url: string; verification: Verification | undefined; trailing: string }
export function CommitRow({ first, sha, author, url, verification, trailing }: CommitRowProps) {
  const unv = verification && !verification.verified;
  return <div class="commit-row">{author ? <span class="TLI-avatar" style="margin-right:8px">{Av(author, 20)}</span> : ''}<span class="msg" style="flex:0 1 auto"><a href={url || '#'}>{first}</a></span>{Raw(trailing)}<span class="cm-ic">{I('comment')}</span><span style="flex:1"></span>{verification ? <span class={`label-pill ${unv ? 'warn' : 'ok'}`}>{unv ? 'Unverified' : 'Verified'}</span> : ''}<a class="sha" href={url || '#'}>{String(sha).slice(0, 7)}</a></div>;
}
export const commitRowHtml = (p: CommitRowProps) => html(<CommitRow {...p} />);

export interface RangeBarProps { range: string; from: string; to: string; desc: boolean }
export function RangeBar({ range, from, to, desc }: RangeBarProps) {
  const opts = [['all', 'Any time'], ['1h', 'Last hour'], ['24h', 'Last 24 hours'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['custom', 'Custom range…']];
  return <div class="date-bar"><span class="who-l">{I('clock')}When</span><select class="sel" id="crange" title="Only show activity from this period">{opts.map(([v, l]) => <option value={v} selected={range === v}>{l}</option>)}</select>{range === 'custom' ? <><input type="date" class="input" id="cfrom" value={from} title="From" /><span class="who-l">to</span><input type="date" class="input" id="cto" value={to} title="To" /></> : ''}<span class="sp"></span><button class="who-chip" id="csort" title="Flip the order of the timeline">{I(desc ? 'chevron-down' : 'chevron-up')}<span>{desc ? 'Newest first' : 'Oldest first'}</span></button></div>;
}

export interface WhoBarProps { everyone: boolean; people: { u: Person; n: number; on: boolean }[] }
export function WhoBar({ everyone, people }: WhoBarProps) {
  return <div class="who-bar"><span class="who-l">{I('person')}Show</span><button class={`who-chip ${everyone ? 'on' : ''}`} data-whoclear="1">Everyone</button>{people.map(({ u, n, on }) => <button class={`who-chip ${on ? 'on' : ''}`} data-who={u.login} title={`${n} comment${n === 1 ? '' : 's'}`}>{Av(u, 18)}<span>{u.login}</span><i>{n}</i></button>)}</div>;
}
export const barsHtml = (who: WhoBarProps | null, range: RangeBarProps) => html(<>{who && <WhoBar {...who} />}<RangeBar {...range} /></>);

export function FoldBar() {
  return <div class="fold-bar"><button class="btn small" id="foldallconv" title="Collapse or expand every comment, review and thread">{I('chevron-down')}{SP}<span>Collapse all conversations</span></button></div>;
}

export interface TlWrapProps { bars: string; rows: string; empty: string; tail: string }
export function TlWrap({ bars, rows, empty, tail }: TlWrapProps) {
  return <>{Raw(bars)}<FoldBar /><div class="TL">{Raw(rows)}{empty ? <div class="diff-empty">{empty}</div> : ''}</div>{Raw(tail)}</>;
}
export const tlWrapHtml = (p: TlWrapProps) => html(<TlWrap {...p} />);

const Time = ({ at }: { at: string }) => <a class="time">{Raw(when(at).replace(/<\/?span[^>]*>/g, ''))}</a>;
const actor = (u?: Person | null) => (u ? <a class="actor" href={u.html_url}>{u.login}</a> : <span class="actor">ghost</span>);

export function CommitRun({ n, first, last }: { n: number; first: string; last: string }) {
  return <div class="TLI"><div class="TLI-badge">{I('git-commit')}</div><div class="TLI-body"><div class="row"><a data-tab="commits" class="run"><b>{n} commits</b>{SP}<span class="mono">{first} … {last}</span> · view in Commits</a></div></div></div>;
}
export const commitRunHtml = (p: Parameters<typeof CommitRun>[0]) => html(<CommitRun {...p} />);

export function Committed({ row }: { row: string }) {
  return <div class="TLI"><div class="TLI-badge">{I('git-commit')}</div><div class="TLI-body">{Raw(row)}</div></div>;
}
export const committedHtml = (row: string) => html(<Committed row={row} />);

export interface ReferencedProps { actor: Person | null | undefined; at: string; commit: { author?: Person | null; html_url: string; sha: string } | null; linked: string }
export function Referenced({ actor: a, at, commit: ci, linked }: ReferencedProps) {
  return <div class="TLI"><div class="TLI-badge">{I('cross-reference')}</div><div class="TLI-body stack"><div class="row" style="min-height:32px">{actor(a)}{SP}<span>added a commit that referenced this pull request</span>{SP}<Time at={at} /></div>{ci ? <div class="line2"><div class="commit-row"><span class="TLI-avatar" style="margin:0 8px 0 0">{Av(ci.author || a, 20)}</span><span class="msg" style="flex:0 1 auto"><a href={ci.html_url}>{Raw(linked)}</a></span><span class="mono" style="background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px">…</span><span class="cm-ic">{I('comment')}</span><span style="flex:1"></span><a class="sha" href={ci.html_url}>{ci.sha.slice(0, 7)}</a></div></div> : ''}</div></div>;
}
export const referencedHtml = (p: ReferencedProps) => html(<Referenced {...p} />);

export function MergedRow({ actor: a, commit, base, at }: { actor: Person | null | undefined; commit: string; base: string; at: string }) {
  return <div class="TLI mergedrow"><div class="TLI-badge done">{I('git-merge')}</div><div class="TLI-avatar">{Av(a, 20)}</div><div class="TLI-body"><div class="row">{actor(a)}{SP}<span>merged commit <b class="mono" style="color:var(--fgColor-default);font-size:12px">{commit}</b> into <span class="branch">{base}</span></span>{SP}<Time at={at} /></div></div></div>;
}
export const mergedRowHtml = (p: Parameters<typeof MergedRow>[0]) => html(<MergedRow {...p} />);

export interface CrossRefProps { actor: Person | null | undefined; at: string; isPr: boolean; open: boolean; icon: string; url: string; title: string; repo: string; number: number }
export function CrossRef(p: CrossRefProps) {
  return <div class="TLI"><div class="TLI-badge">{I('cross-reference')}</div><div class="TLI-body"><div class="row">{actor(p.actor)}{SP}<span>mentioned this {p.isPr ? 'pull request' : 'issue'}</span>{SP}<Time at={p.at} /></div>{'\n        '}
    <div class="ref-card"><span style={`color:var(--fgColor-${p.open ? 'success' : 'done'});margin-top:2px`}>{I(p.icon)}</span><div><a class="t" href={p.url} style="color:var(--fgColor-default)">{p.title}</a><span class="r">{p.repo}#{p.number}</span></div></div></div></div>;
}
export const crossRefHtml = (p: CrossRefProps) => html(<CrossRef {...p} />);

export function LabelRow({ actor: a, verb, color, name, at }: { actor: Person | null | undefined; verb: string; color: string; name: string; at: string }) {
  return <div class="TLI condensed"><div class="TLI-badge">{I('tag')}</div><div class="TLI-avatar">{Av(a, 20)}</div><div class="TLI-body">{actor(a)}{SP}<span>{verb}</span>{SP}<span class="pill-label" style={`background:#${color};color:#fff;margin:0`}>{name}</span>{SP}<span>label</span>{SP}<Time at={at} /></div></div>;
}
export const labelRowHtml = (p: Parameters<typeof LabelRow>[0]) => html(<LabelRow {...p} />);

export function Simple({ actor: a, ic, text, kind, at }: { actor: Person | null | undefined; ic: string; text: string; kind: string; at: string }) {
  return <div class="TLI"><div class={`TLI-badge ${kind}`}>{I(ic)}</div><div class="TLI-avatar">{Av(a, 20)}</div><div class="TLI-body"><div class="row">{actor(a)}{SP}<span>{Raw(text)}</span>{SP}<Time at={at} /></div></div></div>;
}
export const simpleHtml = (p: Parameters<typeof Simple>[0]) => html(<Simple {...p} />);

export interface CheckRowData { name: string; st: string; url?: string; desc: string; req: boolean; status: string; dur: string }
export interface ChecksProps { head: [string, string]; summary: string; headIcon: string; rows: (CheckRowData & { icon: string })[] }
export function Checks({ head, summary, headIcon, rows }: ChecksProps) {
  return <div class="checks"><div class={`ck-head ${head[0]}`}>{I(headIcon, 20)}<div><b>{head[1]}</b><span>{summary}</span></div></div>{rows.map((c) => (
    <a class={`ck-row ${c.st}`} href={c.url ? c.url : undefined}><span class="ck-i">{I(c.icon)}</span><span class="ck-n"><b>{c.name}</b>{c.req ? <span class="ck-req" title="Required by branch protection">Required</span> : ''}<i>{c.desc}</i></span><span class="ck-s">{c.status}</span><span class="ck-d">{c.dur}</span></a>
  ))}</div>;
}
export const checksHtml = (p: ChecksProps) => html(<Checks {...p} />);

export interface AttItem { k: string; ic: string; text: string; id?: string; title?: string; dataTab?: string }
export function Attention({ items, unres, showUnres }: { items: AttItem[]; unres: boolean; showUnres: boolean }) {
  return <div class="attn">{items.map((it) => <button class={`att-i ${it.k}`} id={it.id} title={it.title} data-tab={it.dataTab}>{I(it.ic)}<span>{it.text}</span></button>)}{showUnres ? <><span class="sp"></span><button class={`att-tog ${unres ? 'on' : ''}`} id="unres" title="Hide everything except review threads that are still open">{I('comment')}Unresolved only</button></> : ''}</div>;
}
export const attentionHtml = (p: Parameters<typeof Attention>[0]) => html(<Attention {...p} />);
