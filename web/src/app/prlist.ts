import type { Cmp, PrListItem } from '../types';
import { S, when } from './core';
import type { FilterBarProps, PrListProps, PrlRow } from '../components/PrList';
import { pushBannerItems } from './data';

export const PSORT = { updated: 'Recently updated', created: 'Newest', oldest: 'Oldest', number: 'Number', title: 'Title A–Z', author: 'Author' };

export const PGROUP = { none: 'No grouping', status: 'Status', author: 'Author', label: 'Label', base: 'Base branch' };

export const prStatus = (p: PrListItem) => (p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : p.draft ? 'draft' : 'open');

export const PICON = { open: 'git-pull-request', draft: 'git-pull-request-draft', merged: 'git-merge', closed: 'git-pull-request-closed' };


export function prFiltered() {
  const f = S.pf.toLowerCase();
  const list = (S.prs || []).filter((p) => (!f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f))
    && (!S.pAuthor || p.user.login === S.pAuthor) && (!S.pLabel || (p.labels || []).some((l) => l.name === S.pLabel))
    && (!S.pStatus || prStatus(p) === S.pStatus));
  const cmps: Record<string, Cmp> = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number };
  return list.sort(cmps[S.psort]);
}

export function prFilterBar(): FilterBarProps | null {
  if (!S.prs) return null;
  const authors = [...new Set(S.prs.map((p) => p.user.login))].sort((a, b) => a.localeCompare(b));
  const labels = [...new Set(S.prs.flatMap((p) => (p.labels || []).map((l) => l.name)))].sort((a, b) => a.localeCompare(b));
  return {
    filter: S.pf, authors, labels, author: S.pAuthor!, label: S.pLabel!, status: S.pStatus ?? '', statuses: Object.entries({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }),
    sort: S.psort, sorts: Object.entries(PSORT), n: prFiltered().length, total: S.prs.length, active: !!(S.pf || S.pAuthor || S.pLabel || S.pStatus),
  };
}

export function prListProps(): PrListProps {
  const rows = S.error || !S.prs ? null : prFiltered().map((p): PrlRow => {
    const st = p.merged_at ? ['merged', 'git-merge'] : p.state === 'closed' ? ['closed', 'git-pull-request-closed'] : p.draft ? ['draft', 'git-pull-request-draft'] : ['open', 'git-pull-request'];
    return { ref: `${S.repo}#${p.number}`, st: st[0], icon: st[1], title: p.title, labels: p.labels || [], meta: `#${p.number} ${p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : 'opened'} ${when(p.merged_at || p.closed_at || p.created_at).replace(/<\/?span[^>]*>/g, '')} by ${p.user.login}`, avatar: p.user.avatar_url ?? '' };
  });
  return { repo: S.repo!, state: S.prState, banners: pushBannerItems(S.repo!), filterBar: prFilterBar(), rows, err: S.error ? String(S.error) : '', loading: !S.error && !S.prs, empty: S.prs?.length ? 'No pull requests match the filters.' : 'No pull requests.' };
}



