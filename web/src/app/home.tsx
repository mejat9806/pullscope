import { Crumbs } from '../components/PrList';
import type { CrumbHandlers } from '../components/PrList';
import { Home } from '../components/Home';
import type { HomeHandlers } from '../components/Home';
import { openClick, openAux, openCtx, rmRecent } from './bind';
import { tokenDialog } from './token';
import { homeProps } from './bindwrite';
import { S } from './core';
import { pushDis } from './data';
import { loadRepos, openRepo } from './nav';
import { openNewPr, render } from './pages';
import { rerender } from './actions';

export const crumbs: CrumbHandlers = {
  home: () => { S.view = 'home'; S.homeOwner = ''; S.nav = false; render(); },
  owner: (o) => { S.view = 'home'; S.homeOwner = o; S.homeTab = 'repos'; S.nav = false; render(); if (S.hasToken && !S.repos) loadRepos(); },
  repo: (r) => openRepo(r),
};

const on: HomeHandlers = {
  tab: (t) => { S.homeTab = t; render(); },
  vis: (v) => { S.hmVis = v; render(); },
  sort: (e) => { S.hmSort = (e.target as HTMLSelectElement).value; render(); },
  group: (e) => { S.hmGroup = (e.target as HTMLSelectElement).value; render(); },
  repoFilter: (e) => { S.repoFilter = (e.target as HTMLInputElement).value; render(); },
  recentFilter: (e) => { S.recentFilter = (e.target as HTMLInputElement).value; render(); },
  rstate: (s) => { S.recentState = s; render(); },
  repo: (full) => openRepo(full),
  open: openClick, aux: openAux, ctx: openCtx, rm: rmRecent,
  addToken: tokenDialog,
  compare: (repo, br) => openNewPr(repo, br),
  dismiss: (key) => { pushDis[key] = 1; localStorage.setItem('pushdismiss', JSON.stringify(pushDis)); rerender(); },
};

export function HomeView() {
  return <><Crumbs repo="" trail={S.homeOwner ? [{ t: S.homeOwner }] : []} extra="" on={crumbs} /><Home p={homeProps()} on={on} /></>;
}
