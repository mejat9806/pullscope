import {
  CommitsList,
  FcBar,
  FileBox,
  FilesBar,
  SplitView,
} from '../components/Merge';
import { Attention, CommitRow as CommitRowView } from '../components/Timeline';
import { errMsg, rerender } from './actions';
import { isFolded } from './comments';
import { appState, queryElement, tauri, when } from './core';
import { diffTable, pendList } from './diff';
import { beginDrag } from './frame';
import { attOn, convOn, diffOn, filesOn, tlOn } from './handlers';
import { render, repaintShell, setDragging } from './pages';
import { scrolled } from './scrolling';
import {
  attentionProps,
  checkState,
  CK,
  Timeline,
  timelineModel,
} from './timeline';
import { isViewed, toggleViewed, viewedAll, viewedCount } from './viewed';

import type { VNode } from 'preact';
import type {
  CkGroup,
  CommitsDialogProps,
  MergeBoxProps,
  PrSideProps,
  SplitHandlers,
} from '../components/Merge';
import type {
  Bundle,
  CommitRow,
  FileChange,
  FrRange,
  Reviewer,
  User,
} from '../types';

export type MergeModel =
  | { kind: 'merged'; head: string }
  | { kind: 'closed'; head: string }
  | { kind: 'open'; p: MergeBoxProps };

export function mergeModel(bundle: Bundle): MergeModel {
  const pull = bundle.pull;
  const head = pull.head.label!.split(':')[1];

  if (pull.merged) {
    return { kind: 'merged', head };
  }

  if (pull.state === 'closed') {
    return { kind: 'closed', head };
  }

  const clean = pull.mergeable_state === 'clean' || pull.mergeable !== false;
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

  const ap = [...latest.values()].filter(value => value === 'approved').length;

  const cr = [...latest.values()].filter(
    value => value === 'changes_requested',
  ).length;

  const pendRev = (pull.requested_reviewers || []).length;

  const rvHead = cr
    ? [
        'bad',
        'x-circle-fill',
        'Changes requested',
        `${cr} reviewer${cr === 1 ? '' : 's'} requested changes`,
      ]
    : ap
      ? [
          'ok',
          'check-circle-fill',
          'Changes approved',
          `${ap} approving review${ap === 1 ? '' : 's'}`,
        ]
      : [
          '',
          'eye',
          'Review not yet submitted',
          pendRev
            ? `${pendRev} pending review${pendRev === 1 ? '' : 's'}`
            : 'No reviews yet',
        ];

  const list = (bundle.checks || []).map(check => ({
    ...check,
    st: checkState(check),
  }));

  const cnt = (key: string) => list.filter(item => item.st === key).length;

  const ckHead = cnt('fail')
    ? [
        'bad',
        'x-circle-fill',
        `${cnt('fail')} check${cnt('fail') === 1 ? '' : 's'} failing`,
      ]
    : cnt('pending')
      ? [
          '',
          'dot-fill',
          `${cnt('pending')} check${cnt('pending') === 1 ? '' : 's'} in progress`,
        ]
      : ['ok', 'check-circle-fill', 'All checks have passed'];

  const ckSub = [
    cnt('skip') && `${cnt('skip')} neutral`,
    cnt('pass') && `${cnt('pass')} successful`,
    cnt('fail') && `${cnt('fail')} failing`,
    cnt('pending') && `${cnt('pending')} pending`,
  ]
    .filter(Boolean)
    .join(', ');

  const grp = (key: string, title: string): CkGroup[] => {
    const groups = list.filter(item => item.st === key);

    if (!groups.length) {
      return [];
    }

    const open = appState.mbOpen?.has(`g${key}`) ?? key !== 'pass';

    return [
      {
        k: key,
        title,
        open,
        items: groups.map(item => ({
          st: item.st,
          url: item.url,
          icon: CK[item.st][0],
          name: item.name,
          req: (appState.bundle?.required_checks || []).includes(item.name),
          desc: item.description || item.app || '',
        })),
      },
    ];
  };

  return {
    kind: 'open',
    p: {
      draft: !!pull.draft,
      busyReady: appState.busy === 'ready',
      errReady: errMsg('ready'),
      rv: {
        h: rvHead,
        open: !!appState.mbOpen?.has('rv'),
        ap,
        cr,
        pend: pendRev,
        pendNames: (pull.requested_reviewers || [])
          .map(user => user.login)
          .join(', '),
      },
      ck: list.length
        ? {
            h: ckHead.concat(ckSub),
            open: !!appState.mbOpen?.has('ck'),
            rerunable: list.some(
              item =>
                item.st === 'fail' && /\/actions\/runs\//.test(item.url || ''),
            ),
            groups: [
              ...grp('fail', 'Failing checks'),
              ...grp('pending', 'In progress'),
              ...grp('skip', 'Neutral checks'),
              ...grp('pass', 'Successful checks'),
            ],
          }
        : null,
      behind: pull.mergeable_state === 'behind',
      busyUpdate: appState.busy === 'update_branch',
      baseRef: pull.base.ref,
      errUpdate: errMsg('update_branch'),
      clean,
    },
  };
}

