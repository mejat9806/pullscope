import { Composer, MergeAct } from '../components/Actions';
import { CommentBox } from '../components/Comments';
import { ReviewBlock } from '../components/Diff';
import { ClosedBox, MergeBox, MergedBox } from '../components/Merge';
import {
  Bars,
  Checks,
  CommitRow,
  CommitRun,
  Committed,
  CrossRef,
  FoldBar,
  LabelRow,
  MergedRow,
  Referenced,
  Simple,
} from '../components/Timeline';
import { composerProps, mergeActProps } from './actions';
import { commentBoxProps, isFolded } from './comments';
import { appState, setFlash } from './core';
import { reviewBlockProps } from './diff';
import { mergeModel } from './mergebox';
import { render } from './pages';

import type { ComponentChildren, VNode } from 'preact';
import type {
  ComposerHandlers,
  ComposerProps,
  MergeActHandlers,
  MergeActProps,
} from '../components/Actions';
import type { CommentBoxProps, ConvHandlers } from '../components/Comments';
import type { ReviewBlockProps } from '../components/Diff';
import type { MergeBoxHandlers } from '../components/Merge';
import type {
  AttItem,
  BarHandlers,
  CommitRowProps,
  CrossRefProps,
  RangeBarProps,
  ReferencedProps,
  SimpleProps,
  WhoBarProps,
} from '../components/Timeline';
import type {
  Bundle,
  Check,
  CommentLike,
  Person,
  TimelineEvent,
} from '../types';
import type { MergeModel } from './mergebox';

export function rangeBounds() {
  const value = 3600e3;
  const now = Date.now();
  const text = appState.range;

  if (text === '1h') {
    return [now - value, Infinity];
  }

  if (text === '24h') {
    return [now - 24 * value, Infinity];
  }

  if (text === '7d') {
    return [now - 7 * 24 * value, Infinity];
  }

  if (text === '30d') {
    return [now - 30 * 24 * value, Infinity];
  }

  if (text === 'custom') {
    const lo = appState.rFrom
      ? new Date(`${appState.rFrom}T00:00:00`).getTime()
      : -Infinity;

    const hi = appState.rTo
      ? new Date(`${appState.rTo}T23:59:59.999`).getTime()
      : Infinity;

    return [lo, hi];
  }

  return [-Infinity, Infinity];
}

// Rows hold prebuilt HTML for comment boxes and reviews (still string views); everything else is data for live components.
export type TlRow =
  | { t: 'referenced'; p: ReferencedProps }
  | { t: 'comment'; p: CommentBoxProps }
  | { t: 'review'; p: ReviewBlockProps }
  | { t: 'run'; n: number; first: string; last: string }
  | { t: 'committed'; row: CommitRowProps }
  | {
      t: 'merged';
      actor: Person | null | undefined;
      commit: string;
      base: string;
      at: string;
    }
  | { t: 'brk' }
  | { t: 'cross'; p: CrossRefProps }
  | {
      t: 'label';
      actor: Person | null | undefined;
      verb: string;
      color: string;
      name: string;
      at: string;
    }
  | { t: 'simple'; p: SimpleProps };

export interface TlModel {
  who: WhoBarProps | null;
  range: RangeBarProps;
  rows: TlRow[];
  empty: string;
  merge: MergeModel | null;
  act: MergeActProps | null;
  composer: ComposerProps;
}

