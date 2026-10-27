import type { Cmp, PrListItem, Pull } from '../types';
import { folded, isFolded } from './comments';
import { S, esc, icon, when } from './core';
import { crumbsHtml, filterBarHtml, pgHtml, prListPageHtml, sideCountHtml, sideEmptyHtml, sideHeadHtml } from '../components/PrList';
import type { PrlRow, RcRow } from '../components/PrList';
import { pushBanners } from './data';

export const PSORT = { updated: 'Recently updated', created: 'Newest', oldest: 'Oldest', number: 'Number', title: 'Title A–Z', author: 'Author' };

export const PGROUP = { none: 'No grouping', status: 'Status', author: 'Author', label: 'Label', base: 'Base branch' };

export const prStatus = (p: PrListItem) => (p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : p.draft ? 'draft' : 'open');

export const PICON = { open: 'git-pull-request', draft: 'git-pull-request-draft', merged: 'git-merge', closed: 'git-pull-request-closed' };

export function prSide() {
  const cur = S.bundle && S.view === 'pr' ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '';
  const f = S.pf.toLowerCase();
  const head = sideHeadHtml({ repo: S.repo!, state: S.prState, filter: S.pf, sort: S.psort, group: S.pgroup, sorts: Object.entries(PSORT), groups: Object.entries(PGROUP) });
  if (!S.prs) return head + sideEmptyHtml('Loading pull requests…');
  const list = S.prs.filter((p) => !f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f));
  const sorts: Record<string, Cmp> = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number };
  const by = sorts[S.psort];
  list.sort(by);
  const row = (p: PrListItem): RcRow => { const st = prStatus(p), ref = `${S.repo}#${p.number}`; return { ref, on: ref === cur, st, icon: PICON[st], title: p.title, sub: `#${p.number} · ${p.user.login} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}` }; };
  if (!list.length) return head + sideEmptyHtml(S.pf ? 'No matches.' : 'No pull requests.');
  if (S.pgroup === 'none') return head + sideCountHtml(list.length, list.map(row));
  const groups = new Map<string, PrListItem[]>(), put = (k: string, p: PrListItem) => (groups.get(k) || groups.set(k, []).get(k)!).push(p);
  list.forEach((p) => {
    if (S.pgroup === 'status') put({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }[prStatus(p)], p);
    else if (S.pgroup === 'author') put(p.user.login, p);
    else if (S.pgroup === 'base') put(p.base?.ref || '—', p);
    else if ((p.labels || []).length) p.labels.forEach((l) => put(l.name, p)); else put('No label', p);
  });
  const order = S.pgroup === 'status' ? ['Open', 'Draft', 'Merged', 'Closed'] : [...groups.keys()].sort((a, b) => +(a === 'No label') - +(b === 'No label') || a.localeCompare(b));
  return head + pgHtml(order.filter((k) => groups.has(k)).map((k) => { const key = 'pg:' + S.pgroup + ':' + k; return { key, folded: folded(key), closed: isFolded(key), name: k, rows: groups.get(k)!.map(row) }; }));
}


export function prFiltered() {
  const f = S.pf.toLowerCase();
  const list = (S.prs || []).filter((p) => (!f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f))
    && (!S.pAuthor || p.user.login === S.pAuthor) && (!S.pLabel || (p.labels || []).some((l) => l.name === S.pLabel))
    && (!S.pStatus || prStatus(p) === S.pStatus));
  const cmps: Record<string, Cmp> = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number };
  return list.sort(cmps[S.psort]);
}

export function prFilterBar() {
  if (!S.prs) return '';
  const authors = [...new Set(S.prs.map((p) => p.user.login))].sort((a, b) => a.localeCompare(b));
  const labels = [...new Set(S.prs.flatMap((p) => (p.labels || []).map((l) => l.name)))].sort((a, b) => a.localeCompare(b));
  return filterBarHtml({
    filter: S.pf, authors, labels, author: S.pAuthor!, label: S.pLabel!, status: S.pStatus ?? '', statuses: Object.entries({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }),
    sort: S.psort, sorts: Object.entries(PSORT), n: prFiltered().length, total: S.prs.length, active: !!(S.pf || S.pAuthor || S.pLabel || S.pStatus),
  });
}

export function prList() {
  const rows = S.error || !S.prs ? null : prFiltered().map((p): PrlRow => {
    const st = p.merged_at ? ['merged', 'git-merge'] : p.state === 'closed' ? ['closed', 'git-pull-request-closed'] : p.draft ? ['draft', 'git-pull-request-draft'] : ['open', 'git-pull-request'];
    return { ref: `${S.repo}#${p.number}`, st: st[0], icon: st[1], title: p.title, labels: p.labels || [], meta: `#${p.number} ${p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : 'opened'} ${when(p.merged_at || p.closed_at || p.created_at).replace(/<\/?span[^>]*>/g, '')} by ${p.user.login}`, avatar: p.user.avatar_url ?? '' };
  });
  return prListPageHtml({ repo: S.repo!, state: S.prState, banners: pushBanners(S.repo!), filterBar: prFilterBar(), rows, err: S.error ? String(S.error) : '', loading: !S.error && !S.prs, empty: S.prs?.length ? 'No pull requests match the filters.' : 'No pull requests.' });
}


// Breadcrumbs for every page: Home › (owner / repo) › … ; the last item is the current page.
export function crumbs(repo: string, trail: { t: string; repo?: string }[] = [], extra = '') { return crumbsHtml({ repo, trail, extra }); }

export function repoHeader(p: Pull) {
  const r = p.base.repo;
  return crumbs(r.full_name, [{ t: 'Pull requests', repo: r.full_name }, { t: `#${p.number}` }], `<a class="crumb gh" href="${esc(r.html_url)}" data-ext title="Open on GitHub">${icon('link-external', 12)}</a>${S.refreshing ? '<span class="stale">Refreshing…</span>' : ''}`);
}
