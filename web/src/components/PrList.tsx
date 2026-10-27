import type { ComponentChildren } from 'preact';
import { html, Raw } from './html';
import { Banners } from './Home';
import type { PushBanner } from './Home';
import { I, SP } from './ui';


const cap = (s: string) => s[0].toUpperCase() + s.slice(1);


export interface FilterHandlers { filter: (e: Event) => void; author: (e: Event) => void; label: (e: Event) => void; status: (e: Event) => void; sort: (e: Event) => void; clear: () => void }
export interface FilterBarProps { filter: string; authors: string[]; labels: string[]; author: string; label: string; status: string; statuses: [string, string][]; sort: string; sorts: [string, string][]; n: number; total: number; active: boolean }
function Opts({ arr, v, all }: { arr: string[]; v: string; all: string }) {
  return <><option value="">{all}</option>{arr.map((x) => <option value={x} selected={x === v}>{x}</option>)}</>;
}
export function FilterBar({ p, on }: { p: FilterBarProps; on: FilterHandlers }) {
  return <div class="prl-filters"><span class="pf-search">{I('search')}<input class="input" id="mainfilter" placeholder="Filter by title, #, author, branch, label…" value={p.filter} spellcheck={false} onInput={on.filter} /></span>{'\n  '}
    <select class="input" id="pfauthor" onChange={on.author}><Opts arr={p.authors} v={p.author} all="Author: all" /></select>{'\n  '}
    <select class="input" id="pflabel" onChange={on.label}><Opts arr={p.labels} v={p.label} all="Label: all" /></select>{'\n  '}
    <select class="input" id="pfstatus" onChange={on.status}><option value="">Status: any</option>{p.statuses.map(([k, t]) => <option value={k} selected={k === p.status}>{t}</option>)}</select>{'\n  '}
    <select class="input" id="pfsort" onChange={on.sort}>{p.sorts.map(([k, t]) => <option value={k} selected={k === p.sort}>Sort: {t}</option>)}</select>{'\n  '}
    <span class="pf-count">{p.n} of {p.total}</span>{p.active ? <button class="btn" id="pfclear" onClick={on.clear}>Clear</button> : ''}</div>;
}

export interface PrlRow { ref: string; st: string; icon: string; title: string; labels: { name: string; color: string }[]; meta: string; avatar: string }
export interface PrListHandlers extends FilterHandlers {
  ps: (s: string) => void; open: (el: HTMLElement, e: MouseEvent) => void; aux: (el: HTMLElement, e: MouseEvent) => void; ctx: (el: HTMLElement, e: MouseEvent) => void
  compare: (repo: string, branch: string) => void; dismiss: (key: string) => void
}
export interface PrListProps { repo: string; state: string; banners: PushBanner[]; filterBar: FilterBarProps | null; rows: PrlRow[] | null; err: string; loading: boolean; empty: string }
export function PrListPage({ p, on }: { p: PrListProps; on: PrListHandlers }) {
  const body = p.err ? <div class="err" style="padding:16px">{p.err}</div>
    : p.loading ? <div class="spinner" style="margin:48px auto">Loading pull requests…</div>
    : p.rows && p.rows.length ? <>{p.rows.map((r) => <a class="prl-row" data-open={r.ref} onClick={(e) => on.open(e.currentTarget, e)} onAuxClick={(e) => on.aux(e.currentTarget, e)} onContextMenu={(e) => on.ctx(e.currentTarget, e)}><span class={`rc-i ${r.st}`}>{I(r.icon)}</span><span class="prl-main"><b>{r.title}</b>{r.labels.map((l) => <span class="pill-label" style={`background:#${l.color}33;color:#${l.color};border-color:#${l.color};margin:0 0 0 4px`}>{l.name}</span>)}<i>{r.meta}</i></span><img src={`${r.avatar}&s=40`} width={20} height={20} style="border-radius:50%" /></a>)}</>
    : <div class="diff-empty">{p.empty}</div>;
  return <div class="pr-page"><div class="repoline" style="padding-bottom:16px"></div><Banners items={p.banners} on={on} /><div class="prl"><div class="prl-head"><div><span class="repo-ic">{I('repo', 16)}</span>{SP}<b>{p.repo}</b></div><div class="seg">{['open', 'closed', 'all'].map((s) => <button data-ps={s} class={p.state === s ? 'on' : ''} onClick={() => on.ps(s)}>{cap(s)}</button>)}</div></div>{p.filterBar ? <FilterBar p={p.filterBar} on={on} /> : null}{body}</div></div>;
}

export interface CrumbHandlers { home: () => void; owner: (o: string) => void; repo: (r: string) => void }
export interface CrumbProps { repo: string; trail: { t: string; repo?: string }[]; extra: string; on?: CrumbHandlers }
export function Crumbs({ repo, trail, extra, on }: CrumbProps) {
  const homeCur = !repo && !trail.length;
  const parts: ComponentChildren[] = [homeCur ? <span class="crumb cur home">{I('home', 14)}<span>Home</span></span> : <a class="crumb" data-home="1" onClick={on && on.home} title="Home">{I('home', 14)}<span>Home</span></a>];
  if (repo) {
    const [owner, name] = repo.split('/');
    parts.push(<span class="crumb-grp"><a class="crumb" data-owner={owner} onClick={on && (() => on.owner(owner))} title={`Repositories of ${owner}`}>{owner}</a><span class="crumb-slash">/</span><a class="crumb strong" data-repo={repo} onClick={on && (() => on.repo(repo))} title={`All pull requests in ${repo}`}>{name}</a></span>);
  }
  trail.forEach((t, i) => parts.push(i === trail.length - 1 ? <span class="crumb cur">{t.t}</span> : <a class="crumb" data-repo={t.repo || undefined} onClick={on && t.repo ? (() => on.repo(t.repo!)) : undefined}>{t.t}</a>));
  return <nav class="repoline crumbs" aria-label="Breadcrumb">{parts.map((x, i) => <>{i ? <span class="crumb-sep">{I('chevron-right', 12)}</span> : ''}{x}</>)}{extra ? Raw(extra) : null}</nav>;
}
export const crumbsHtml = (p: CrumbProps) => html(<Crumbs {...p} />);
