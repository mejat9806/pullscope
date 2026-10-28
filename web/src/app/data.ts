import { rerender } from './actions';
import { appState, flags, load, selNames, tauri } from './core';
import { openPr } from './nav';
import { render } from './pages';
import { curRef, saveTabs } from './tabs';

import type { PushBanner } from '../components/Home';
import type { Bundle, FreshItem, Snap, SnapSource } from '../types';

// Notifications: poll watched PRs and report new comments, commits, reviews and state changes.
export const snap = (snapSource: SnapSource): Snap => ({
  commits: snapSource.commits,
  comments: snapSource.comments,
  rc: snapSource.review_comments,
  state: snapSource.merged ? 'merged' : snapSource.state,
});

export const seen = load<Record<string, Snap>>('seen', {});

export function noteAdd(ref: string, title: string, text: string, target = '') {
  {
    const tab = appState.tabs.find(otherTab => otherTab.ref === ref);

    if (tab && ref !== curRef()) {
      tab.dot = true;
      saveTabs();
    }
  }

  appState.notes = [
    {
      id: Date.now() + Math.random(),
      ref,
      title,
      text,
      target,
      at: new Date().toISOString(),
      read: false,
    },
    ...appState.notes,
  ].slice(0, 200);

  localStorage.setItem('notes', JSON.stringify(appState.notes));

  if (tauri) {
    tauri!
      .invoke('notify', {
        title: `${ref} · ${title}`.slice(0, 80),
        body: text,
        prRef: ref,
        target,
      })
      .catch(() => {});
  }
}

export function noteDiff(
  ref: string,
  title: string,
  was: Snap,
  now: Snap,
  fresh: FreshItem[] = [],
) {
  const out: string[] = [];

  const compare = (firstFirst: number, secondSecond: number) =>
    secondSecond - firstFirst;

  if (compare(was.commits, now.commits) > 0) {
    out.push(
      `${compare(was.commits, now.commits)} new commit${compare(was.commits, now.commits) > 1 ? 's' : ''}`,
    );
  }

  if (compare(was.comments, now.comments) > 0) {
    out.push(
      `${compare(was.comments, now.comments)} new comment${compare(was.comments, now.comments) > 1 ? 's' : ''}`,
    );
  }

  if (compare(was.rc, now.rc) > 0) {
    out.push(
      `${compare(was.rc, now.rc)} new review comment${compare(was.rc, now.rc) > 1 ? 's' : ''}`,
    );
  }

  if (was.state !== now.state) {
    out.push(`now ${now.state}`);
  }

  const last = fresh
    .filter(freshItem => !was.at || freshItem.created_at > was.at)
    .sort((leftFreshItem, rightFreshItem) =>
      leftFreshItem.created_at < rightFreshItem.created_at ? -1 : 1,
    )
    .pop();

  if (last) {
    out.push(`“${last.body.replace(/\s+/g, ' ').slice(0, 60)}” — ${last.user}`);
  }

  if (out.length) {
    noteAdd(ref, title, out.join(', '), last ? String(last.id) : '');
  }
}

export function remember(
  ref: string,
  value: SnapSource & { updated_at?: string },
) {
  seen[ref] = {
    ...snap(value),
    at: value.updated_at || new Date().toISOString(),
  };

  localStorage.setItem('seen', JSON.stringify(seen));
}

// Background fetch: the full PR is loaded as soon as a change is noticed, so opening it from a notification needs no wait.
// Tiny TanStack-Query-style cache: in-flight de-duplication, staleTime, stale-while-revalidate, invalidation.
export const qc = {
  m: new Map<string, { data: Bundle; at: number }>(),
  inflight: new Map<string, Promise<Bundle>>(),
  STALE: 30000,
  peek(key: string) {
    return this.m.get(key);
  },
  fresh(key: string, ms = 30000) {
    const entry = this.m.get(key);

    return !!entry && Date.now() - entry.at < ms;
  },
  set(key: string, data: Bundle) {
    this.m.set(key, { data, at: Date.now() });
  },
  invalidate(key: string) {
    const entry = this.m.get(key);

    if (entry) {
      entry.at = 0;
    }
  },
  fetch(key: string, fn: () => Promise<Bundle>) {
    if (this.inflight.has(key)) {
      return this.inflight.get(key);
    }

    const promise = fn()
      .then(bundle => {
        this.set(key, bundle);

        return bundle;
      })
      .finally(() => this.inflight.delete(key));

    this.inflight.set(key, promise);

    return promise;
  },
};

export const loadPr = (input: string) =>
  tauri
    ? tauri!.invoke('fetch_pr', { url: input })
    : fetch(new URL(input, location.href)).then(response => response.json());

export function prefetch(ref: string) {
  if (tauri && !qc.fresh(ref)) {
    qc.fetch(ref, () => loadPr(ref))?.catch(() => {});
  }
}

