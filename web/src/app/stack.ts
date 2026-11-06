import { rerender } from './actions';
import { appState, load, tauri } from './core';

import type { Bundle, PrListItem, User } from '../types';

export interface StackRow {
  // The PR's number, or 0 for a branch that has no open PR (the root, e.g. main).
  number: number;
  branch: string;
  title: string;
  user: User | null;
  base: string;
  updated: string;
  draft: boolean;
  current: boolean;
  depth: number;
}

const MAX_DEPTH = 12;

// A stack is made of open PRs inside one repository: a PR's parent is the open PR whose head branch is its base branch, and its children are the open PRs based on its head branch. Fork PRs are left out because their branch names live in another repository.
export function buildStack(bundle: Bundle, open: PrListItem[]): StackRow[] {
  const pull = bundle.pull;
  const repo = pull.base.repo.full_name.toLowerCase();

  const sameRepo = open.filter(
    item =>
      item.head?.repo?.full_name?.toLowerCase() === repo &&
      item.number !== pull.number,
  );

  const rowOf = (
    item: {
      number: number;
      title: string;
      draft?: boolean;
      user: User;
      updated_at: string;
      base?: { ref: string };
    },
    branch: string,
    depth: number,
    current = false,
  ): StackRow => ({
    number: item.number,
    branch,
    title: item.title,
    user: item.user,
    base: item.base?.ref ?? '',
    updated: item.updated_at,
    draft: !!item.draft,
    current,
    depth,
  });

  const ancestors: PrListItem[] = [];

  let baseBranch = pull.base.ref;

  const parentOf = (branch: string) =>
    sameRepo.find(
      item =>
        item.head?.ref === branch &&
        !ancestors.some(seen => seen.number === item.number),
    );

  for (
    let parent = parentOf(baseBranch);
    parent && ancestors.length < MAX_DEPTH;
    parent = parentOf(baseBranch)
  ) {
    ancestors.push(parent);
    baseBranch = parent.base?.ref ?? '';
  }

  const rows: StackRow[] = [
    {
      number: 0,
      branch: baseBranch,
      title: '',
      user: null,
      base: '',
      updated: '',
      draft: false,
      current: false,
      depth: 0,
    },
  ];

  ancestors.reverse().forEach(ancestor => {
    rows.push(rowOf(ancestor, ancestor.head!.ref, rows.length));
  });

  rows.push(rowOf(pull, pull.head.ref, rows.length, true));

  const visited = new Set<number>([
    pull.number,
    ...ancestors.map(ancestor => ancestor.number),
  ]);

  const addChildren = (headBranch: string, depth: number) => {
    if (depth > MAX_DEPTH) {
      return;
    }

    for (const child of sameRepo.filter(
      item => item.base?.ref === headBranch && !visited.has(item.number),
    )) {
      visited.add(child.number);
      rows.push(rowOf(child, child.head!.ref, depth));
      addChildren(child.head!.ref, depth + 1);
    }
  };

  addChildren(pull.head.ref, rows.length);

  return rows;
}

// Worth showing when other PRs are stacked with this one, or the base is not where the PR will finally land.
export const hasStack = (rows: StackRow[]) => rows.length > 2;

// The last stack seen for each PR is kept, so the tab shows at once and the fresh answer replaces it quietly.
const KEY_STACKS = 'stacks';
const SAVED_STACKS = 30;
const savedStacks = load<Record<string, StackRow[]>>(KEY_STACKS, {});

const saveStack = (ref: string, rows: StackRow[]) => {
  delete savedStacks[ref];
  savedStacks[ref] = rows;

  Object.keys(savedStacks)
    .slice(0, -SAVED_STACKS)
    .forEach(old => delete savedStacks[old]);

  try {
    localStorage.setItem(KEY_STACKS, JSON.stringify(savedStacks));
  } catch {
    /* storage unavailable */
  }
};

// Start the request while the PR itself is still loading; the backend shares one in-flight fetch.
export function warmStack(repo: string) {
  if (tauri && appState.hasToken) {
    tauri.invoke('stack_prs', { repo }).catch(() => {});
  }
}

export function showSavedStack(ref: string) {
  if (savedStacks[ref]) {
    appState.stack = { ref, rows: savedStacks[ref] };
  }
}

export async function loadStack(bundle: Bundle) {
  if (!tauri || !appState.hasToken) {
    return;
  }

  const ref = `${bundle.pull.base.repo.full_name}#${bundle.pull.number}`;

  try {
    const open = await tauri!.invoke('stack_prs', {
      repo: bundle.pull.base.repo.full_name,
    });

    if (appState.bundle !== bundle) {
      return;
    }

    const rows = buildStack(bundle, open);

    const changed =
      JSON.stringify(appState.stack?.rows) !== JSON.stringify(rows);

    appState.stack = { ref, rows };
    saveStack(ref, rows);

    if (changed && !document.activeElement?.closest?.('.tt')) {
      rerender();
    }
  } catch {
    /* the chain simply is not shown */
  }
}
