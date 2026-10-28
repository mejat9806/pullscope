import { PrHeader } from '../components/Comments';
import { PrSide, SIDE_KEYS } from '../components/Merge';
import { PrLayout, SplitLayout } from '../components/Pages';
import { Crumbs } from '../components/PrList';
import { Attention } from '../components/Timeline';
import { renderIcon } from '../components/ui';
import {
  editPrDialog,
  rerender,
  rerequestReview,
  reviewDialog,
} from './actions';
import { isFolded, prHeaderProps, stateOf } from './comments';
import { appState, esc, icon } from './core';
import { attOn, keep, openTab, tlOn } from './handlers';
import { crumbs } from './home';
import { commitsView, filesView, sidebarProps, splitView } from './mergebox';
import { metaOpen } from './meta';
import { arrange, roGrip, saveOrder } from './reorder';
import {
  attentionProps,
  checksView,
  Timeline,
  timelineModel,
} from './timeline';

import type { VNode } from 'preact';
import type { PrHeaderHandlers } from '../components/Comments';
import type { PrSideHandlers } from '../components/Merge';

// A few plain lines to paste into a standup or chat: what it is, where it stands and who has reviewed.
function prSummary(otherBundle: NonNullable<typeof appState.bundle>) {
  const pull = otherBundle.pull;
  const [, , label] = stateOf(pull);
  const latest = new Map<string, string>();

  otherBundle.timeline
    .filter(
      timelineEvent => timelineEvent.event === 'reviewed' && timelineEvent.user,
    )
    .forEach(timelineEvent => {
      const st = timelineEvent.state!.toLowerCase();

      if (st !== 'commented' || !latest.has(timelineEvent.user!.login)) {
        latest.set(timelineEvent.user!.login, st);
      }
    });

  const by = (text: string) =>
    [...latest].filter(([, value]) => value === text).map(([url]) => url);

  const rv =
    [
      by('approved').length ? `approved by ${by('approved').join(', ')}` : '',
      by('changes_requested').length
        ? `changes requested by ${by('changes_requested').join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('; ') || 'no reviews yet';

  return `${pull.title} (${pull.base.repo.full_name}#${pull.number})\n${label} · by ${pull.user.login} · +${pull.additions} −${pull.deletions} in ${pull.changed_files ?? otherBundle.files.length} files · ${rv}\n${pull.html_url}`;
}

const hide = (key: string, flag: boolean) =>
  keep(() => {
    appState.hide[key] = flag;
    localStorage.setItem('hide', JSON.stringify(appState.hide));
  });

export const toggleSplit = () => {
  if (
    appState.view === 'pr' &&
    appState.bundle &&
    appState.tab !== 'files' &&
    appState.tab !== 'checks' &&
    appState.tab !== 'timeline'
  ) {
    head.split();
  }
};

const head: PrHeaderHandlers = {
  tab: openTab,
  edit: editPrDialog,
  copy: () => {
    navigator.clipboard?.writeText(appState.bundle!.pull.head.ref);
  },
  review: reviewDialog,
  summary: () => {
    navigator.clipboard?.writeText(prSummary(appState.bundle!));
  },
  side: () =>
    keep(() => {
      appState.hide.side = !appState.hide.side;
      localStorage.setItem('hide', JSON.stringify(appState.hide));
    }),
  split: () =>
    keep(() => {
      appState.split = !appState.split;
      localStorage.setItem('split', appState.split ? '1' : '0');
    }),
};

const sideOn: PrSideHandlers = {
  fold: (key, def) => {
    appState.fold[key] = !isFolded(key, def);
    localStorage.setItem('fold', JSON.stringify(appState.fold));
    rerender();
  },
  rvtoggle: () => {
    appState.showAllReviewers = !appState.showAllReviewers;
    rerender();
  },
  rerequest: rerequestReview,
  edit: sideKey => {
    if (
      sideKey === 'labels' ||
      sideKey === 'assignees' ||
      sideKey === 'milestone'
    ) {
      metaOpen(sideKey);
    }
  },
  grip: (event, sideKey) =>
    roGrip(
      event,
      'side',
      '.pr-side-inner > .ro-it',
      sideKey,
      () => arrange(SIDE_KEYS, 'side', otherSideKey => otherSideKey),
      options => saveOrder('side', options),
    ),
};

function Header() {
  const pull = appState.bundle!.pull;
  const row = pull.base.repo;

  const extra = (
    <>
      <a
        class="crumb gh"
        href={row.html_url}
        data-ext=""
        title="Open on GitHub"
      >
        {renderIcon('link-external', 12)}
      </a>
      {appState.refreshing ? <span class="stale">Refreshing…</span> : ''}
    </>
  );

  return (
    <>
      <Crumbs
        repo={row.full_name}
        trail={[
          { t: 'Pull requests', repo: row.full_name },
          { t: `#${pull.number}` },
        ]}
        extraNode={extra}
        on={crumbs}
      />
      <PrHeader {...prHeaderProps(appState.bundle!)} on={head} />
    </>
  );
}

export function PrView() {
  const bundle = appState.bundle!;

  if (
    appState.split &&
    appState.tab !== 'files' &&
    appState.tab !== 'checks' &&
    appState.tab !== 'timeline'
  ) {
    return <SplitLayout header={<Header />} split={splitView(bundle)} />;
  }

  const body =
    appState.tab === 'files'
      ? filesView(bundle)
      : appState.tab === 'commits'
        ? commitsView(bundle)
        : appState.tab === 'checks'
          ? checksView(bundle)
          : null;

  const side =
    appState.tab !== 'conversation'
      ? { kind: 'none' as const }
      : appState.hide.side
        ? { kind: 'rail' as const }
        : {
            kind: 'aside' as const,
            inner: <PrSide {...sidebarProps(bundle)} on={sideOn} />,
            on: { hide: () => hide('side', true) },
          };

  return (
    <PrLayout
      header={<Header />}
      body={
        appState.tab === 'timeline' ? (
          <div class="rail">
            <Timeline m={timelineModel(bundle)} on={tlOn} />
          </div>
        ) : appState.tab === 'conversation' ? (
          <>
            <Attention {...attentionProps(bundle)} on={attOn} />
            <Timeline m={timelineModel(bundle)} on={tlOn} />
          </>
        ) : (
          body
        )
      }
      side={side}
      on={{ show: () => hide('side', false) }}
    />
  );
}

export const prView = (): VNode => <PrView />;

void esc;
void icon;