export function timelineModel(bundle: Bundle): TlModel {
  const pull = bundle.pull;
  const out: TlRow[] = [];

  const evUser = (timelineEvent: TimelineEvent) => {
    const value =
      timelineEvent.user || timelineEvent.actor || timelineEvent.author;

    return value?.login || (value as Person | undefined)?.name || '';
  };

  const people = new Map<string, { u: Person; n: number }>();

  const bump = (person?: Person | null) => {
    if (!person?.login) {
      return;
    }

    const row = people.get(person.login) || { u: person, n: 0 };
    row.n++;
    people.set(person.login, row);
  };

  bump(pull.user);

  bundle.timeline.forEach(timelineEvent => {
    if (
      timelineEvent.event === 'commented' ||
      timelineEvent.event === 'reviewed'
    ) {
      bump(timelineEvent.user);
    }
  });

  bundle.review_comments.forEach(reviewComment => bump(reviewComment.user));
  appState.who = appState.who.filter(word => people.has(word));

  const { who } = appState;
  const on = who.length > 0;

  const byUser = on
    ? bundle.timeline.filter(
        timelineEvent =>
          who.includes(evUser(timelineEvent)) ||
          (timelineEvent.event === 'reviewed' &&
            bundle.review_comments.some(
              reviewComment =>
                reviewComment.pull_request_review_id === timelineEvent.id &&
                who.includes(reviewComment.user?.login),
            )),
      )
    : bundle.timeline;

  const byKind = appState.unres
    ? byUser.filter(timelineEvent => timelineEvent.event === 'reviewed')
    : byUser;

  // Date filter: an event counts when its own time is in range; a review also counts when any of its comments or replies is.
  const evTime = (timelineEvent: TimelineEvent) =>
    timelineEvent.created_at ||
    timelineEvent.submitted_at ||
    timelineEvent.committer?.date ||
    timelineEvent.author?.date ||
    '';

  const [rLo, rHi] = rangeBounds();
  const rangeOn = appState.range !== 'all';

  const inRange = (text: string) => {
    const left = text ? Date.parse(text) : NaN;

    return isNaN(left) || (left >= rLo && left <= rHi);
  };

  const keep = !rangeOn
    ? byKind
    : byKind.filter(
        timelineEvent =>
          inRange(evTime(timelineEvent)) ||
          (timelineEvent.event === 'reviewed' &&
            bundle.review_comments.some(
              reviewComment =>
                reviewComment.pull_request_review_id === timelineEvent.id &&
                inRange(reviewComment.created_at),
            )) ||
          (timelineEvent.event === 'reviewed' &&
            bundle.review_comments.some(
              reviewComment =>
                inRange(reviewComment.created_at) &&
                bundle.review_comments.some(
                  otherReviewComment =>
                    otherReviewComment.id === reviewComment.in_reply_to_id &&
                    otherReviewComment.pull_request_review_id ===
                      timelineEvent.id,
                ),
            )),
      );

  if (!appState.unres && (!on || who.includes(pull.user.login))) {
    out.push({
      t: 'comment',
      p: commentBoxProps(
        {
          ...pull,
          created_at: pull.created_at,
          html_url: pull.html_url,
          reactions: pull.reactions,
        },
        { isPr: true, flush: true },
      ),
    });
  }

  // Long runs of commits collapse into one row (the Commits tab lists them), so comments stay reachable.
  const evs = [];

  for (let index = 0; index < keep.length;) {
    let otherIndex = index;

    while (otherIndex < keep.length && keep[otherIndex].event === 'committed') {
      otherIndex++;
    }

    if (otherIndex - index >= 6) {
      evs.push({
        event: 'commit-run',
        n: otherIndex - index,
        first: keep[index],
        last: keep[otherIndex - 1],
      });

      index = otherIndex;
    } else {
      evs.push(keep[index]);
      index++;
    }
  }

  if (appState.sort === 'desc') {
    evs.reverse();
  }

  const info = bundle.commit_info || {};

  const simpleRow = (
    timelineEvent: TimelineEvent,
    ic: string,
    text: ComponentChildren,
    kind = '',
  ) =>
    out.push({
      t: 'simple',
      p: {
        actor: timelineEvent.actor,
        ic,
        text,
        kind,
        at: timelineEvent.created_at!,
      },
    });

  for (const timelineEvent of evs) {
    switch (timelineEvent.event) {
      case 'commented':
        out.push({
          t: 'comment',
          p: commentBoxProps(timelineEvent as CommentLike),
        });

        break;
      case 'commit-run':
        out.push({
          t: 'run',
          n: timelineEvent.n!,
          first: timelineEvent.first!.sha!.slice(0, 7),
          last: timelineEvent.last!.sha!.slice(0, 7),
        });

        break;
      case 'reviewed': {
        const rp = reviewBlockProps(timelineEvent, bundle);

        if (rp) {
          out.push({ t: 'review', p: rp });
        }

        break;
      }

      case 'committed':
        out.push({
          t: 'committed',
          row: {
            first: String(timelineEvent.message || '').split('\n')[0],
            sha: timelineEvent.sha!,
            author:
              info[timelineEvent.sha!]?.author ||
              (timelineEvent.author?.avatar_url ? timelineEvent.author : null),
            url: timelineEvent.html_url!,
            verification: timelineEvent.verification,
          },
        });

        break;
      case 'referenced': {
        const ci = info[timelineEvent.commit_id!];
        const ml = ci ? ci.message.split('\n')[0] : '';

        out.push({
          t: 'referenced',
          p: {
            actor: timelineEvent.actor,
            at: timelineEvent.created_at!,
            commit: ci
              ? { author: ci.author, html_url: ci.html_url, sha: ci.sha }
              : null,
            msg: ml,
          },
        });

        break;
      }

      case 'merged':
        out.push(
          {
            t: 'merged',
            actor: timelineEvent.actor,
            commit: (timelineEvent.commit_id || '').slice(0, 7),
            base: pull.base.label ?? '',
            at: timelineEvent.created_at!,
          },
          { t: 'brk' },
        );

        break;
      case 'closed':
        if (!pull.merged) {
          simpleRow(
            timelineEvent,
            'git-pull-request-closed',
            'closed this',
            'danger',
          );
        }

        break;
      case 'reopened':
        simpleRow(
          timelineEvent,
          'git-pull-request',
          'reopened this',
          'success',
        );

        break;
      case 'cross-referenced': {
        const item = timelineEvent.source?.issue;

        if (!item) {
          break;
        }

        const isPr = !!item.pull_request;

        out.push({
          t: 'cross',
          p: {
            actor: timelineEvent.actor,
            at: timelineEvent.created_at!,
            isPr,
            open: item.state === 'open',
            icon: isPr
              ? item.state === 'open'
                ? 'git-pull-request'
                : 'git-merge'
              : 'issue-opened',
            url: item.html_url,
            title: item.title.split('\n')[0].slice(0, 120),
            repo: item.repository?.full_name || '',
            number: item.number,
          },
        });

        break;
      }

      case 'labeled':
      case 'unlabeled':
        out.push({
          t: 'label',
          actor: timelineEvent.actor,
          verb: timelineEvent.event === 'labeled' ? 'added' : 'removed',
          color: timelineEvent.label?.color ?? '',
          name: timelineEvent.label?.name ?? '',
          at: timelineEvent.created_at!,
        });

        break;
      case 'assigned':
      case 'unassigned':
        simpleRow(
          timelineEvent,
          'person',
          `${timelineEvent.event} ${timelineEvent.assignee ? timelineEvent.assignee.login : ''}`,
        );

        break;
      case 'review_requested':
        simpleRow(
          timelineEvent,
          'eye',
          `requested a review from ${timelineEvent.requested_reviewer?.login || timelineEvent.requested_team?.name || ''}`,
        );

        break;
      case 'renamed':
        simpleRow(
          timelineEvent,
          'pencil',
          <>
            changed the title <s>{timelineEvent.rename?.from}</s>{' '}
            {timelineEvent.rename?.to}
          </>,
        );

        break;
      case 'head_ref_force_pushed':
        simpleRow(timelineEvent, 'repo-push', 'force-pushed the head branch');
        break;
      case 'head_ref_deleted':
        simpleRow(timelineEvent, 'git-branch', 'deleted the head branch');
        break;
      case 'ready_for_review':
        simpleRow(
          timelineEvent,
          'eye',
          'marked this pull request as ready for review',
        );

        break;
      case 'convert_to_draft':
        simpleRow(
          timelineEvent,
          'git-pull-request-draft',
          'marked this pull request as draft',
        );

        break;
      case 'milestoned':
        simpleRow(
          timelineEvent,
          'milestone',
          `added this to the ${timelineEvent.milestone?.title ?? ''} milestone`,
        );

        break;
      case 'locked':
        simpleRow(timelineEvent, 'lock', 'locked this conversation');
        break;
      default:
        break; // subscribed, unsubscribed, mentioned: hidden by GitHub as well
    }
  }

  return {
    who:
      people.size > 1
        ? {
            everyone: !on,
            people: [...people.values()]
              .sort((leftItem, rightItem) => rightItem.n - leftItem.n)
              .map(({ u: person, n: count }) => ({
                u: person,
                n: count,
                on: who.includes(person.login!),
              })),
          }
        : null,
    range: {
      range: appState.range,
      from: appState.rFrom,
      to: appState.rTo,
      desc: appState.sort === 'desc',
    },
    rows: out,
    empty:
      !evs.length && (on || rangeOn)
        ? rangeOn
          ? 'No activity in this period.'
          : 'Nothing from the selected accounts.'
        : '',
    merge: on ? null : mergeModel(bundle),
    act: mergeActProps(bundle),
    composer: composerProps(bundle),
  };
}

