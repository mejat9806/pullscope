import { appState } from './core';
import { pushBannerItems } from './data';

import type { HomeProps } from '../components/Home';
import type { RepoSummary } from '../types';

export function homeProps(): HomeProps {
  const tab = appState.homeTab || 'repos';
  const owner = appState.homeOwner || '';

  let body: HomeProps['body'];

  if (tab === 'recent') {
    const query = (appState.recentFilter || '').toLowerCase();
    const st = appState.recentState || 'all';

    const list = appState.recent.filter(
      recentEntry =>
        (st === 'all' || recentEntry.state === st) &&
        (!query ||
          `${recentEntry.title} ${recentEntry.ref}`
            .toLowerCase()
            .includes(query)),
    );

    body = {
      kind: 'recent',
      filter: appState.recentFilter || '',
      state: st,
      hasAny: appState.recent.length > 0,
      cards: list.map(recentEntry => ({
        ref: recentEntry.ref,
        state: recentEntry.state,
        icon: recentEntry.icon,
        title: recentEntry.title,
      })),
      emptyText: appState.recent.length
        ? 'No matching pull requests.'
        : 'Pull requests you open appear here.',
    };
  } else if (!appState.hasToken) {
    body = { kind: 'addtoken' };
  } else if (appState.reposErr) {
    body = { kind: 'error', text: String(appState.reposErr) };
  } else if (!appState.repos) {
    body = { kind: 'spinner' };
  } else {
    const field = (appState.repoFilter || '').toLowerCase();
    const vis = appState.hmVis || 'all';
    const srt = appState.hmSort || 'pushed';
    const grp = appState.hmGroup || 'none';

    let list = appState.repos.filter(
      repoSummary =>
        (!owner || repoSummary.full_name.startsWith(`${owner}/`)) &&
        repoSummary.full_name.toLowerCase().includes(field) &&
        (vis === 'all' || (vis === 'private') === !!repoSummary.private),
    );

    const nm = (repoSummary: RepoSummary) =>
      repoSummary.full_name.split('/')[1];

    const pushed = (repoSummary: RepoSummary) =>
      Date.parse(repoSummary.pushed_at || '0') || 0;

    const sorters: Record<
      string,
      | ((
          firstRepoSummary: RepoSummary,
          secondRepoSummary: RepoSummary,
        ) => number)
      | null
    > = {
      name: (firstRepoSummary, secondRepoSummary) =>
        nm(firstRepoSummary).localeCompare(nm(secondRepoSummary)),
      namez: (firstRepoSummary, secondRepoSummary) =>
        nm(secondRepoSummary).localeCompare(nm(firstRepoSummary)),
      issues: (firstRepoSummary, secondRepoSummary) =>
        (secondRepoSummary.open_issues_count || 0) -
          (firstRepoSummary.open_issues_count || 0) ||
        nm(firstRepoSummary).localeCompare(nm(secondRepoSummary)),
      oldest: (firstRepoSummary, secondRepoSummary) =>
        pushed(firstRepoSummary) - pushed(secondRepoSummary),
      owner: (firstRepoSummary, secondRepoSummary) =>
        firstRepoSummary.full_name.localeCompare(secondRepoSummary.full_name),
      ownerz: (firstRepoSummary, secondRepoSummary) =>
        secondRepoSummary.full_name
          .split('/')[0]
          .localeCompare(firstRepoSummary.full_name.split('/')[0]) ||
        nm(firstRepoSummary).localeCompare(nm(secondRepoSummary)),
    };

    const sorter = sorters[srt];

    if (sorter) {
      list = [...list].sort(sorter);
    }

    const card = (repoSummary: RepoSummary) => ({
      full: repoSummary.full_name,
      name: repoSummary.full_name.split('/')[1],
      owner: repoSummary.full_name.split('/')[0],
      priv: !!repoSummary.private,
      archived: !!repoSummary.archived,
      issues: repoSummary.open_issues_count || 0,
      desc: repoSummary.description || '',
    });

    let groups = null;

    if (grp === 'owner') {
      const by = new Map<string, RepoSummary[]>();

      list.forEach(repoSummary => {
        const option = repoSummary.full_name.split('/')[0];

        if (!by.has(option)) {
          by.set(option, []);
        }

        by.get(option)!.push(repoSummary);
      });

      groups = [...by].map(([option, rs]) => ({
        owner: option,
        cards: rs.map(card),
      }));
    }

    body = {
      kind: 'repos',
      filter: appState.repoFilter || '',
      vis,
      sort: srt,
      group: grp,
      groups: list.length ? groups : null,
      cards: list.map(card),
      none: !list.length,
    };
  }

  return {
    owner,
    tab,
    repoCount: appState.repos
      ? appState.repos.filter(
          repoSummary =>
            !owner || repoSummary.full_name.startsWith(`${owner}/`),
        ).length
      : null,
    recentCount: appState.recent.length,
    banners: pushBannerItems(),
    err: appState.error ? String(appState.error) : '',
    body,
  };
}
