import { rerender } from './actions';
import { flags, load, S, selNames, tauri } from './core';
import { openPr } from './nav';
import { render } from './pages';
import { curRef, saveTabs } from './tabs';

import type { PushBanner } from '../components/Home';
import type { Bundle, FreshItem, Snap, SnapSource } from '../types';

// Notifications: poll watched PRs and report new comments, commits, reviews and state changes.
export const snap = (p: SnapSource): Snap => ({
  commits: p.commits,
  comments: p.comments,
  rc: p.review_comments,
  state: p.merged ? 'merged' : p.state,
});

export const seen = load<Record<string, Snap>>('seen', {});

export function noteAdd(ref: string, title: string, text: string, target = '') {
  {
    const t = S.tabs.find(x => x.ref === ref);

    if (t && ref !== curRef()) {
      t.dot = true;
      saveTabs();
    }
  }

  S.notes = [
    {
      id: Date.now() + Math.random(),
      ref,
      title,
      text,
      target,
      at: new Date().toISOString(),
      read: false,
    },
    ...S.notes,
  ].slice(0, 200);

  localStorage.setItem('notes', JSON.stringify(S.notes));

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
  const d = (a: number, b: number) => b - a;

  if (d(was.commits, now.commits) > 0) {
    out.push(
      `${d(was.commits, now.commits)} new commit${d(was.commits, now.commits) > 1 ? 's' : ''}`,
    );
  }

  if (d(was.comments, now.comments) > 0) {
    out.push(
      `${d(was.comments, now.comments)} new comment${d(was.comments, now.comments) > 1 ? 's' : ''}`,
    );
  }

  if (d(was.rc, now.rc) > 0) {
    out.push(
      `${d(was.rc, now.rc)} new review comment${d(was.rc, now.rc) > 1 ? 's' : ''}`,
    );
  }

  if (was.state !== now.state) {
    out.push(`now ${now.state}`);
  }

  const last = fresh
    .filter(f => !was.at || f.created_at > was.at)
    .sort((x, y) => (x.created_at < y.created_at ? -1 : 1))
    .pop();

  if (last) {
    out.push(`“${last.body.replace(/\s+/g, ' ').slice(0, 60)}” — ${last.user}`);
  }

  if (out.length) {
    noteAdd(ref, title, out.join(', '), last ? String(last.id) : '');
  }
}

export function remember(ref: string, p: SnapSource & { updated_at?: string }) {
  seen[ref] = { ...snap(p), at: p.updated_at || new Date().toISOString() };
  localStorage.setItem('seen', JSON.stringify(seen));
}

// Background fetch: the full PR is loaded as soon as a change is noticed, so opening it from a notification needs no wait.
// Tiny TanStack-Query-style cache: in-flight de-duplication, staleTime, stale-while-revalidate, invalidation.
export const qc = {
  m: new Map<string, { data: Bundle; at: number }>(),
  inflight: new Map<string, Promise<Bundle>>(),
  STALE: 30000,
  peek(k: string) {
    return this.m.get(k);
  },
  fresh(k: string, ms = 30000) {
    const e = this.m.get(k);

    return !!e && Date.now() - e.at < ms;
  },
  set(k: string, data: Bundle) {
    this.m.set(k, { data, at: Date.now() });
  },
  invalidate(k: string) {
    const e = this.m.get(k);

    if (e) {
      e.at = 0;
    }
  },
  fetch(k: string, fn: () => Promise<Bundle>) {
    if (this.inflight.has(k)) {
      return this.inflight.get(k);
    }

    const p = fn()
      .then(d => {
        this.set(k, d);

        return d;
      })
      .finally(() => this.inflight.delete(k));

    this.inflight.set(k, p);

    return p;
  },
};