export const checkState = (check: Check) =>
  check.status !== 'completed'
    ? 'pending'
    : check.conclusion === 'success'
      ? 'pass'
      : ['skipped', 'neutral'].includes(check.conclusion!)
        ? 'skip'
        : 'fail';

export const CK: Record<string, [string, string]> = {
  pass: ['check-circle-fill', 'Passed'],
  fail: ['x-circle-fill', 'Failed'],
  pending: ['dot-fill', 'In progress'],
  skip: ['circle-slash', 'Skipped'],
};

export const reqBadge = (check: Check) =>
  (appState.bundle?.required_checks || []).includes(check.name)
    ? '<span class="ck-req" title="Required by branch protection">Required</span>'
    : '';

export function checksView(bundle: Bundle): VNode {
  const list = (bundle.checks || []).map(check => ({
    ...check,
    st: checkState(check),
  }));

  if (!list.length) {
    return (
      <div class="diff-empty">No checks reported for the latest commit.</div>
    );
  }

  const handler = (text: string) =>
    list.filter(item => item.st === text).length;

  const rank: Record<string, number> = {
    fail: 0,
    pending: 1,
    pass: 2,
    skip: 3,
  };

  list.sort(
    (leftItem, rightItem) =>
      rank[leftItem.st] - rank[rightItem.st] ||
      String(leftItem.name).localeCompare(String(rightItem.name)),
  );

  const head = handler('fail')
    ? ['fail', `${handler('fail')} failing`]
    : handler('pending')
      ? ['pending', `${handler('pending')} in progress`]
      : ['pass', 'All checks passed'];

  const dur = (check: Check) => {
    const size = Date.parse(check.started_at!);
    const value = Date.parse(check.completed_at!);

    if (!size || !value || value < size) {
      return '';
    }

    const time = Math.round((value - size) / 1000);

    return time >= 60 ? `${Math.floor(time / 60)}m ${time % 60}s` : `${time}s`;
  };

  const rows = list.map(item => ({
    name: item.name,
    st: item.st,
    url: item.url,
    desc: item.description || (item.app ? item.app : ''),
    req: (appState.bundle?.required_checks || []).includes(item.name),
    status:
      item.st === 'fail' && item.conclusion && item.conclusion !== 'failure'
        ? item.conclusion.replace(/_/g, ' ')
        : CK[item.st][1],
    dur: dur(item),
    icon: CK[item.st][0],
  }));

  return (
    <Checks
      head={[head[0], head[1]]}
      headIcon={CK[head[0]][0]}
      summary={[
        handler('fail') && `${handler('fail')} failing`,
        handler('pending') && `${handler('pending')} in progress`,
        handler('pass') && `${handler('pass')} passed`,
        handler('skip') && `${handler('skip')} skipped`,
      ]
        .filter(Boolean)
        .join(' · ')}
      rows={rows}
    />
  );
}

