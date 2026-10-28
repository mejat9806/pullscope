import { appState, when } from './core';
import { pushBannerItems } from './data';

import type { FilterBarProps, PrListProps, PrlRow } from '../components/PrList';
import type { Cmp, PrListItem } from '../types';

export const PSORT = {
  updated: 'Recently updated',
  created: 'Newest',
  oldest: 'Oldest',
  number: 'Number',
  title: 'Title A–Z',
  author: 'Author',
};

export const PGROUP = {
  none: 'No grouping',
  status: 'Status',
  author: 'Author',
  label: 'Label',
  base: 'Base branch',
};

export const prStatus = (prListItem: PrListItem) =>
  prListItem.merged_at
    ? 'merged'
    : prListItem.state === 'closed'
      ? 'closed'
      : prListItem.draft
        ? 'draft'
        : 'open';

export const PICON = {
  open: 'git-pull-request',
  draft: 'git-pull-request-draft',
  merged: 'git-merge',
  closed: 'git-pull-request-closed',
};

export function prFiltered() {
  const field = appState.pf.toLowerCase();

  const list = (appState.prs || []).filter(
    prListItem =>
      (!field ||
        `#${prListItem.number} ${prListItem.title} ${prListItem.user.login} ${prListItem.head?.ref || ''} ${(prListItem.labels || []).map(label => label.name).join(' ')}`
          .toLowerCase()
          .includes(field)) &&
      (!appState.pAuthor || prListItem.user.login === appState.pAuthor) &&
      (!appState.pLabel ||
        (prListItem.labels || []).some(
          label => label.name === appState.pLabel,
        )) &&
      (!appState.pStatus || prStatus(prListItem) === appState.pStatus),
  );

  const cmps: Record<string, Cmp> = {
    updated: (firstPrListItem, secondPrListItem) =>
      secondPrListItem.updated_at.localeCompare(firstPrListItem.updated_at),
    created: (firstPrListItem, secondPrListItem) =>
      secondPrListItem.created_at.localeCompare(firstPrListItem.created_at),
    oldest: (firstPrListItem, secondPrListItem) =>
      firstPrListItem.created_at.localeCompare(secondPrListItem.created_at),
    number: (firstPrListItem, secondPrListItem) =>
      secondPrListItem.number - firstPrListItem.number,
    title: (firstPrListItem, secondPrListItem) =>
      firstPrListItem.title.localeCompare(secondPrListItem.title),
    author: (firstPrListItem, secondPrListItem) =>
      firstPrListItem.user.login.localeCompare(secondPrListItem.user.login) ||
      secondPrListItem.number - firstPrListItem.number,
  };

  return list.sort(cmps[appState.psort]);
}

export function prFilterBar(): FilterBarProps | null {
  if (!appState.prs) {
    return null;
  }

  const authors = [
    ...new Set(appState.prs.map(prListItem => prListItem.user.login)),
  ].sort((firstText, secondText) => firstText.localeCompare(secondText));

  const labels = [
    ...new Set(
      appState.prs.flatMap(prListItem =>
        (prListItem.labels || []).map(label => label.name),
      ),
    ),
  ].sort((firstText, secondText) => firstText.localeCompare(secondText));

  return {
    filter: appState.pf,
    authors,
    labels,
    author: appState.pAuthor!,
    label: appState.pLabel!,
    status: appState.pStatus ?? '',
    statuses: Object.entries({
      open: 'Open',
      draft: 'Draft',
      merged: 'Merged',
      closed: 'Closed',
    }),
    sort: appState.psort,
    sorts: Object.entries(PSORT),
    n: prFiltered().length,
    total: appState.prs.length,
    active: !!(
      appState.pf ||
      appState.pAuthor ||
      appState.pLabel ||
      appState.pStatus
    ),
  };
}

export function prListProps(): PrListProps {
  const rows =
    appState.error || !appState.prs
      ? null
      : prFiltered().map((prListItem): PrlRow => {
          const st = prListItem.merged_at
            ? ['merged', 'git-merge']
            : prListItem.state === 'closed'
              ? ['closed', 'git-pull-request-closed']
              : prListItem.draft
                ? ['draft', 'git-pull-request-draft']
                : ['open', 'git-pull-request'];

          return {
            ref: `${appState.repo}#${prListItem.number}`,
            st: st[0],
            icon: st[1],
            title: prListItem.title,
            labels: prListItem.labels || [],
            meta: `#${prListItem.number} ${prListItem.merged_at ? 'merged' : prListItem.state === 'closed' ? 'closed' : 'opened'} ${when(prListItem.merged_at || prListItem.closed_at || prListItem.created_at).replace(/<\/?span[^>]*>/g, '')} by ${prListItem.user.login}`,
            avatar: prListItem.user.avatar_url ?? '',
          };
        });

  return {
    repo: appState.repo!,
    state: appState.prState,
    banners: pushBannerItems(appState.repo!),
    filterBar: prFilterBar(),
    rows,
    err: appState.error ? String(appState.error) : '',
    loading: !appState.error && !appState.prs,
    empty: appState.prs?.length
      ? 'No pull requests match the filters.'
      : 'No pull requests.',
  };
}
