import type { VNode } from 'preact';
import { Crumbs } from '../components/PrList';
import { PrHeader } from '../components/Comments';
import type { PrHeaderHandlers } from '../components/Comments';
import { PrLayout, SplitLayout } from '../components/Pages';
import { PrSide } from '../components/Merge';
import type { PrSideHandlers } from '../components/Merge';
import { Attention } from '../components/Timeline';
import type { TlHandlers } from './timeline';
import { I, Island } from '../components/ui';
import { applySuggestion, cbarKey, cmMenu, getMine, sendReply, threadAct, disableAuto, doMerge, editPrDialog, enableAuto, markReady, rerequestReview, reactAdd, reactToggle, rerender, rerunChecks, reviewDialog, sendComment, toDraft, toggleClosed, toggleComposer, toggleMb, updateBranch } from './actions';
import { foldAllConv } from './bind';
import { foldToggle } from './fold';
import { S, esc, icon } from './core';
import { isFolded, prHeaderProps } from './comments';
import { crumbs } from './home';
import { filesView, commitsView, sidebarProps, splitView } from './mergebox';
import { render } from './pages';
import { Timeline, attentionProps, checksView, jumpUnresolved, timelineModel } from './timeline';

const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };
const hide = (k: string, v: boolean) => keep(() => { S.hide[k] = v; localStorage.setItem('hide', JSON.stringify(S.hide)); });

const head: PrHeaderHandlers = {
  tab: (k) => { S.tab = k; render(); document.querySelector('.main')!.scrollTop = 0; },
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
};

const tlOn: TlHandlers = {
  conv: { fold: foldToggle, menu: cmMenu, react: { toggle: reactToggle, add: reactAdd, hover: (kind, id) => { getMine(kind, id); } }, thread: threadAct, sug: applySuggestion, reply: sendReply },
  bars: {
    who: (w) => keep(() => { S.who = S.who.includes(w) ? S.who.filter((x) => x !== w) : [...S.who, w]; }),
    whoClear: () => keep(() => { S.who = []; }),
    range: (e) => keep(() => { S.range = (e.target as HTMLInputElement).value; if (S.range === 'custom' && !S.rFrom && !S.rTo) { const d = (t: number) => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); S.rTo = d(Date.now()); S.rFrom = d(Date.now() - 7 * 864e5); } }),
    from: (e) => keep(() => { S.rFrom = (e.target as HTMLInputElement).value; }),
    to: (e) => keep(() => { S.rTo = (e.target as HTMLInputElement).value; }),
    sort: () => keep(() => { S.sort = S.sort === 'desc' ? 'asc' : 'desc'; localStorage.setItem('csort', S.sort); }),
  },
  foldAll: foldAllConv,
  tab: head.tab,
  merge: { toggle: toggleMb, rerun: rerunChecks, update: updateBranch, ready: markReady },
  act: { close: toggleClosed, merge: doMerge, noauto: disableAuto, auto: enableAuto, draft: toDraft },
  composer: { toggle: toggleComposer, key: cbarKey, send: sendComment, close: toggleClosed },
};

function Header() {
  const p = S.bundle!.pull, r = p.base.repo;
  const extra = <><a class="crumb gh" href={r.html_url} data-ext="" title="Open on GitHub">{I('link-external', 12)}</a>{S.refreshing ? <span class="stale">Refreshing…</span> : ''}</>;
  return <><Crumbs repo={r.full_name} trail={[{ t: 'Pull requests', repo: r.full_name }, { t: `#${p.number}` }]} extra="" extraNode={extra} on={crumbs} /><PrHeader {...prHeaderProps(S.bundle!)} on={head} /></>;
}

export function PrView() {
  const b = S.bundle!;
  if (S.split && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') return <SplitLayout header={<Header />} split={<Island html={splitView(b)} />} />;
  const body = S.tab === 'files' ? filesView(b) : S.tab === 'commits' ? commitsView(b) : S.tab === 'checks' ? checksView(b) : '';
  const side = S.tab !== 'conversation' ? { kind: 'none' as const } : S.hide.side ? { kind: 'rail' as const } : { kind: 'aside' as const, inner: <PrSide {...sidebarProps(b)} on={sideOn} />, on: { hide: () => hide('side', true) } };
  return <PrLayout header={<Header />} body={S.tab === 'timeline' ? <div class="rail"><Timeline m={timelineModel(b)} on={tlOn} /></div> : S.tab === 'conversation' ? <><Attention {...attentionProps(b)} on={{ next: jumpUnresolved, unres: () => keep(() => { S.unres = !S.unres; }), tab: head.tab }} /><Timeline m={timelineModel(b)} on={tlOn} /></> : <Island html={body} />} side={side} on={{ show: () => hide('side', false) }} />;
}

export const prView = (): VNode => <PrView />;
void esc; void icon;
