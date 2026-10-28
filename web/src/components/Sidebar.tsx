import type { ComponentChildren } from 'preact';
import type { RecentEntry, RepoSummary } from '../types';
import { Icon } from './ui';

export interface RcRow { ref: string; on: boolean; st: string; icon: string; title: string; sub: string }

export interface SideHandlers {
  side: (tab: string) => void; sps: (state: string) => void; pf: (e: Event) => void; psort: (e: Event) => void; pgroup: (e: Event) => void
  repoFilter: (e: Event) => void; repo: (name: string) => void; addToken: () => void; pickRepos: () => void
  open: (el: HTMLElement, e: MouseEvent) => void; aux: (el: HTMLElement, e: MouseEvent) => void; ctx: (el: HTMLElement, e: MouseEvent) => void
  rm: (e: MouseEvent, ref: string) => void; fold: (e: MouseEvent, key: string) => void
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function SideTabs({ active, hasRepo, on }: { active: string; hasRepo: boolean; on: SideHandlers }) {
  const cls = (t: string) => (active === t ? 'on' : '');
  return (
    <div class="sb-tabs">
      <button data-side="repos" class={cls('repos')} onClick={() => on.side('repos')}>Repos</button>
      {hasRepo && <button data-side="prs" class={cls('prs')} onClick={() => on.side('prs')}>PRs</button>}
      <button data-side="recent" class={cls('recent')} onClick={() => on.side('recent')}>Recent</button>
    </div>
  );
}

export function RcItem({ r, on }: { r: RcRow; on: SideHandlers }) {
  return (
    <a class={`rc ${r.on ? 'on' : ''}`} data-open={r.ref} onClick={(e) => on.open(e.currentTarget, e)} onAuxClick={(e) => on.aux(e.currentTarget, e)} onContextMenu={(e) => on.ctx(e.currentTarget, e)}>
      <span class={`rc-i ${r.st}`}><Icon n={r.icon} /></span><span class="rc-t"><b>{r.title}</b><i>{r.sub}</i></span>
    </a>
  );
}

export function RecentList({ recent, curRef, on }: { recent: RecentEntry[]; curRef: string; on: SideHandlers }) {
  if (!recent.length) return <div class="sb-empty">Pull requests you open appear here.</div>;
  return <>{recent.map((r) => (
    <a class={`rc ${r.ref === curRef ? 'on' : ''}`} data-open={r.ref} onClick={(e) => on.open(e.currentTarget, e)} onAuxClick={(e) => on.aux(e.currentTarget, e)} onContextMenu={(e) => on.ctx(e.currentTarget, e)}>
      <span class={`rc-i ${r.state}`}><Icon n={r.icon} /></span>
      <span class="rc-t"><b>{r.title}</b><i>{r.ref}</i></span>
      <button class="rc-x" data-rm={r.ref} onClick={(e) => on.rm(e, r.ref)} title="Remove"><Icon n="x" /></button>
    </a>
  ))}</>;
}

export function RepoList({ repos, repo, filter, on }: { repos: RepoSummary[]; repo: string | null; filter: string; on: SideHandlers }) {
  const f = filter.toLowerCase(), shown = repos.filter((r) => r.full_name.toLowerCase().includes(f));
  return <>
    <input class="input sb-filter" id="repofilter" placeholder="Find a repository…" value={filter} onInput={on.repoFilter} />
    <button class="sb-btn" id="pickrepos" onClick={on.pickRepos}>Choose repositories…</button>
    {shown.length ? shown.map((r) => (
      <a class={`rc ${repo === r.full_name ? 'on' : ''}`} data-repo={r.full_name} onClick={() => on.repo(r.full_name)}>
        <span class={`rc-i ${r.private ? 'closed' : ''}`} style="color:var(--fgColor-muted)"><Icon n={r.private ? 'lock' : 'repo'} /></span>
        <span class="rc-t"><b>{r.full_name.split('/')[1]}</b><i>{r.full_name.split('/')[0]}</i></span>
      </a>
    )) : <div class="sb-empty">No matches.</div>}
  </>;
}

function Sel({ id, opts, v, onChange }: { id: string; opts: [string, string][]; v: string; onChange: (e: Event) => void }) {
  return <select class="input sb-sel" id={id} onChange={onChange}>{opts.map(([k, t]) => <option value={k} selected={k === v}>{t}</option>)}</select>;
}

export interface SideHeadProps { repo: string; state: string; filter: string; sort: string; group: string; sorts: [string, string][]; groups: [string, string][] }

export function SideHead({ p, on }: { p: SideHeadProps; on: SideHandlers }) {
  return <>
    <div class="sb-repo"><button class="fold-btn" data-side="repos" title="All repositories" onClick={() => on.side('repos')}><Icon n="chevron-left" /></button><b title={p.repo}>{p.repo}</b></div>
    <div class="seg sb-seg">{['open', 'closed', 'all'].map((s) => <button data-sps={s} class={p.state === s ? 'on' : ''} onClick={() => on.sps(s)}>{cap(s)}</button>)}</div>
    <input class="input sb-filter" id="prfilter" placeholder="Filter by title, #, author, label…" value={p.filter} onInput={on.pf} />
    <div class="sb-ctl"><label>Sort<Sel id="prsort" opts={p.sorts} v={p.sort} onChange={on.psort} /></label><label>Group<Sel id="prgroup" opts={p.groups} v={p.group} onChange={on.pgroup} /></label></div>
  </>;
}

export interface PrGroup { key: string; folded: string; closed: boolean; name: string; rows: RcRow[] }

export function PrGroups({ groups, on }: { groups: PrGroup[]; on: SideHandlers }) {
  return <>{groups.map((g) => (
    <div class={`pg${g.folded}`}>
      <div class="pg-h" data-fold={g.key} onClick={(e) => on.fold(e, g.key)}><Icon n={g.closed ? 'chevron-right' : 'chevron-down'} /><span>{g.name}</span><i>{g.rows.length}</i></div>
      <div class="pg-b">{g.rows.map((r) => <RcItem r={r} on={on} />)}</div>
    </div>
  ))}</>;
}

export function Sidebar({ sideTab, hasRepo, hasToken, on, children }: { sideTab: string; hasRepo: boolean; hasToken: boolean; on: SideHandlers; children: ComponentChildren }) {
  return (
    <aside class="sidebar"><SideTabs active={sideTab} hasRepo={hasRepo} on={on} /><div class="sb-list">{children}</div><div class="sb-foot">{hasToken ? 'Signed in with token' : 'Anonymous · 60 requests/hour'}</div></aside>
  );
}
