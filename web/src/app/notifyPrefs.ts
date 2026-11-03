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

export const isNoteKindOn = (kind: NoteKind) => enabled[kind];

export const setNoteKind = (kind: NoteKind, on: boolean) => {
  enabled = { ...enabled, [kind]: on };

  try {
    localStorage.setItem(KEY, JSON.stringify(enabled));
  } catch {
    /* storage unavailable */
  }
};
