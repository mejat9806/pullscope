import type {
  AppState,
  Note,
  Person,
  Profile,
  Reactions,
  RecentEntry,
  RepoSummary,
} from '../types';

// GitHub pull request page renderer. Data arrives from the Rust backend (Tauri `fetch_pr`),
// or from a recorded bundle (`?fixture=file.json`) when previewed in a plain browser.
export const tauri = window.__TAURI__ && window.__TAURI__.core;

// Clicking a native notification: open that PR and jump to the comment.

export const queryElement = <T extends HTMLElement = HTMLElement>(
  text: string,
  root: ParentNode = document,
): T | null => root.querySelector<T>(text);

export const qa = <T extends HTMLElement = HTMLElement>(
  text: string,
  root: ParentNode = document,
): T[] => [...root.querySelectorAll<T>(text)];

const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, color => ESC[color]);

export const icon = (name: string, size = 16, cls = '') => {
  const key = name + (size === 24 ? '-24' : '');

  return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[key] || ''}</svg>`;
};

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function whenParts(
  iso: string,
  lead = 'on ',
): { title: string; text: string } {
  const date = new Date(iso);
  const now = new Date();
  const diff = (+now - +date) / 1000;
  const abs = `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}${date.getUTCFullYear() !== now.getUTCFullYear() ? `, ${date.getUTCFullYear()}` : ''}`;
  const title = date.toUTCString();

  let value;

  if (diff < 30 * 86400 && diff >= 0) {
    const handler = (otherValue: number, url: string) =>
      `${otherValue} ${url}${otherValue === 1 ? '' : 's'} ago`;

    value =
      diff < 60
        ? 'now'
        : diff < 3600
          ? handler(Math.floor(diff / 60), 'minute')
          : diff < 86400
            ? handler(Math.floor(diff / 3600), 'hour')
            : handler(Math.floor(diff / 86400), 'day');

    return { title, text: value };
  }

  return { title, text: `${lead}${abs}` };
}

export function when(iso: string, lead = 'on ') {
  const item = whenParts(iso, lead);

  return `<span title="${item.title}">${item.text}</span>`;
}

export function fullDate(iso: string) {
  const date = new Date(iso);

  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export const user = (person?: Person | null) =>
  person
    ? `<a class="actor" href="${esc(person.html_url)}">${esc(person.login)}</a>`
    : '<span class="actor">ghost</span>';

export const avatar = (person?: Person | null, size = 40) =>
  `<img class="av" loading="lazy" decoding="async" src="${esc(person?.avatar_url || '')}${person?.avatar_url ? `${person.avatar_url.includes('?') ? '&' : '?'}s=${size * 2}` : ''}" width="${size}" height="${size}" alt="@${esc(person?.login || 'ghost')}" style="border-radius:50%;display:block">`;

export const ASSOC: Record<string, string> = {
  CONTRIBUTOR: 'Contributor',
  MEMBER: 'Member',
  OWNER: 'Owner',
  COLLABORATOR: 'Collaborator',
  FIRST_TIME_CONTRIBUTOR: 'First-time contributor',
  FIRST_TIMER: 'First-timer',
  MANNEQUIN: 'Mannequin',
};

export const REACTS: [keyof Reactions, string][] = [
  ['+1', '👍'],
  ['-1', '👎'],
  ['laugh', '😄'],
  ['hooray', '🎉'],
  ['confused', '😕'],
  ['heart', '❤️'],
  ['rocket', '🚀'],
  ['eyes', '👀'],
];

export const load = <T>(key: string, item: T): T => {
  try {
    return (
      (JSON.parse(localStorage.getItem(key) ?? 'null') as T | null) ?? item
    );
  } catch {
    return item;
  }
};

// Repositories the user chose to fetch (null = all). Kept whole, so the sidebar needs no repository-list request at start-up.
export const loadRepoSel = (): RepoSummary[] | null => {
  const repoSummarys = load<RepoSummary[]>('repoSel', []);

  return repoSummarys.length ? repoSummarys : null;
};

export const selNames = (): string[] =>
  (appState.repoSel || []).map(repoSummary => repoSummary.full_name);

export const appState: AppState = {
  profile: (() => {
    try {
      return JSON.parse(
        localStorage.getItem('profile') || 'null',
      ) as Profile | null;
    } catch {
      return null;
    }
  })(),
  bundle: null,
  tab: 'conversation',
  mode: localStorage.getItem('mode') || 'auto',
  error: '',
  loading: false,
  showAllReviewers: true,
  recent: [],
  hist: [],
  hi: -1,
  hasToken: false,
  sideTab: 'repos',
  repos: null,
  reposErr: '',
  repoFilter: '',
  repo: null,
  prs: null,
  prState: 'open',
  split: localStorage.getItem('split') === '1',
  sel: null,
  cdiff: {},
  rdiff: {},
  fr: null,
  lw: +(localStorage.getItem('lw') || 46),
  notes: load<Note[]>('notes', []),
  bell: false,
  fold: load<Record<string, boolean>>('fold', {}),
  hide: load<Record<string, boolean>>('hide', {}),
  draft: {},
  sbw: +(localStorage.getItem('sbw') || 260),
  pf: '',
  psort: localStorage.getItem('psort') || 'updated',
  pgroup: localStorage.getItem('pgroup') || 'none',
  who: [],
  unres: false,
  range: 'all',
  rFrom: '',
  rTo: '',
  sort: localStorage.getItem('csort') === 'desc' ? 'desc' : 'asc',
  unIdx: 0,
  nav: false,
  busy: '',
  actErr: null,
  tabs: [],
  tabGroups: [],
  alive: new Map(),
  tabMenu: false,
  closed: [],
  pushes: {},
  repoSel: loadRepoSel(),
  ibSort: localStorage.getItem('ibsort') || 'updated',
  ibOrder: load<string[]>('iborder', []),
};

appState.recent = (() => {
  try {
    return (
      (JSON.parse(localStorage.getItem('recent') ?? 'null') as
        RecentEntry[] | null) || []
    );
  } catch {
    return [];
  }
})();

export const isDark = () =>
  appState.mode === 'dark' ||
  (appState.mode === 'auto' &&
    matchMedia('(prefers-color-scheme: dark)').matches);

if (!/Mac/i.test(navigator.platform)) {
  document.documentElement.classList.add('not-mac');
}

// Mirror the unread count into the menu-bar icon.
export const flags = { lastUnread: -1, polling: false };

export function syncUnread() {
  const count = appState.notes.filter(note => !note.read).length;

  if (tauri && count !== flags.lastUnread) {
    flags.lastUnread = count;

    tauri!.invoke('set_unread', { count }).catch(() => {});
  }
}

// Offline: GitHub unreachable (or the machine is offline). The last saved copy is shown with a clear banner and a retry.
appState.offline =
  typeof navigator !== 'undefined' && navigator.onLine === false;

/** You cannot approve or request changes on your own PR; GitHub rejects both. */
export const isOwnPr = () =>
  !!appState.me &&
  appState.bundle?.pull.user?.login.toLowerCase() === appState.me.toLowerCase();

export const isOff = () =>
  !!(appState.offline || (appState.bundle && appState.bundle._cached));

export const offlineBar = () => '';

export function applyMode() {
  const element = document.documentElement;
  const dark = isDark();
  element.setAttribute('data-color-mode', dark ? 'dark' : 'light');
  element.setAttribute('data-light-theme', 'light');
  element.setAttribute('data-dark-theme', 'dark');
  element.setAttribute('data-t', dark ? 'dark' : 'light');
}

export const KEY_RECENT = 'recent';

export const compact = (count?: number | null) =>
  count == null
    ? null
    : count < 1000
      ? String(count)
      : count >= 5000
        ? `${Math.floor(count / 1000)}k+`
        : `${(Math.floor(count / 100) / 10).toString().replace(/\.0$/, '')}k`;

// The comment to highlight is state (S.flash): the comment components draw the class and scroll themselves into view.
export const flashLive = () =>
  !!appState.flash && Date.now() < appState.flashUntil!;

export const flashFor = (id: string) =>
  appState.flash && appState.flash.id === id && flashLive()
    ? {
        n: appState.flash.n,
        block: appState.flash.block,
        smooth: appState.flash.smooth,
        pop: appState.flash.pop,
      }
    : undefined;

export const setFlash = (
  id: string,
  options: { block: 'start' | 'center'; smooth?: boolean; pop?: boolean },
) => {
  appState.flash = { id, n: (appState.flash?.n || 0) + 1, ...options };
  appState.flashUntil = Date.now() + 2500;
};