export function sidebarProps(bundle: Bundle): PrSideProps {
  const pull = bundle.pull;
  const reviewers = new Map<string, Reviewer>();

  pull.requested_reviewers.forEach(user =>
    reviewers.set(user.login, { u: user, st: 'req' }),
  );

  bundle.timeline
    .filter(timelineEvent => timelineEvent.event === 'reviewed')
    .forEach(timelineEvent => {
      const st = timelineEvent.state!.toLowerCase();
      const cur = reviewers.get(timelineEvent.user!.login);

      if (cur?.st === 'req') {
        if (!cur.prev || st === 'approved' || st === 'changes_requested') {
          cur.prev = st;
        }
      } else if (!cur || st === 'approved' || st === 'changes_requested') {
        reviewers.set(timelineEvent.user!.login, {
          u: timelineEvent.user!,
          st,
        });
      }
    });

  const canRe = !pull.merged && pull.state === 'open';

  // Reviewers with a verdict come first (changes requested, approved, commented), people still to answer after them, bots last.
  const rank = (reviewer: Reviewer) => {
    const verdict = reviewer.st === 'req' ? reviewer.prev : reviewer.st;

    if (reviewer.u.login.endsWith('[bot]')) {
      return 4;
    }

    if (verdict === 'changes_requested') {
      return 0;
    }

    if (verdict === 'approved') {
      return 1;
    }

    return verdict ? 2 : 3;
  };

  const rv = [...reviewers.values()]
    .sort((first, second) => rank(first) - rank(second))
    .map(reviewer => ({
      ...reviewer,
      canRe:
        canRe && reviewer.st !== 'req' && reviewer.u.login !== pull.user.login,
    }));

  const people = new Map<string, User>();

  [
    pull.user,
    ...bundle.timeline.map(
      timelineEvent =>
        timelineEvent.user || timelineEvent.actor || timelineEvent.author,
    ),
  ].forEach(
    value =>
      value &&
      value.login &&
      !people.has(value.login) &&
      people.set(value.login, value as User),
  );

  return {
    reviewers: rv,
    showAll: !!appState.showAllReviewers,
    assignees: pull.assignees,
    labels: pull.labels,
    milestone: pull.milestone ?? null,
    people: [...people.values()].slice(0, 30),
    peopleCount: people.size,
    folded: {
      reviewers: isFolded('sb:Reviewers'),
      assignees: isFolded('sb:Assignees'),
      labels: isFolded('sb:Labels'),
      milestone: isFolded('sb:Milestone'),
      people: isFolded('sb:people'),
    },
  };
}

// Files changed can show all commits, one commit, or a consecutive range (indices into commitList, oldest first).
export const frKey = (cs: CommitRow[], frRange: FrRange) =>
  frRange.a === frRange.b
    ? cs[frRange.a].sha
    : `${cs[frRange.a].parent}..${cs[frRange.b].sha}`;

export function frDiff(bundle: Bundle) {
  const cs = commitList(bundle);
  const frRange = appState.fr;

  if (!frRange || !cs[frRange.a] || !cs[frRange.b]) {
    return bundle.files;
  }

  return frRange.a === frRange.b
    ? appState.cdiff[cs[frRange.a].sha]
    : appState.rdiff[frKey(cs, frRange)];
}

export async function loadFr() {
  const bundle = appState.bundle;
  const frRange = appState.fr;

  if (!bundle || !frRange) {
    return;
  }

  const cs = commitList(bundle);
  const single = frRange.a === frRange.b;
  const key = frKey(cs, frRange);
  const store = single ? appState.cdiff : appState.rdiff;
  const repo = bundle.pull.base.repo.full_name;

  if (store[key] !== undefined && store[key] !== 'loading') {
    return;
  }

  store[key] = 'loading';
  render();

  try {
    if (!tauri) {
      throw new Error('Per-commit diffs are available in the desktop app.');
    }

    if (!single && !cs[frRange.a].parent) {
      throw new Error('This range has no parent commit to compare against.');
    }

    store[key] =
      (single
        ? await tauri!.invoke('fetch_commit', { repo, sha: key })
        : await tauri!.invoke('fetch_range', {
            repo,
            base: cs[frRange.a].parent,
            head: cs[frRange.b].sha,
          })
      ).files || [];
  } catch (error) {
    store[key] = String(error).replace(/^Error: /, '');
  }

  render();
}

