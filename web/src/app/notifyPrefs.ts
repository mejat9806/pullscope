export type NoteKind = 'commits' | 'comments' | 'reviews' | 'branches';

export const NOTE_KINDS: { kind: NoteKind; label: string; hint: string }[] = [
  {
    kind: 'commits',
    label: 'Commits',
    hint: 'New commits pushed to a pull request',
  },
  { kind: 'comments', label: 'Comments', hint: 'New conversation comments' },
  {
    kind: 'reviews',
    label: 'Reviews',
    hint: 'New review comments on the diff',
  },
  {
    kind: 'branches',
    label: 'Branch pushes',
    hint: 'New branches pushed to repositories you follow',
  },
];

const KEY = 'notifyKinds';

const load = (): Record<NoteKind, boolean> => {
  const all: Record<NoteKind, boolean> = {
    commits: true,
    comments: true,
    reviews: true,
    branches: true,
  };

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<
      Record<NoteKind, boolean>
    > | null;

    for (const { kind } of NOTE_KINDS) {
      if (saved?.[kind] === false) {
        all[kind] = false;
      }
    }
  } catch {
    /* storage unavailable: everything stays on */
  }

  return all;
};

let enabled = load();

export const notifyKinds = (): Record<NoteKind, boolean> => ({ ...enabled });

// A repository can override a kind: 'on' or 'off'; no entry means it follows the global switch.
export type RepoChoice = 'default' | 'on' | 'off';

const REPO_KEY = 'notifyRepos';

const loadOverrides = (): Record<
  string,
  Partial<Record<NoteKind, boolean>>
> => {
  try {
    const saved = JSON.parse(localStorage.getItem(REPO_KEY) ?? 'null');

    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
};

let overrides = loadOverrides();

// "owner/repo#12" and "owner/repo@branch" both belong to "owner/repo".
export const repoOf = (ref: string) => ref.replace(/[#@].*$/, '').toLowerCase();

export const isNoteKindOn = (kind: NoteKind, ref = '') =>
  (ref ? overrides[repoOf(ref)]?.[kind] : undefined) ?? enabled[kind];

export const repoChoice = (repo: string, kind: NoteKind): RepoChoice => {
  const override = overrides[repo.toLowerCase()]?.[kind];

  return override === undefined ? 'default' : override ? 'on' : 'off';
};

export const setRepoChoice = (
  repo: string,
  kind: NoteKind,
  choice: RepoChoice,
) => {
  const key = repo.toLowerCase();
  const next = { ...overrides[key] };

  if (choice === 'default') {
    delete next[kind];
  } else {
    next[kind] = choice === 'on';
  }

  overrides = { ...overrides };

  if (Object.keys(next).length) {
    overrides[key] = next;
  } else {
    delete overrides[key];
  }

  try {
    localStorage.setItem(REPO_KEY, JSON.stringify(overrides));
  } catch {
    /* storage unavailable */
  }
};

export const overriddenRepos = () => Object.keys(overrides);

// The repository picked in the dialog ('' is the global settings).
let dialogRepo = '';

export const getDialogRepo = () => dialogRepo;

export const setDialogRepo = (repo: string) => {
  dialogRepo = repo;
};

export const setNoteKind = (kind: NoteKind, on: boolean) => {
  enabled = { ...enabled, [kind]: on };

  try {
    localStorage.setItem(KEY, JSON.stringify(enabled));
  } catch {
    /* storage unavailable */
  }
};