export function unresolvedRoots(bundle: Bundle) {
  const res = new Set(bundle.resolved_ids || []);

  return bundle.review_comments.filter(
    reviewComment =>
      !reviewComment.in_reply_to_id && !res.has(reviewComment.id),
  );
}

export function attentionProps(bundle: Bundle) {
  const pull = bundle.pull;
  const rc = bundle.review_comments;
  const roots = rc.filter(reviewComment => !reviewComment.in_reply_to_id);
  const open = unresolvedRoots(bundle);
  const known = appState.hasToken || (bundle.resolved_ids || []).length > 0;
  const latest = new Map();

  bundle.timeline
    .filter(
      timelineEvent => timelineEvent.event === 'reviewed' && timelineEvent.user,
    )
    .forEach(timelineEvent => {
      const st = timelineEvent.state!.toLowerCase();

      if (st === 'commented' && latest.has(timelineEvent.user!.login)) {
        return;
      }

      latest.set(timelineEvent.user!.login, st);
    });

  const cr = [...latest.values()].filter(
    value => value === 'changes_requested',
  ).length;

  const ap = [...latest.values()].filter(value => value === 'approved').length;
  const ck = (bundle.checks || []).map(checkState);
  const fail = ck.filter(status => status === 'fail').length;
  const pend = ck.filter(status => status === 'pending').length;
  const pass = ck.filter(status => status === 'pass').length;
  const it: AttItem[] = [];

  const add = (
    key: string,
    ic: string,
    text: string,
    attr: Partial<AttItem> = {},
  ) => it.push({ k: key, ic, text, ...attr });

  if (roots.length) {
    if (!known) {
      add(
        '',
        'comment',
        `${roots.length} review thread${roots.length === 1 ? '' : 's'}`,
      );
    } else if (open.length) {
      add(
        'bad',
        'comment',
        `${open.length} unresolved thread${open.length === 1 ? '' : 's'}`,
        { id: 'nextun', title: 'Jump to the next unresolved thread' },
      );
    } else {
      add('ok', 'check-circle-fill', 'All threads resolved');
    }
  }

  add(
    cr ? 'bad' : ap ? 'ok' : '',
    cr ? 'file-diff' : ap ? 'check' : 'eye',
    cr
      ? `${cr} requesting changes`
      : ap
        ? `${ap} approved`
        : 'No approvals yet',
  );

  if (ck.length) {
    add(
      fail ? 'bad' : pend ? 'warn' : 'ok',
      fail ? 'x-circle-fill' : pend ? 'dot-fill' : 'check-circle-fill',
      fail
        ? `${fail} check${fail === 1 ? '' : 's'} failing`
        : pend
          ? `${pend} check${pend === 1 ? '' : 's'} running`
          : `${pass} check${pass === 1 ? '' : 's'} passed`,
      { dataTab: 'checks', title: 'Open checks' },
    );
  }

  if (pull.merged) {
    add('done', 'git-merge', 'Merged');
  } else if (pull.state === 'closed') {
    add('bad', 'git-pull-request-closed', 'Closed');
  } else if (pull.mergeable === false || pull.mergeable_state === 'dirty') {
    add('bad', 'alert', 'Has conflicts');
  } else if (pull.mergeable_state === 'clean') {
    add('ok', 'git-merge', 'Ready to merge');
  } else if (pull.draft) {
    add('', 'git-pull-request-draft', 'Draft');
  }

  return { items: it, unres: appState.unres, showUnres: roots.length > 0 };
}

