import { openPr } from './nav';
import { render } from './pages';

// GitHub pull request page renderer. Data arrives from the Rust backend (Tauri `fetch_pr`),
// or from a recorded bundle (`?fixture=file.json`) when previewed in a plain browser.
export const tauri = window.__TAURI__ && window.__TAURI__.core;

// Clicking a native notification: open that PR and jump to the comment.
if (window.__TAURI__ && window.__TAURI__.event) window.__TAURI__.event.listen('notif-click', (e) => { const { ref, target } = e.payload || {}; if (!ref) return; S.nav = false; S.bell = false; S.focus = target || ''; openPr(ref); });

export const $ = (s: string, r: any = document): any => r.querySelector(s);

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const icon = (name, size = 16, cls = '') => {
  const k = name + (size === 24 ? '-24' : '');
  return `<svg class="octicon ${cls}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${(window.OCTICONS || {})[k] || ''}</svg>`;
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function when(iso, lead = 'on ') {
  const d: any = new Date(iso), now: any = new Date(), diff = (now - d) / 1000;
  const abs = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() !== now.getUTCFullYear() ? ', ' + d.getUTCFullYear() : ''}`;
  const title = d.toUTCString();
  let t;
  if (diff < 30 * 86400 && diff >= 0) {
    const n = (v, u) => `${v} ${u}${v === 1 ? '' : 's'} ago`;
    t = diff < 60 ? 'now' : diff < 3600 ? n(Math.floor(diff / 60), 'minute') : diff < 86400 ? n(Math.floor(diff / 3600), 'hour') : n(Math.floor(diff / 86400), 'day');
    return `<span title="${title}">${t}</span>`;
  }
  return `<span title="${title}">${lead}${abs}</span>`;
}

export function fullDate(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export const user = (u) => (u ? `<a class="actor" href="${esc(u.html_url)}">${esc(u.login)}</a>` : '<span class="actor">ghost</span>');

export const avatar = (u, s = 40) => `<img class="av" src="${esc(u?.avatar_url || '')}${u?.avatar_url ? (u.avatar_url.includes('?') ? '&' : '?') + 's=' + s * 2 : ''}" width="${s}" height="${s}" alt="@${esc(u?.login || 'ghost')}" style="border-radius:50%;display:block">`;

export const ASSOC = { CONTRIBUTOR: 'Contributor', MEMBER: 'Member', OWNER: 'Owner', COLLABORATOR: 'Collaborator', FIRST_TIME_CONTRIBUTOR: 'First-time contributor', FIRST_TIMER: 'First-timer', MANNEQUIN: 'Mannequin' };

export const REACTS = [['+1', '👍'], ['-1', '👎'], ['laugh', '😄'], ['hooray', '🎉'], ['confused', '😕'], ['heart', '❤️'], ['rocket', '🚀'], ['eyes', '👀']];


export const load = (k: string, d?: any): any => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export const S: Record<string, any> = { profile: (() => { try { return JSON.parse(localStorage.getItem('profile') || 'null'); } catch { return null; } })(), bundle: null, tab: 'conversation', mode: localStorage.getItem('mode') || 'auto', error: '', loading: false, showAllReviewers: true, recent: [], hist: [], hi: -1, hasToken: false, sideTab: 'repos', repos: null, reposErr: '', repoFilter: '', repo: null, prs: null, prState: 'open', split: localStorage.getItem('split') === '1', sel: null, cdiff: {}, rdiff: {}, fr: null, lw: +(localStorage.getItem('lw') || 46), notes: load('notes', []), bell: false, fold: load('fold', {}), hide: load('hide', {}), draft: {}, sbw: +(localStorage.getItem('sbw') || 260), pf: '', psort: localStorage.getItem('psort') || 'updated', pgroup: localStorage.getItem('pgroup') || 'none', who: [], unres: false, range: 'all', rFrom: '', rTo: '', sort: localStorage.getItem('csort') === 'desc' ? 'desc' : 'asc', unIdx: 0, nav: false, busy: '', actErr: '' };

S.recent = (() => { try { return JSON.parse(localStorage.getItem('recent')) || []; } catch { return []; } })();


export const isDark = () => S.mode === 'dark' || (S.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);

if (!/Mac/i.test(navigator.platform)) document.documentElement.classList.add('not-mac');

// Mirror the unread count into the menu-bar icon.
export const flags = { lastUnread: -1, polling: false };

export function syncUnread() {
  const n = S.notes.filter((x) => !x.read).length;
  if (tauri && n !== flags.lastUnread) { flags.lastUnread = n; tauri.invoke('set_unread', { count: n }).catch(() => {}); }
}

// Offline: GitHub unreachable (or the machine is offline). The last saved copy is shown with a clear banner and a retry.
S.offline = typeof navigator !== 'undefined' && navigator.onLine === false;

export const isOff = () => !!(S.offline || (S.bundle && S.bundle._cached));

export const offlineBar = () => '';

addEventListener('offline', () => { S.offline = true; S.keepScroll = true; render(); S.keepScroll = false; });

addEventListener('online', () => { S.offline = false; if (S.bundle && S.view === 'pr') openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true }); else render(); });

export function applyMode() {
  const d = document.documentElement, dark = isDark();
  d.setAttribute('data-color-mode', dark ? 'dark' : 'light'); d.setAttribute('data-light-theme', 'light'); d.setAttribute('data-dark-theme', 'dark'); d.setAttribute('data-t', dark ? 'dark' : 'light');
}


export const KEY_RECENT = 'recent';

export const compact = (n) => (n == null ? null : n < 1000 ? String(n) : n >= 5000 ? Math.floor(n / 1000) + 'k+' : (Math.floor(n / 100) / 10).toString().replace(/\.0$/, '') + 'k');