export function setFr(frRange: FrRange | null) {
  appState.fr = frRange;
  appState.dlg = null;
  render();
  loadFr();
}

export function sinceReview(bundle: Bundle) {
  const cs = commitList(bundle);

  const mine = bundle.timeline.filter(
    timelineEvent =>
      timelineEvent.event === 'reviewed' &&
      timelineEvent.user?.login === appState.me &&
      timelineEvent.commit_id,
  );

  if (!appState.me || !mine.length) {
    return null;
  }

  const at = cs.findIndex(
    commitRow => commitRow.sha === mine[mine.length - 1].commit_id,
  );

  return at < 0 ? null : { at, n: cs.length - 1 - at };
}

export function commitsDialogProps(): CommitsDialogProps {
  const bundle = appState.bundle;
  const cs = commitList(bundle!);
  const pick = appState.cpick || appState.fr;
  const sr = sinceReview(bundle!);
  const query = (appState.cfilter || '').toLowerCase();
  const on = (index: number) => !!pick && index >= pick.a && index <= pick.b;

  return {
    rows: cs.map((commitRow, index) => {
      const title = String(commitRow.message).split('\n')[0];
      const by = commitRow.name || commitRow.author?.login || '';
      const word = when(commitRow.date!).replace(/<\/?span[^>]*>/g, '');
      const sha = commitRow.sha!.slice(0, 7);

      return {
        i: index,
        on: on(index),
        title,
        by,
        when: word,
        sha,
        hidden:
          !!query &&
          !`${title + by} committed ${word}${sha}`
            .toLowerCase()
            .includes(query),
      };
    }),
    count: cs.length,
    allOn: !appState.fr,
    since: sr
      ? {
          on:
            !!appState.fr &&
            appState.fr.a === sr.at + 1 &&
            appState.fr.b === cs.length - 1,
          n: sr.n,
        }
      : null,
    filter: appState.cfilter || '',
    selLabel: pick
      ? pick.a === pick.b
        ? '1 commit selected'
        : `${pick.b - pick.a + 1} commits selected`
      : 'Nothing selected',
    hasPick: !!pick,
  };
}

export function openCommits() {
  appState.cpick = appState.fr ? { ...appState.fr } : null;
  appState.cfilter = '';
  appState.dlg = { k: 'commits' };
  render();
}

export function filesView(bundle: Bundle): VNode {
  const cs = commitList(bundle);

  const frRange =
    appState.fr && cs[appState.fr.a] && cs[appState.fr.b] ? appState.fr : null;

  const single = !!frRange && frRange.a === frRange.b;
  const sh = (index: number) => cs[index]!.sha.slice(0, 7);

  const bar = (
    <FcBar
      label={
        !frRange
          ? 'All commits'
          : single
            ? 'Commit'
            : `${frRange.b - frRange.a + 1} commits`
      }
      count={!frRange ? cs.length : null}
      code={
        !frRange
          ? null
          : single
            ? sh(frRange.a)
            : `${sh(frRange.a)}…${sh(frRange.b)}`
      }
      nav={
        single
          ? { prevOff: frRange!.a <= 0, nextOff: frRange!.a >= cs.length - 1 }
          : null
      }
      title={
        frRange && single ? String(cs[frRange.a].message).split('\n')[0] : ''
      }
      hasRange={!!frRange}
      on={filesOn}
    />
  );

  if (!frRange) {
    return (
      <>
        {bar}
        {filesList(bundle.files, true)}
      </>
    );
  }

  const value = frDiff(bundle);

  return (
    <>
      {bar}
      {value === undefined || value === 'loading' ? (
        <div class="diff-empty">Loading…</div>
      ) : typeof value === 'string' ? (
        <div class="diff-empty err">{value}</div>
      ) : (
        filesList(value)
      )}
    </>
  );
}

export const b0open = () =>
  !!appState.bundle &&
  !appState.bundle.pull.merged &&
  appState.bundle.pull.state === 'open';

