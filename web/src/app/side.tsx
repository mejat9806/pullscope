import { render as paint } from 'preact';
import { PrGroups, RcItem, RecentList, RepoList, SideHead, Sidebar } from '../components/Sidebar';
import type { RcRow, SideHandlers } from '../components/Sidebar';
import type { Cmp, PrListItem } from '../types';
import { openAux, openClick, openCtx, rmRecent } from './bind';
import { tokenDialog } from './token';
import { folded, isFolded } from './comments';
import { $, S, when } from './core';
import { rerender } from './actions';
import { loadPrs, openRepo } from './nav';
import { render } from './pages';
import { PGROUP, PICON, PSORT, prStatus } from './prlist';

const typed = (e: Event, key: 'pf' | 'repoFilter', id: string) => {
  const t = e.target as HTMLInputElement; S[key] = t.value; const p = t.selectionStart; render(); const n = $<HTMLInputElement>('#' + id)!; n.focus(); n.setSelectionRange(p, p);
};

const on: SideHandlers = {
  side: (tab) => { S.sideTab = tab; render(); },
  sps: (state) => { S.prState = state; loadPrs(); },
  pf: (e) => typed(e, 'pf', 'prfilter'),
  psort: (e) => { S.psort = (e.target as HTMLSelectElement).value; localStorage.setItem('psort', S.psort); render(); },
  pgroup: (e) => { S.pgroup = (e.target as HTMLSelectElement).value; localStorage.setItem('pgroup', S.pgroup); render(); },
  repoFilter: (e) => typed(e, 'repoFilter', 'repofilter'),
  repo: (name) => openRepo(name),
  addToken: tokenDialog,
  open: openClick, aux: openAux, ctx: openCtx, rm: rmRecent,
  // Folding only flips state; the page and the sidebar both repaint from it.
  fold: (e, k) => {
    e.stopPropagation();
    S.fold[k] = !isFolded(k); localStorage.setItem('fold', JSON.stringify(S.fold));
    rerender(); repaintSide();
  },
};

function PrRows() {
  const cur = S.bundle && S.view === 'pr' ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '';
  const f = S.pf.toLowerCase();
  const head = { repo: S.repo!, state: S.prState, filter: S.pf, sort: S.psort, group: S.pgroup, sorts: Object.entries(PSORT), groups: Object.entries(PGROUP) };
  const header = <SideHead p={head} on={on} />;
  if (!S.prs) return <>{header}<div class="sb-empty">Loading pull requests…</div></>;
  const list = S.prs.filter((p) => !f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f));
  const sorts: Record<string, Cmp> = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number };
  list.sort(sorts[S.psort]);
  const row = (p: PrListItem): RcRow => { const st = prStatus(p), ref = `${S.repo}#${p.number}`; return { ref, on: ref === cur, st, icon: PICON[st], title: p.title, sub: `#${p.number} · ${p.user.login} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}` }; };
  if (!list.length) return <>{header}<div class="sb-empty">{S.pf ? 'No matches.' : 'No pull requests.'}</div></>;
  if (S.pgroup === 'none') return <>{header}<div class="sb-count">{list.length} pull request{list.length === 1 ? '' : 's'}</div>{list.map((p) => <RcItem r={row(p)} on={on} />)}</>;
  const groups = new Map<string, PrListItem[]>(), put = (k: string, p: PrListItem) => (groups.get(k) || groups.set(k, []).get(k)!).push(p);
  list.forEach((p) => {
    if (S.pgroup === 'status') put({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }[prStatus(p)], p);
    else if (S.pgroup === 'author') put(p.user.login, p);
    else if (S.pgroup === 'base') put(p.base?.ref || '—', p);
    else if ((p.labels || []).length) p.labels.forEach((l) => put(l.name, p)); else put('No label', p);
  });
  const order = S.pgroup === 'status' ? ['Open', 'Draft', 'Merged', 'Closed'] : [...groups.keys()].sort((a, b) => +(a === 'No label') - +(b === 'No label') || a.localeCompare(b));
  return <>{header}<PrGroups on={on} groups={order.filter((k) => groups.has(k)).map((k) => { const key = 'pg:' + S.pgroup + ':' + k; return { key, folded: folded(key), closed: isFolded(key), name: k, rows: groups.get(k)!.map(row) }; })} /></>;
}

function List() {
  if (S.sideTab === 'prs' && S.repo) return <PrRows />;
  if (S.sideTab === 'recent') return <RecentList recent={S.recent} curRef={S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : ''} on={on} />;
  if (!S.hasToken) return <div class="sb-empty">Add an access token to list all your repositories and their pull requests.<br /><br /><button class="sb-btn" id="addtoken" onClick={on.addToken}>Add token</button></div>;
  if (S.reposErr) return <div class="sb-empty err">{S.reposErr}</div>;
  if (!S.repos) return <div class="sb-empty">Loading repositories…</div>;
  return <RepoList repos={S.repos} repo={S.repo} filter={S.repoFilter} on={on} />;
}

export function Side() {
  return <Sidebar sideTab={S.sideTab} hasRepo={!!S.repo} hasToken={S.hasToken} on={on}><List /></Sidebar>;
}

export const paintSide = (host: HTMLElement) => paint(<Side />, host);
export const repaintSide = () => { const h = $('#side'); if (h) paintSide(h); };