export function jumpUnresolved() {
  const bundle = appState.bundle;
  const list = unresolvedRoots(bundle!);

  if (!list.length) {
    return;
  }

  const reviewComment = list[appState.unIdx % list.length];
  appState.unIdx++;

  const first =
    bundle!.review_comments.find(
      otherReviewComment =>
        otherReviewComment.pull_request_review_id ===
          reviewComment.pull_request_review_id &&
        otherReviewComment.path === reviewComment.path &&
        (otherReviewComment.original_position ??
          otherReviewComment.position) ===
          (reviewComment.original_position ?? reviewComment.position),
    ) || reviewComment;

  appState.fold[`r:${reviewComment.pull_request_review_id}`] = false;
  appState.fold[`t:${first.id}`] = false;
  appState.fold[`c:${reviewComment.id}`] = false;
  localStorage.setItem('fold', JSON.stringify(appState.fold));
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;

  setFlash(`c-${reviewComment.id}`, { block: 'center', smooth: true });
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
}

export interface FoldKey {
  k: string;
  def: boolean;
}

// Every fold toggle the timeline draws, so "collapse all" works from state rather than from the DOM.
export const foldKeys = (tlModel: TlModel): FoldKey[] =>
  tlModel.rows.flatMap((tlRow): FoldKey[] =>
    tlRow.t === 'comment'
      ? [{ k: `c:${tlRow.p.c.id}`, def: false }]
      : tlRow.t === 'review'
        ? [
            { k: tlRow.p.k, def: tlRow.p.allRes },
            ...tlRow.p.threads.map(rvThread => ({
              k: rvThread.k,
              def: rvThread.def,
            })),
          ]
        : [],
  );