export function filesList(input: FileChange[], canComment = false): VNode {
  let files = input;

  if (!files.length) {
    return <div class="diff-empty">No files changed.</div>;
  }

  const pid = appState.bundle?.pull?.id;

  const hasC = (fileChange: FileChange) =>
    (appState.bundle?.review_comments || []).some(
      reviewComment => reviewComment.path === fileChange.filename,
    ) ||
    pendList().some(
      pendingComment => pendingComment.path === fileChange.filename,
    );

  // Big PRs open with the heavy files collapsed (like GitHub); a folded file renders no rows at all until it is opened.
  if (appState.autoFoldFor !== pid) {
    appState.autoFoldFor = pid;
    let budget = 1200;

    for (const fileChange of files) {
      const count = fileChange.additions + fileChange.deletions;
      const key = `f:${fileChange.filename}`;

      if (key in appState.fold || hasC(fileChange)) {
        continue;
      }

      if (count > 400 || count > budget) {
        appState.fold[key] = true;
      } else {
        budget -= count;
      }
    }
  }

  const shown = (fileChange: FileChange) =>
    !appState.fold[`f:${fileChange.filename}`];

  const srt = appState.fileSort || 'path';

  const cnt = (fileChange: FileChange) =>
    (appState.bundle?.review_comments || []).filter(
      reviewComment =>
        reviewComment.path === fileChange.filename &&
        !reviewComment.in_reply_to_id,
    ).length;

  const so: Record<
    string,
    ((leftFileChange: FileChange, rightFileChange: FileChange) => number) | null
  > = {
    path: null,
    pathz: (leftFileChange, rightFileChange) =>
      rightFileChange.filename.localeCompare(leftFileChange.filename),
    most: (leftFileChange, rightFileChange) =>
      rightFileChange.additions +
      rightFileChange.deletions -
      (leftFileChange.additions + leftFileChange.deletions),
    least: (leftFileChange, rightFileChange) =>
      leftFileChange.additions +
      leftFileChange.deletions -
      (rightFileChange.additions + rightFileChange.deletions),
    comments: (leftFileChange, rightFileChange) =>
      cnt(rightFileChange) - cnt(leftFileChange),
    status: (leftFileChange, rightFileChange) =>
      String(leftFileChange.status).localeCompare(
        String(rightFileChange.status),
      ) || leftFileChange.filename.localeCompare(rightFileChange.filename),
  };

  const srtFn = so[srt];

  if (srtFn) {
    files = [...files].sort(srtFn);
  }

  const all = files.every(
    fileChange => appState.fold[`f:${fileChange.filename}`],
  );

  return (
    <>
      <FilesBar
        mode={appState.diffMode ?? ''}
        sort={srt}
        pending={pendList().length}
        allFolded={all}
        names={files.map(fileChange => fileChange.filename)}
        viewed={viewedCount(files)}
        total={files.length}
        onViewedAll={() =>
          viewedAll(files, viewedCount(files) !== files.length)
        }
        on={filesOn}
      />
      {files.map(fileChange => {
        const time = fileChange.additions + fileChange.deletions || 1;
        const first = Math.round((fileChange.additions / time) * 5);

        const delta = Math.min(
          5 - first,
          Math.round((fileChange.deletions / time) * 5),
        );

        const sq = Array.from({ length: 5 }, (_, index) =>
          index < first ? 'a' : index < first + delta ? 'd' : '',
        );

        return (
          <FileBox
            name={fileChange.filename}
            folded={isFolded(`f:${fileChange.filename}`)}
            closed={!!appState.fold[`f:${fileChange.filename}`]}
            add={fileChange.additions}
            del={fileChange.deletions}
            sq={sq}
            viewed={isViewed(fileChange)}
            onViewed={() => toggleViewed(fileChange)}
            on={filesOn}
          >
            {!shown(fileChange) ? (
              ''
            ) : fileChange.patch ? (
              diffTable(
                fileChange.patch,
                fileChange.filename,
                canComment && b0open(),
                diffOn,
              )
            ) : (
              <div class="diff-empty">
                Binary file or diff too large to display.
              </div>
            )}
          </FileBox>
        );
      })}
    </>
  );
}

export function commitsView(bundle: Bundle): VNode {
  const timelineEvents = bundle.timeline.filter(
    timelineEvent => timelineEvent.event === 'committed',
  );

  return (
    <CommitsList
      rows={timelineEvents.map(timelineEvent => (
        <CommitRowView
          first={String(timelineEvent.message || '').split('\n')[0]}
          sha={timelineEvent.sha!}
          author={
            timelineEvent.author?.avatar_url ? timelineEvent.author : null
          }
          url={timelineEvent.html_url!}
          verification={timelineEvent.verification}
        />
      ))}
    />
  );
}

