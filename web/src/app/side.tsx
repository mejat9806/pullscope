import {
  PrGroups,
  RcItem,
  RecentList,
  RepoList,
  Sidebar,
  SideHead,
} from '../components/Sidebar';
import { rerender } from './actions';
import { openAux, openClick, openCtx, rmRecent } from './bind';
import { folded, isFolded } from './comments';
import { appState, when } from './core';
import { setSlot } from './frame';
import { loadPrs, openRepo } from './nav';
import { render } from './pages';
import { PGROUP, PICON, prStatus, PSORT } from './prlist';
import { arrange, roGrip, saveOrder } from './reorder';
import { repoPickOpen } from './repopick';
import { tokenDialog } from './token';

import type { RcRow, SideHandlers } from '../components/Sidebar';
import type { Cmp, PrListItem } from '../types';

// The filter box keeps its caret across the repaint: the same input element stays in the tree.
const typed = (event: Event, key: 'pf' | 'repoFilter') => {
  appState[key] = (event.target as HTMLInputElement).value;
  render();
};

const on: SideHandlers = {
  side: tab => {
    appState.sideTab = tab;
    render();
  },
  sps: state => {
    appState.prState = state;
    loadPrs();
  },
  pf: event => typed(event, 'pf'),
  psort: event => {
    appState.psort = (event.target as HTMLSelectElement).value;
    localStorage.setItem('psort', appState.psort);
    render();
  },
  pgroup: event => {
    appState.pgroup = (event.target as HTMLSelectElement).value;
    localStorage.setItem('pgroup', appState.pgroup);
    render();
  },
  repoFilter: event => typed(event, 'repoFilter'),
  repo: name => openRepo(name),
  addToken: tokenDialog,
  pickRepos: repoPickOpen,
  grip: (event, name) =>
    roGrip(
      event,
      'repos',
      '.rc[data-t]',
      name,
      () =>
        arrange(
          appState.repos || [],
          'repos',
          repoSummary => repoSummary.full_name,
        ).map(repoSummary => repoSummary.full_name),
      options => saveOrder('repos', options),
    ),
  open: openClick,
  aux: openAux,
  ctx: openCtx,
  rm: rmRecent,

  // Folding only flips state; the page and the sidebar both repaint from it.
  fold: (event, key) => {
    event.stopPropagation();
    appState.fold[key] = !isFolded(key);
    localStorage.setItem('fold', JSON.stringify(appState.fold));
    rerender();
    repaintSide();
  },
};

function PrRows() {
  const cur =
    appState.bundle && appState.view === 'pr'
      ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
      : '';

  const field = appState.pf.toLowerCase();

  const head = {
    repo: appState.repo!,
    state: appState.prState,
    filter: appState.pf,
    sort: appState.psort,
    group: appState.pgroup,
    sorts: Object.entries(PSORT),
    groups: Object.entries(PGROUP),
  };

  const header = <SideHead p={head} on={on} />;

  if (!appState.prs) {
    return (
      <>
        {header}
        <div class="sb-empty">Loading pull requests…</div>
      </>
    );
  }

  const list = appState.prs.filter(
    prListItem =>
      !field ||
      `#${prListItem.number} ${prListItem.title} ${prListItem.user.login} ${prListItem.head?.ref || ''} ${(prListItem.labels || []).map(label => label.name).join(' ')}`
        .toLowerCase()
        .includes(field),
  );

  const sorts: Record<string, Cmp> = {
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

  list.sort(sorts[appState.psort]);

  const row = (prListItem: PrListItem): RcRow => {
    const st = prStatus(prListItem);
    const ref = `${appState.repo}#${prListItem.number}`;

    return {
      ref,
      on: ref === cur,
      st,
      icon: PICON[st],
      title: prListItem.title,
      sub: `#${prListItem.number} · ${prListItem.user.login} · ${when(prListItem.updated_at).replace(/<\/?span[^>]*>/g, '')}`,
    };
  };

  if (!list.length) {
    return (
      <>
        {header}
        <div class="sb-empty">
          {appState.pf ? 'No matches.' : 'No pull requests.'}
        </div>
      </>
    );
  }

  if (appState.pgroup === 'none') {
    return (
      <>
        {header}
        <div class="sb-count">
          {list.length} pull request{list.length === 1 ? '' : 's'}
        </div>
        {list.map(prListItem => (
          <RcItem r={row(prListItem)} on={on} />
        ))}
      </>
    );
  }

  const groups = new Map<string, PrListItem[]>();

  const put = (key: string, prListItem: PrListItem) =>
    (groups.get(key) || groups.set(key, []).get(key)!).push(prListItem);

  list.forEach(prListItem => {
    if (appState.pgroup === 'status') {
      put(
        { open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }[
          prStatus(prListItem)
        ],
        prListItem,
      );
    } else if (appState.pgroup === 'author') {
      put(prListItem.user.login, prListItem);
    } else if (appState.pgroup === 'base') {
      put(prListItem.base?.ref || '—', prListItem);
    } else if ((prListItem.labels || []).length) {
      prListItem.labels.forEach(label => put(label.name, prListItem));
    } else {
      put('No label', prListItem);
    }
  });

  const order =
    appState.pgroup === 'status'
      ? ['Open', 'Draft', 'Merged', 'Closed']
      : [...groups.keys()].sort(
          (firstText, secondText) =>
            +(firstText === 'No label') - +(secondText === 'No label') ||
            firstText.localeCompare(secondText),
        );

  return (
    <>
      {header}
      <PrGroups
        on={on}
        groups={order
          .filter(key => groups.has(key))
          .map(otherKey => {
            const key = `pg:${appState.pgroup}:${otherKey}`;

            return {
              key,
              folded: folded(key),
              closed: isFolded(key),
              name: otherKey,
              rows: groups.get(otherKey)!.map(row),
            };
          })}
      />
    </>
  );
}

function List() {
  if (appState.sideTab === 'prs' && appState.repo) {
    return <PrRows />;
  }

  if (appState.sideTab === 'recent') {
    return (
      <RecentList
        recent={appState.recent}
        curRef={
          appState.bundle
            ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
            : ''
        }
        on={on}
      />
    );
  }

  if (!appState.hasToken) {
    return (
      <div class="sb-empty">
        Add an access token to list all your repositories and their pull
        requests.
        <br />
        <br />
        <button class="sb-btn" id="addtoken" onClick={on.addToken}>
          Add token
        </button>
      </div>
    );
  }

  if (appState.reposErr) {
    return <div class="sb-empty err">{appState.reposErr}</div>;
  }

  if (!appState.repos) {
    return <div class="sb-empty">Loading repositories…</div>;
  }

  return (
    <RepoList
      repos={arrange(
        appState.repos,
        'repos',
        repoSummary => repoSummary.full_name,
      )}
      repo={appState.repo}
      filter={appState.repoFilter}
      on={on}
    />
  );
}

export function Side() {
  return (
    <Sidebar sideTab={appState.sideTab} hasRepo={!!appState.repo} on={on}>
      <List />
    </Sidebar>
  );
}

export const paintSide = () => setSlot('side', <Side />);

export const repaintSide = paintSide;