export interface TlHandlers {
  conv: ConvHandlers;
  bars: BarHandlers;
  foldAll: (keys: FoldKey[]) => void;
  tab: (key: string) => void;
  merge: MergeBoxHandlers;
  act: MergeActHandlers;
  composer: ComposerHandlers;
}

function Row({ r: tlRow, on }: { r: TlRow; on?: TlHandlers }) {
  switch (tlRow.t) {
    case 'referenced':
      return <Referenced {...tlRow.p} />;
    case 'comment':
      return <CommentBox {...tlRow.p} on={on?.conv} />;
    case 'review':
      return <ReviewBlock {...tlRow.p} on={on?.conv} />;
    case 'run':
      return (
        <CommitRun
          n={tlRow.n}
          first={tlRow.first}
          last={tlRow.last}
          onTab={on?.tab}
        />
      );
    case 'committed':
      return <Committed row={<CommitRow {...tlRow.row} />} />;
    case 'merged':
      return (
        <MergedRow
          actor={tlRow.actor}
          commit={tlRow.commit}
          base={tlRow.base}
          at={tlRow.at}
        />
      );
    case 'brk':
      return <div class="TLI-break"></div>;
    case 'cross':
      return <CrossRef {...tlRow.p} />;
    case 'label':
      return (
        <LabelRow
          actor={tlRow.actor}
          verb={tlRow.verb}
          color={tlRow.color}
          name={tlRow.name}
          at={tlRow.at}
        />
      );
    case 'simple':
      return <Simple {...tlRow.p} />;
    default:
      return null;
  }
}

export function Timeline({ m: tlModel, on }: { m: TlModel; on?: TlHandlers }) {
  const box =
    tlModel.merge &&
    (tlModel.merge.kind === 'merged' ? (
      <MergedBox head={tlModel.merge.head} />
    ) : tlModel.merge.kind === 'closed' ? (
      <ClosedBox head={tlModel.merge.head} />
    ) : (
      <MergeBox {...tlModel.merge.p} on={on?.merge} />
    ));

  const keys = foldKeys(tlModel);

  return (
    <>
      <Bars who={tlModel.who} range={tlModel.range} on={on?.bars} />
      <FoldBar
        folded={
          keys.length > 0 &&
          keys.every(foldKey => isFolded(foldKey.k, foldKey.def))
        }
        onClick={() => on?.foldAll(keys)}
      />
      <div class="TL">
        {tlModel.rows.map(tlRow => (
          <Row r={tlRow} on={on} />
        ))}
        {tlModel.empty ? <div class="diff-empty">{tlModel.empty}</div> : ''}
      </div>
      {box}
      {tlModel.act ? <MergeAct {...tlModel.act} on={on?.act} /> : ''}
      <Composer {...tlModel.composer} on={on?.composer} />
    </>
  );
}