export const loadPr = (input: string) =>
  tauri
    ? tauri!.invoke('fetch_pr', { url: input })
    : fetch(new URL(input, location.href)).then(r => r.json());

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
  const before = S.notes.length;

  const cur = S.bundle
    ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`
    : null;

  // Watch what matters without having to open it: open tabs, recent PRs, and the PRs you wrote or were asked to review (refreshed every 4 minutes).
  if (S.hasToken && Date.now() - (S.watchAt || 0) > 240000) {
    S.watchAt = Date.now();

    try {
      const d = await tauri!.invoke('inbox', {
        force: false,
        repos: selNames(),
        light: true,
      });

      S.watch = [...(d.mine || []), ...(d.requested || [])].map(
        i => `${i.repo}#${i.number}`,
      );
    } catch {
      /* keep the previous list */
    }
  }

  const refs = S.hasToken
    ? [
        ...new Set([
          ...(cur ? [cur] : []),
          ...S.tabs.map(t => t.ref),
          ...S.recent.slice(0, 8).map(r => r.ref),
          ...(S.watch || []),
        ]),
      ].slice(0, 40)
    : cur
      ? [cur]
      : [];

  for (const ref of refs) {
    const m = ref.match(/^(.+)#(\d+)$/);

    if (!m) {
      continue;
    }

    try {
      const p = await tauri!.invoke('check_pr', {
        repo: m[1],
        number: +m[2],
        since: seen[ref]?.at || null,
      });

      const now = snap(p);
      const n0 = S.notes.length;

      if (seen[ref]) {
        noteDiff(ref, p.title, seen[ref], now, p.fresh);
      }

      if (S.notes.length !== n0) {
        prefetch(ref);
      } // warm it now so clicking the notification is instant

      remember(ref, p);

      // The PR on screen changed (reviewers, labels, new comments…): reload it quietly so the page and the Details panel stay current.
      const bp = S.bundle?.pull;

      if (
        cur &&
        ref.toLowerCase() === cur.toLowerCase() &&
        S.view === 'pr' &&
        bp &&
        !S.loading &&
        !S.refreshing &&
        ((p.updated_at && p.updated_at > (bp.updated_at || '')) ||
          (p.comments ?? bp.comments) !== bp.comments ||
          (p.review_comments ?? bp.review_comments) !== bp.review_comments) &&
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

  if (S.notes.length !== before && !document.activeElement?.closest?.('.tt')) {
    render();
  }
}

// "had recent pushes — Compare & pull request" prompts, like github.com shows for branches without a PR.
S.pushes = {};

export const pushDis = load<Record<string, number>>('pushdismiss', {});

export const ago = (t: string) => {
  const m = Math.max(1, Math.round((Date.now() - +new Date(t)) / 60000));

  return m < 60
    ? `${m} minute${m === 1 ? '' : 's'} ago`
    : `${Math.round(m / 60)} hour${m >= 90 ? 's' : ''} ago`;
};

export const pushList = (repo: string) =>
  Object.entries(S.pushes)
    .filter(([r]) => !repo || r === repo)
    .flatMap(([, l]) => l)
    .filter(
      p =>
        !pushDis[`${p.repo}@${p.branch}@${p.at}`] &&
        Date.now() - +new Date(p.at) < 6 * 3600e3,
    );

export function pushBannerItems(repo?: string): PushBanner[] {
  return pushList(repo!)
    .slice(0, 3)
    .map(p => ({
      repo: p.repo,
      branch: p.branch,
      ago: ago(p.at),
      key: `${p.repo}@${p.branch}@${p.at}`,
      showRepo: !repo,
    }));
}

export async function refreshPushes(repo: string) {
  if (!tauri || !S.hasToken || !repo) {
    return;
  }

  try {
    const l = await tauri!.invoke('recent_pushes', { repo });
    const was = JSON.stringify(S.pushes[repo] || []);
    S.pushes[repo] = l;

    if (
      JSON.stringify(l) !== was &&
      (S.view === 'repo' ||
        (!S.bundle &&
          S.view !== 'newpr' &&
          S.view !== 'inbox' &&
          S.view !== 'notes')) &&
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
  if (!S.hasToken) {
    return;
  }

  const repos = [
    ...new Set([...refs, cur].filter(Boolean).map(r => r.replace(/#\d+$/, ''))),
  ].slice(0, 6);

  for (const repo of repos) {
    try {
      const b = await tauri!.invoke('list_branches', { repo });
      const names = b.branches || [];

      if (branchSeen[repo]) {
        names
          .filter(n => !branchSeen[repo].includes(n) && n !== b.default)
          .forEach(n =>
            noteAdd(
              `${repo}@${n}`,
              repo,
              `New branch pushed: ${n} — click to open a pull request`,
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
