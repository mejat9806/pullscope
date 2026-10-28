import type { VNode } from 'preact';
import { Crumbs } from '../components/PrList';
import { PrHeader } from '../components/Comments';
import type { PrHeaderHandlers } from '../components/Comments';
import { PrLayout, SplitLayout } from '../components/Pages';
import { PrSide, SIDE_KEYS } from '../components/Merge';
import type { PrSideHandlers } from '../components/Merge';
import { Attention } from '../components/Timeline';
import { I } from '../components/ui';
import { arrange, roGrip, saveOrder } from './reorder';
import { editPrDialog, rerender, rerequestReview, reviewDialog } from './actions';
import { attOn, keep, openTab, tlOn } from './handlers';
import { S, esc, icon } from './core';
import { isFolded, prHeaderProps } from './comments';
import { crumbs } from './home';
import { filesView, commitsView, sidebarProps, splitView } from './mergebox';
import { Timeline, attentionProps, checksView, timelineModel } from './timeline';

const hide = (k: string, v: boolean) => keep(() => { S.hide[k] = v; localStorage.setItem('hide', JSON.stringify(S.hide)); });

export const toggleSplit = () => { if (S.view === 'pr' && S.bundle && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') head.split(); };

const head: PrHeaderHandlers = {
  tab: openTab,
  edit: editPrDialog,
  copy: () => { navigator.clipboard?.writeText(S.bundle!.pull.head.ref); },
  review: reviewDialog,
  side: () => keep(() => { S.hide.side = !S.hide.side; localStorage.setItem('hide', JSON.stringify(S.hide)); }),
  split: () => keep(() => { S.split = !S.split; localStorage.setItem('split', S.split ? '1' : '0'); }),
};

const sideOn: PrSideHandlers = {
  fold: (k, def) => { S.fold[k] = !isFolded(k, def); localStorage.setItem('fold', JSON.stringify(S.fold)); rerender(); },
  rvtoggle: () => { S.showAllReviewers = !S.showAllReviewers; rerender(); },
  rerequest: rerequestReview,
  grip: (e, k) => roGrip(e, 'side', '.pr-side-inner > .ro-it', k, () => arrange(SIDE_KEYS, 'side', (x) => x), (o) => saveOrder('side', o)),
};

function Header() {
  const p = S.bundle!.pull, r = p.base.repo;
  const extra = <><a class="crumb gh" href={r.html_url} data-ext="" title="Open on GitHub">{I('link-external', 12)}</a>{S.refreshing ? <span class="stale">Refreshing…</span> : ''}</>;
  return <><Crumbs repo={r.full_name} trail={[{ t: 'Pull requests', repo: r.full_name }, { t: `#${p.number}` }]} extraNode={extra} on={crumbs} /><PrHeader {...prHeaderProps(S.bundle!)} on={head} /></>;
}

export function PrView() {
  const b = S.bundle!;
  if (S.split && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') return <SplitLayout header={<Header />} split={splitView(b)} />;
  const body = S.tab === 'files' ? filesView(b) : S.tab === 'commits' ? commitsView(b) : S.tab === 'checks' ? checksView(b) : null;
  const side = S.tab !== 'conversation' ? { kind: 'none' as const } : S.hide.side ? { kind: 'rail' as const } : { kind: 'aside' as const, inner: <PrSide {...sidebarProps(b)} on={sideOn} />, on: { hide: () => hide('side', true) } };
  return <PrLayout header={<Header />} body={S.tab === 'timeline' ? <div class="rail"><Timeline m={timelineModel(b)} on={tlOn} /></div> : S.tab === 'conversation' ? <><Attention {...attentionProps(b)} on={attOn} /><Timeline m={timelineModel(b)} on={tlOn} /></> : body} side={side} on={{ show: () => hide('side', false) }} />;
}

export const prView = (): VNode => <PrView />;
void esc; void icon;
