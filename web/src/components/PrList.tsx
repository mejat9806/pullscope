import type { ComponentChildren } from 'preact';
import { html, Raw } from './html';
import { I, SP } from './ui';

export interface RcRow { ref: string; on: boolean; st: string; icon: string; title: string; sub: string }
export interface SideHeadProps { repo: string; state: string; filter: string; sort: string; group: string; sorts: [string, string][]; groups: [string, string][] }

function Sel({ id, opts, v }: { id: string; opts: [string, string][]; v: string }) {
  return <select class="input sb-sel" id={id}>{opts.map(([k, t]) => <option value={k} selected={k === v}>{t}</option>)}</select>;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function SideHead(p: SideHeadProps) {
  return <><div class="sb-repo"><button class="fold-btn" data-side="repos" title="All repositories">{I('chevron-left')}</button><b title={p.repo}>{p.repo}</b></div>{'\n  '}
    <div class="seg sb-seg">{['open', 'closed', 'all'].map((s) => <button data-sps={s} class={p.state === s ? 'on' : ''}>{cap(s)}</button>)}</div>{'\n  '}
    <input class="input sb-filter" id="prfilter" placeholder="Filter by title, #, author, label…" value={p.filter} />{'\n  '}
    <div class="sb-ctl"><label>Sort<Sel id="prsort" opts={p.sorts} v={p.sort} /></label><label>Group<Sel id="prgroup" opts={p.groups} v={p.group} /></label></div></>;
}
export const sideHeadHtml = (p: SideHeadProps) => html(<SideHead {...p} />);

export function RcItem({ r }: { r: RcRow }) {
  return <a class={`rc ${r.on ? 'on' : ''}`} data-open={r.ref}><span class={`rc-i ${r.st}`}>{I(r.icon)}</span><span class="rc-t"><b>{r.title}</b><i>{r.sub}</i></span></a>;
}
export const rcListHtml = (rows: RcRow[]) => html(<>{rows.map((r) => <RcItem r={r} />)}</>);
export const sideEmptyHtml = (t: string) => html(<div class="sb-empty">{t}</div>);
export const sideCountHtml = (n: number, rows: RcRow[]) => html(<><div class="sb-count">{n} pull request{n === 1 ? '' : 's'}</div>{rows.map((r) => <RcItem r={r} />)}</>);
export const pgHtml = (groups: { key: string; folded: string; closed: boolean; name: string; rows: RcRow[] }[]) => html(<>{groups.map((g) => <div class={`pg${g.folded}`}><div class="pg-h" data-fold={g.key}>{I(g.closed ? 'chevron-right' : 'chevron-down')}<span>{g.name}</span><i>{g.rows.length}</i></div><div class="pg-b">{g.rows.map((r) => <RcItem r={r} />)}</div></div>)}</>);

export interface FilterBarProps { filter: string; authors: string[]; labels: string[]; author: string; label: string; status: string; statuses: [string, string][]; sort: string; sorts: [string, string][]; n: number; total: number; active: boolean }
function Opts({ arr, v, all }: { arr: string[]; v: string; all: string }) {
  return <><option value="">{all}</option>{arr.map((x) => <option value={x} selected={x === v}>{x}</option>)}</>;
}
export function FilterBar(p: FilterBarProps) {
  return <div class="prl-filters"><span class="pf-search">{I('search')}<input class="input" id="mainfilter" placeholder="Filter by title, #, author, branch, label…" value={p.filter} spellcheck={false} /></span>{'\n  '}
    <select class="input" id="pfauthor"><Opts arr={p.authors} v={p.author} all="Author: all" /></select>{'\n  '}
    <select class="input" id="pflabel"><Opts arr={p.labels} v={p.label} all="Label: all" /></select>{'\n  '}
    <select class="input" id="pfstatus"><option value="">Status: any</option>{p.statuses.map(([k, t]) => <option value={k} selected={k === p.status}>{t}</option>)}</select>{'\n  '}
    <select class="input" id="pfsort">{p.sorts.map(([k, t]) => <option value={k} selected={k === p.sort}>Sort: {t}</option>)}</select>{'\n  '}
    <span class="pf-count">{p.n} of {p.total}</span>{p.active ? <button class="btn" id="pfclear">Clear</button> : ''}</div>;
}
export const filterBarHtml = (p: FilterBarProps) => html(<FilterBar {...p} />);

export interface PrlRow { ref: string; st: string; icon: string; title: string; labels: { name: string; color: string }[]; meta: string; avatar: string }
export interface PrListProps { repo: string; state: string; banners: string; filterBar: string; body: ComponentChildren }
export function PrListPage({ repo, state, banners, filterBar, body }: PrListProps) {
  return <div class="pr-page"><div class="repoline" style="padding-bottom:16px"></div>{Raw(banners)}<div class="prl"><div class="prl-head"><div><span class="repo-ic">{I('repo', 16)}</span>{SP}<b>{repo}</b></div><div class="seg">{['open', 'closed', 'all'].map((s) => <button data-ps={s} class={state === s ? 'on' : ''}>{cap(s)}</button>)}</div></div>{Raw(filterBar)}{body}</div></div>;
}
export const prListPageHtml = (p: Omit<PrListProps, 'body'> & { rows: PrlRow[] | null; err: string; loading: boolean; empty: string }) => html(<PrListPage repo={p.repo} state={p.state} banners={p.banners} filterBar={p.filterBar} body={
  p.err ? <div class="err" style="padding:16px">{p.err}</div>
  : p.loading ? <div class="spinner" style="margin:48px auto">Loading pull requests…</div>
  : p.rows && p.rows.length ? <>{p.rows.map((r) => <a class="prl-row" data-open={r.ref}><span class={`rc-i ${r.st}`}>{I(r.icon)}</span><span class="prl-main"><b>{r.title}</b>{r.labels.map((l) => <span class="pill-label" style={`background:#${l.color}33;color:#${l.color};border-color:#${l.color};margin:0 0 0 4px`}>{l.name}</span>)}<i>{r.meta}</i></span><img src={`${r.avatar}&s=40`} width={20} height={20} style="border-radius:50%" /></a>)}</>
  : <div class="diff-empty">{p.empty}</div>} />);

export interface CrumbProps { repo: string; trail: { t: string; repo?: string }[]; extra: string }
export function Crumbs({ repo, trail, extra }: CrumbProps) {
  const homeCur = !repo && !trail.length;
  const parts: ComponentChildren[] = [homeCur ? <span class="crumb cur home">{I('home', 14)}<span>Home</span></span> : <a class="crumb" data-home="1" title="Home">{I('home', 14)}<span>Home</span></a>];
  if (repo) {
    const [owner, name] = repo.split('/');
    parts.push(<span class="crumb-grp"><a class="crumb" data-owner={owner} title={`Repositories of ${owner}`}>{owner}</a><span class="crumb-slash">/</span><a class="crumb strong" data-repo={repo} title={`All pull requests in ${repo}`}>{name}</a></span>);
  }
  trail.forEach((t, i) => parts.push(i === trail.length - 1 ? <span class="crumb cur">{t.t}</span> : <a class="crumb" data-repo={t.repo || undefined}>{t.t}</a>));
  return <nav class="repoline crumbs" aria-label="Breadcrumb">{parts.map((x, i) => <>{i ? <span class="crumb-sep">{I('chevron-right', 12)}</span> : ''}{x}</>)}{Raw(extra)}</nav>;
}
export const crumbsHtml = (p: CrumbProps) => html(<Crumbs {...p} />);