export function commitList(bundle: Bundle): CommitRow[] {
  if (bundle.commits && bundle.commits.length) {
    return bundle.commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.author,
      name: commit.commit.author?.name,
      date: commit.commit.author?.date,
      url: commit.html_url,
      parent: commit.parents?.[0]?.sha,
    }));
  }

  return bundle.timeline
    .filter(timelineEvent => timelineEvent.event === 'committed')
    .map(timelineEvent => ({
      sha: timelineEvent.sha!,
      message: timelineEvent.message!,
      author: timelineEvent.author?.avatar_url
        ? (timelineEvent.author as User)
        : null,
      name: timelineEvent.author?.name,
      date: timelineEvent.author?.date,
      url: timelineEvent.html_url,
    }));
}

appState.flip = localStorage.getItem('flip') === '1';

export function flipSides() {
  appState.flip = !appState.flip;
  localStorage.setItem('flip', appState.flip ? '1' : '0');
  rerender();
}

const hideSide = (key: string, flag: boolean) => {
  appState.hide[key] = flag;
  localStorage.setItem('hide', JSON.stringify(appState.hide));
  rerender();
};

function gutterDrag(event: MouseEvent) {
  event.preventDefault();
  const rect = queryElement('.split')!.getBoundingClientRect();

  const mv = (ev: MouseEvent) => {
    appState.lw = Math.max(
      25,
      Math.min(
        75,
        ((appState.flip ? rect.right - ev.clientX : ev.clientX - rect.left) /
          rect.width) *
          100,
      ),
    );

    repaintShell({ lw: appState.lw });
  };

  const up = () => {
    setDragging(false);
    localStorage.setItem('lw', String(Math.round(appState.lw)));
  };

  setDragging(true);
  beginDrag({ move: mv, end: up });
}

const splitOn: SplitHandlers = {
  hide: hideSide,
  flip: flipSides,
  pick: sha => {
    selectCommit(sha);
  },
  gutter: gutterDrag,
  fold: (event, key, def) => convOn.fold(event, key, def),
  scroll: (id, event) => scrolled(id, event.currentTarget as HTMLElement),
};

export function splitView(bundle: Bundle): VNode {
  const cs = commitList(bundle);
  const sha = appState.sel;

  const cnt = (color: string) =>
    bundle.review_comments.filter(
      reviewComment =>
        reviewComment.original_commit_id === color ||
        reviewComment.commit_id === color,
    ).length;

  let diff: VNode;

  if (!sha) {
    diff = filesList(bundle.files, true);
  } else {
    const value = appState.cdiff[sha];

    diff =
      value === undefined || value === 'loading' ? (
        <div class="diff-empty">Loading commit…</div>
      ) : typeof value === 'string' ? (
        <div class="diff-empty err">{value}</div>
      ) : (
        filesList(value)
      );
  }

  return (
    <SplitView
      hl={!!appState.hide.l}
      hr={!!appState.hide.r}
      flip={!!appState.flip}
      lw={appState.lw}
      allOn={!sha}
      allSub={`${bundle.pull.changed_files} files · +${bundle.pull.additions} −${bundle.pull.deletions}`}
      rows={cs.map(commitRow => ({
        sha: commitRow.sha,
        on: sha === commitRow.sha,
        author: commitRow.author,
        initial: (commitRow.name || '?')[0],
        title: String(commitRow.message).split('\n')[0],
        sub: `${commitRow.name || commitRow.author?.login || ''} · ${when(commitRow.date!).replace(/<\/?span[^>]*>/g, '')}`,
        n: cnt(commitRow.sha),
      }))}
      count={cs.length}
      subTitle={sha ? `Commit ${sha.slice(0, 7)}` : 'All changes'}
      foldList={isFolded('cm-list')}
      foldDiff={isFolded('cm-diff')}
      diff={diff}
      right={
        <>
          <Attention {...attentionProps(bundle)} on={attOn} />
          <Timeline m={timelineModel(bundle)} on={tlOn} />
        </>
      }
      on={splitOn}
    />
  );
}

export async function selectCommit(sha: string) {
  appState.sel = sha || null;
  render();

  if (!sha || appState.cdiff[sha] !== undefined) {
    return;
  }

  appState.cdiff[sha] = 'loading';

  try {
    if (!tauri) {
      throw new Error('Per-commit diffs are available in the desktop app.');
    }

    appState.cdiff[sha] =
      (
        await tauri!.invoke('fetch_commit', {
          repo: appState.bundle!.pull.base.repo.full_name,
          sha,
        })
      ).files || [];
  } catch (error) {
    appState.cdiff[sha] = String(error).replace(/^Error: /, '');
  }

  if (appState.sel === sha) {
    render();
  }
}
