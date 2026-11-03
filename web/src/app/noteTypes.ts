export type NoteType =
  'commits' | 'comments' | 'reviews' | 'branches' | 'state';

export const NOTE_TYPES: Record<NoteType, { label: string; icon: string }> = {
  commits: { label: 'Commits', icon: 'git-commit' },
  comments: { label: 'Comments', icon: 'comment' },
  reviews: { label: 'Reviews', icon: 'comment-discussion' },
  branches: { label: 'Branches', icon: 'git-branch' },
  state: { label: 'Status', icon: 'git-merge' },
};

// A notification only stores its text, so the kinds it covers are read back from the wording noteDiff and pollBranches give it.
export const noteTypesOf = (ref: string, text: string): NoteType[] => {
  if (ref.includes('@') || text.startsWith('New branch pushed')) {
    return ['branches'];
  }

  const types: NoteType[] = [];

  if (/new commits?/.test(text)) {
    types.push('commits');
  }

  if (/new comments?/.test(text)) {
    types.push('comments');
  }

  if (/new review comments?/.test(text)) {
    types.push('reviews');
  }

  if (/now (open|closed|merged)/.test(text)) {
    types.push('state');
  }

  return types.length ? types : ['comments'];
};
