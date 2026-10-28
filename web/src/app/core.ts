import type { AppState, Note, Person, Profile, Reactions, RecentEntry } from '../types';

// GitHub pull request page renderer. Data arrives from the Rust backend (Tauri `fetch_pr`),
// or from a recorded bundle (`?fixture=file.json`) when previewed in a plain browser.
export const tauri = window.__TAURI__ && window.__TAURI__.core;

// Clicking a native notification: open that PR and jump to the comment.

export const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document): T | null => r.querySelector<T>(s);
export const qa = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document): T[] => [...r.querySelectorAll<T>(s)];

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const icon = (name: string, size = 16, cls = '') => {
  const k = name + (size === 24 ? '-24' : '');
  return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[k] || ''}</svg>`;
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function whenParts(iso: string, lead = 'on '): { title: string; text: string } {
  const d = new Date(iso), now = new Date(), diff = (+now - +d) / 1000;
  const abs = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() !== now.getUTCFullYear() ? ', ' + d.getUTCFullYear() : ''}`;
  const title = d.toUTCString();
  let t;
  if (diff < 30 * 86400 && diff >= 0) {
    const n = (v: number, u: string) => `${v} ${u}${v === 1 ? '' : 's'} ago`;
    t = diff < 60 ? 'now' : diff < 3600 ? n(Math.floor(diff / 60), 'minute') : diff < 86400 ? n(Math.floor(diff / 3600), 'hour') : n(Math.floor(diff / 86400), 'day');
    return { title, text: t };
  }
  return { title, text: `${lead}${abs}` };
}

export function when(iso: string, lead = 'on ') { const w = whenParts(iso, lead); return `<span title="${w.title}">${w.text}</span>`; }

export function fullDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export const user = (u?: Person | null) => (u ? `<a class="actor" href="${esc(u.html_url)}">${esc(u.login)}</a>` : '<span class="actor">ghost</span>');

export const avatar = (u?: Person | null, s = 40) => `<img class="av" loading="lazy" decoding="async" src="${esc(u?.avatar_url || '')}${u?.avatar_url ? (u.avatar_url.includes('?') ? '&' : '?') + 's=' + s * 2 : ''}" width="${s}" height="${s}" alt="@${esc(u?.login || 'ghost')}" style="border-radius:50%;display:block">`;

export const ASSOC: Record<string, string> = { CONTRIBUTOR: 'Contributor', MEMBER: 'Member', OWNER: 'Owner', COLLABORATOR: 'Collaborator', FIRST_TIME_CONTRIBUTOR: 'First-time contributor', FIRST_TIMER: 'First-timer', MANNEQUIN: 'Mannequin' };

export const REACTS: [keyof Reactions, string][] = [['+1', '👍'], ['-1', '👎'], ['laugh', '😄'], ['hooray', '🎉'], ['confused', '😕'], ['heart', '❤️'], ['rocket', '🚀'], ['eyes', '👀']];


export const load = <T>(k: string, d: T): T => { try { return (JSON.parse(localStorage.getItem(k) ?? 'null') as T | null) ?? d; } catch { return d; } };

export const S: AppState = { profile: (() => { try { return JSON.parse(localStorage.getItem('profile') || 'null') as Profile | null; } catch { return null; } })(), bundle: null, tab: 'conversation', mode: localStorage.getItem('mode') || 'auto', error: '', loading: false, showAllReviewers: true, recent: [], hist: [], hi: -1, hasToken: false, sideTab: 'repos', repos: null, reposErr: '', repoFilter: '', repo: null, prs: null, prState: 'open', split: localStorage.getItem('split') === '1', sel: null, cdiff: {}, rdiff: {}, fr: null, lw: +(localStorage.getItem('lw') || 46), notes: load<Note[]>('notes', []), bell: false, fold: load<Record<string, boolean>>('fold', {}), hide: load<Record<string, boolean>>('hide', {}), draft: {}, sbw: +(localStorage.getItem('sbw') || 260), pf: '', psort: localStorage.getItem('psort') || 'updated', pgroup: localStorage.getItem('pgroup') || 'none', who: [], unres: false, range: 'all', rFrom: '', rTo: '', sort: localStorage.getItem('csort') === 'desc' ? 'desc' : 'asc', unIdx: 0, nav: false, busy: '', actErr: null, tabs: [], alive: new Map(), tabMenu: false, closed: [], pushes: {} };

S.recent = (() => { try { return (JSON.parse(localStorage.getItem('recent') ?? 'null') as RecentEntry[] | null) || []; } catch { return []; } })();


export const isDark = () => S.mode === 'dark' || (S.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);

if (!/Mac/i.test(navigator.platform)) document.documentElement.classList.add('not-mac');

// Mirror the unread count into the menu-bar icon.
export const flags = { lastUnread: -1, polling: false };

export function syncUnread() {
  const n = S.notes.filter((x) => !x.read).length;
  if (tauri && n !== flags.lastUnread) { flags.lastUnread = n; tauri!.invoke('set_unread', { count: n }).catch(() => {}); }
}

// Offline: GitHub unreachable (or the machine is offline). The last saved copy is shown with a clear banner and a retry.
S.offline = typeof navigator !== 'undefined' && navigator.onLine === false;

export const isOff = () => !!(S.offline || (S.bundle && S.bundle._cached));

export const offlineBar = () => '';



export function applyMode() {
  const d = document.documentElement, dark = isDark();
  d.setAttribute('data-color-mode', dark ? 'dark' : 'light'); d.setAttribute('data-light-theme', 'light'); d.setAttribute('data-dark-theme', 'dark'); d.setAttribute('data-t', dark ? 'dark' : 'light');
}


export const KEY_RECENT = 'recent';

export const compact = (n?: number | null) => (n == null ? null : n < 1000 ? String(n) : n >= 5000 ? Math.floor(n / 1000) + 'k+' : (Math.floor(n / 100) / 10).toString().replace(/\.0$/, '') + 'k');


// The comment to highlight is state (S.flash): the comment components draw the class and scroll themselves into view.
export const flashLive = () => !!S.flash && Date.now() < S.flashUntil!;
export const flashFor = (id: string) => (S.flash && S.flash.id === id && flashLive() ? { n: S.flash.n, block: S.flash.block, smooth: S.flash.smooth, pop: S.flash.pop } : undefined);
export const setFlash = (id: string, o: { block: 'start' | 'center'; smooth?: boolean; pop?: boolean }) => { S.flash = { id, n: (S.flash?.n || 0) + 1, ...o }; S.flashUntil = Date.now() + 2500; };
