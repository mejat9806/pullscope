import { Home } from '../components/Home';
import { Crumbs } from '../components/PrList';
import { rerender } from './actions';
import { openAux, openClick, openCtx, rmRecent } from './bind';
import { homeProps } from './bindwrite';
import { appState } from './core';
import { pushDis } from './data';
import { loadRepos, openRepo } from './nav';
import { openNewPr, render } from './pages';
import { tokenDialog } from './token';

import type { HomeHandlers } from '../components/Home';
import type { CrumbHandlers } from '../components/PrList';

export const crumbs: CrumbHandlers = {
  home: () => {
    appState.view = 'home';
    appState.homeOwner = '';
    appState.nav = false;
    render();
  },
  owner: option => {
    appState.view = 'home';
    appState.homeOwner = option;
    appState.homeTab = 'repos';
    appState.nav = false;
    render();

    if (appState.hasToken && !appState.repos) {
      loadRepos();
    }
  },
  repo: text => openRepo(text),
};

const on: HomeHandlers = {
  tab: text => {
    appState.homeTab = text;
    render();
  },
  vis: value => {
    appState.hmVis = value;
    render();
  },
  sort: event => {
    appState.hmSort = (event.target as HTMLSelectElement).value;
    render();
  },
  group: event => {
    appState.hmGroup = (event.target as HTMLSelectElement).value;
    render();
  },
  repoFilter: event => {
    appState.repoFilter = (event.target as HTMLInputElement).value;
    render();
  },
  recentFilter: event => {
    appState.recentFilter = (event.target as HTMLInputElement).value;
    render();
  },
  rstate: text => {
    appState.recentState = text;
    render();
  },
  repo: full => openRepo(full),
  open: openClick,
  aux: openAux,
  ctx: openCtx,
  rm: rmRecent,
  addToken: tokenDialog,
  compare: (repo, br) => openNewPr(repo, br),
  dismiss: key => {
    pushDis[key] = 1;
    localStorage.setItem('pushdismiss', JSON.stringify(pushDis));
    rerender();
  },
};

export function HomeView() {
  return (
    <>
      <Crumbs
        repo=""
        trail={appState.homeOwner ? [{ t: appState.homeOwner }] : []}
        on={crumbs}
      />
      <Home p={homeProps()} on={on} />
    </>
  );
}
