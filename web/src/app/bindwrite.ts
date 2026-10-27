import type { RepoSummary } from '../types';
import { S } from './core';
import { addTokenHtml, diffEmptyHtml, homeHtml, spinnerHtml } from '../components/Home';
import type { HomeProps } from '../components/Home';
import { pushBanners } from './data';

export function homePage() {
  const tab = S.homeTab || 'repos', owner = S.homeOwner || '';
  let body: HomeProps['body'];
  if (tab === 'recent') {
    const q = (S.recentFilter || '').toLowerCase(), st = S.recentState || 'all';
    const list = S.recent.filter((r) => (st === 'all' || r.state === st) && (!q || (r.title + ' ' + r.ref).toLowerCase().includes(q)));
    body = { kind: 'recent', filter: S.recentFilter || '', state: st, hasAny: S.recent.length > 0, cards: list.map((r) => ({ ref: r.ref, state: r.state, icon: r.icon, title: r.title })), emptyText: S.recent.length ? 'No matching pull requests.' : 'Pull requests you open appear here.' };
  }
  else if (!S.hasToken) body = { kind: 'html', html: addTokenHtml() };
  else if (S.reposErr) body = { kind: 'html', html: diffEmptyHtml(S.reposErr, ' err') };
  else if (!S.repos) body = { kind: 'html', html: spinnerHtml() };
  else {
    const f = (S.repoFilter || '').toLowerCase();
    const vis = S.hmVis || 'all', srt = S.hmSort || 'pushed', grp = S.hmGroup || 'none';
    let list = S.repos.filter((r) => (!owner || r.full_name.startsWith(owner + '/')) && r.full_name.toLowerCase().includes(f) && (vis === 'all' || (vis === 'private') === !!r.private));
    const nm = (r: RepoSummary) => r.full_name.split('/')[1], pushed = (r: RepoSummary) => Date.parse(r.pushed_at || '0') || 0;
    const sorters: Record<string, ((a: RepoSummary, b: RepoSummary) => number) | null> = { name: (a, b) => nm(a).localeCompare(nm(b)), namez: (a, b) => nm(b).localeCompare(nm(a)), issues: (a, b) => (b.open_issues_count || 0) - (a.open_issues_count || 0) || nm(a).localeCompare(nm(b)), oldest: (a, b) => pushed(a) - pushed(b), owner: (a, b) => a.full_name.localeCompare(b.full_name), ownerz: (a, b) => b.full_name.split('/')[0].localeCompare(a.full_name.split('/')[0]) || nm(a).localeCompare(nm(b)) };
    const sorter = sorters[srt]; if (sorter) list = [...list].sort(sorter);
    const card = (r: RepoSummary) => ({ full: r.full_name, name: r.full_name.split('/')[1], owner: r.full_name.split('/')[0], priv: !!r.private, archived: !!r.archived, issues: r.open_issues_count || 0, desc: r.description || '' });
    let groups = null;
    if (grp === 'owner') { const by = new Map<string, RepoSummary[]>(); list.forEach((r) => { const o = r.full_name.split('/')[0]; if (!by.has(o)) by.set(o, []); by.get(o)!.push(r); }); groups = [...by].map(([o, rs]) => ({ owner: o, cards: rs.map(card) })); }
    body = { kind: 'repos', filter: S.repoFilter || '', vis, sort: srt, group: grp, groups: list.length ? groups : null, cards: list.map(card), none: !list.length };
  }
  return homeHtml({ owner, tab, repoCount: S.repos ? S.repos.filter((r) => !owner || r.full_name.startsWith(owner + '/')).length : null, recentCount: S.recent.length, banners: pushBanners(), err: S.error ? String(S.error) : '', body });
}