export async function pollNotes() {
  if (!tauri || flags.polling) {
    return;
  }

  flags.polling = true;
  const before = appState.notes.length;

  const cur = appState.bundle
    ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
    : null;

  // Watch what matters without having to open it: open tabs, recent PRs, and the PRs you wrote or were asked to review (refreshed every 4 minutes).
  if (appState.hasToken && Date.now() - (appState.watchAt || 0) > 240000) {
    appState.watchAt = Date.now();

    try {
      const inbox = await tauri!.invoke('inbox', {
        force: false,
        repos: selNames(),
        light: true,
      });

      appState.watch = [...(inbox.mine || []), ...(inbox.requested || [])].map(
        inboxItem => `${inboxItem.repo}#${inboxItem.number}`,
      );
    } catch {
      /* keep the previous list */
    }
  }

  const refs = appState.hasToken
    ? [
        ...new Set([
          ...(cur ? [cur] : []),
          ...appState.tabs.map(tab => tab.ref),
          ...appState.recent.slice(0, 8).map(recentEntry => recentEntry.ref),
          ...(appState.watch || []),
        ]),
      ].slice(0, 40)
    : cur
      ? [cur]
      : [];

  for (const ref of refs) {
    const match = ref.match(/^(.+)#(\d+)$/);

    if (!match) {
      continue;
    }

    try {
      const checkResult = await tauri!.invoke('check_pr', {
        repo: match[1],
        number: +match[2],
        since: seen[ref]?.at || null,
      });

      const now = snap(checkResult);
      const n0 = appState.notes.length;

      if (seen[ref]) {
        noteDiff(ref, checkResult.title, seen[ref], now, checkResult.fresh);
      }

      if (appState.notes.length !== n0) {
        prefetch(ref);
      } // warm it now so clicking the notification is instant

      remember(ref, checkResult);

      // The PR on screen changed (reviewers, labels, new comments…): reload it quietly so the page and the Details panel stay current.
      const bp = appState.bundle?.pull;

      if (
        cur &&
        ref.toLowerCase() === cur.toLowerCase() &&
        appState.view === 'pr' &&
        bp &&
        !appState.loading &&
        !appState.refreshing &&
        ((checkResult.updated_at &&
          checkResult.updated_at > (bp.updated_at || '')) ||
          (checkResult.comments ?? bp.comments) !== bp.comments ||
          (checkResult.review_comments ?? bp.review_comments) !==
            bp.review_comments) &&
        !document.activeElement?.closest?.('.tt')
      ) {
        qc.invalidate(cur);

        await tauri!.invoke('invalidate_pr', { url: cur }).catch(() => {});

        openPr(cur, { nav: true, keepTab: true });
      }
    } catch {
      /* offline or rate limited: try again next round */
    }
  }

  await pollBranches(refs, cur!);
  flags.polling = false;

  if (
    appState.notes.length !== before &&
    !document.activeElement?.closest?.('.tt')
  ) {
    render();
  }
}

// "had recent pushes — Compare & pull request" prompts, like github.com shows for branches without a PR.
appState.pushes = {};

export const pushDis = load<Record<string, number>>('pushdismiss', {});

export const ago = (text: string) => {
  const minutes = Math.max(
    1,
    Math.round((Date.now() - +new Date(text)) / 60000),
  );

  return minutes < 60
    ? `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    : `${Math.round(minutes / 60)} hour${minutes >= 90 ? 's' : ''} ago`;
};

export const pushList = (repo: string) =>
  Object.entries(appState.pushes)
    .filter(([text]) => !repo || text === repo)
    .flatMap(([, pushs]) => pushs)
    .filter(
      push =>
        !pushDis[`${push.repo}@${push.branch}@${push.at}`] &&
        Date.now() - +new Date(push.at) < 6 * 3600e3,
    );

export function pushBannerItems(repo?: string): PushBanner[] {
  return pushList(repo!)
    .slice(0, 3)
    .map(push => ({
      repo: push.repo,
      branch: push.branch,
      ago: ago(push.at),
      key: `${push.repo}@${push.branch}@${push.at}`,
      showRepo: !repo,
    }));
}

export async function refreshPushes(repo: string) {
  if (!tauri || !appState.hasToken || !repo) {
    return;
  }

  try {
    const pushs = await tauri!.invoke('recent_pushes', { repo });
    const was = JSON.stringify(appState.pushes[repo] || []);
    appState.pushes[repo] = pushs;

    if (
      JSON.stringify(pushs) !== was &&
      (appState.view === 'repo' ||
        (!appState.bundle &&
          appState.view !== 'newpr' &&
          appState.view !== 'inbox' &&
          appState.view !== 'notes')) &&
      !document.activeElement?.closest?.('.tt')
    ) {
      rerender();
    }
  } catch {
    /* no access */
  }
}

// New branches pushed to repos you follow (the ones behind your recent pull requests). The first look at a repo only records its branches.
export const branchSeen = load<Record<string, string[]>>('branches', {});

export async function pollBranches(refs: string[], cur: string) {
  if (!appState.hasToken) {
    return;
  }

  const repos = [
    ...new Set(
      [...refs, cur].filter(Boolean).map(text => text.replace(/#\d+$/, '')),
    ),
  ].slice(0, 6);

  for (const repo of repos) {
    try {
      const branchInfo = await tauri!.invoke('list_branches', { repo });
      const names = branchInfo.branches || [];

      if (branchSeen[repo]) {
        names
          .filter(
            name =>
              !branchSeen[repo].includes(name) && name !== branchInfo.default,
          )
          .forEach(name =>
            noteAdd(
              `${repo}@${name}`,
              repo,
              `New branch pushed: ${name} — click to open a pull request`,
              '',
            ),
          );
      }

      refreshPushes(repo);
      branchSeen[repo] = names;
      localStorage.setItem('branches', JSON.stringify(branchSeen));
    } catch {
      /* no access or offline */
    }
  }
}
