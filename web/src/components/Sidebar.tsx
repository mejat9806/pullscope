import type { RecentEntry, RepoSummary } from '../types';
import { html, Raw } from './html';
import { SideTabs } from './SideTabs';

type Icon = (name: string, size?: number) => string;

export function RecentList({ recent, curRef, icon }: { recent: RecentEntry[]; curRef: string; icon: Icon }) {
  if (!recent.length) return <div class="sb-empty">Pull requests you open appear here.</div>;
  return <>{recent.map((r) => (
    <a class={`rc ${r.ref === curRef ? 'on' : ''}`} data-open={r.ref}>
      <span class={`rc-i ${r.state}`}>{Raw(icon(r.icon))}</span>
      <span class="rc-t"><b>{r.title}</b><i>{r.ref}</i></span>
      <button class="rc-x" data-rm={r.ref} title="Remove">{Raw(icon('x'))}</button>
    </a>
  ))}</>;
}

export function RepoList({ repos, repo, filter, icon }: { repos: RepoSummary[]; repo: string | null; filter: string; icon: Icon }) {
  const f = filter.toLowerCase(), shown = repos.filter((r) => r.full_name.toLowerCase().includes(f));
  return <>
    <input class="input sb-filter" id="repofilter" placeholder="Find a repository…" value={filter} />
    {shown.length ? shown.map((r) => (
      <a class={`rc ${repo === r.full_name ? 'on' : ''}`} data-repo={r.full_name}>
        <span class={`rc-i ${r.private ? 'closed' : ''}`} style="color:var(--fgColor-muted)">{Raw(icon(r.private ? 'lock' : 'repo'))}</span>
        <span class="rc-t"><b>{r.full_name.split('/')[1]}</b><i>{r.full_name.split('/')[0]}</i></span>
      </a>
    )) : <div class="sb-empty">No matches.</div>}
  </>;
}

export interface SidebarProps { sideTab: string; hasRepo: boolean; hasToken: boolean; list: string }

export function Sidebar({ sideTab, hasRepo, hasToken, list }: SidebarProps) {
  return (
    <aside class="sidebar"><SideTabs active={sideTab} hasRepo={hasRepo} /><div class="sb-list">{Raw(list)}</div><div class="sb-foot">{hasToken ? 'Signed in with token' : 'Anonymous · 60 requests/hour'}</div></aside>
  );
}

export const recentListHtml = (p: Parameters<typeof RecentList>[0]) => html(<RecentList {...p} />);
export const repoListHtml = (p: Parameters<typeof RepoList>[0]) => html(<RepoList {...p} />);
export const sidebarHtml = (p: SidebarProps) => html(<Sidebar {...p} />);
