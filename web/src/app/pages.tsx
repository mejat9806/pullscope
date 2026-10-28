import type { BranchInfo, Bundle, InboxItem, InboxState, NewPr, NpListKey } from '../types';
import { rerender, saveDrafts } from './actions';
import { paintNotes } from './notes';
import { paintDlg } from './dialogs';
import { tokenDialog } from './token';
import { curRef } from './tabs';
import { bindSticky, openExternal } from './addressbar';
import { $, S, selNames, syncUnread, tauri, when } from './core';
import { qc, seen } from './data';
import { loadRepos, openPr } from './nav';
import { paintSide } from './side';
import { HomeView } from './home';
import { InboxView, NewPrView, NotesView, RepoView } from './views';
import { PrView } from './pr';
import type { VNode } from 'preact';
import { clearTop, paintTop } from './top';
import type { InboxProps } from '../components/Pages';
import type { NewPrProps, NpMetaProps } from '../components/Pages';
import { Gate, Skeleton } from '../components/Pages';
import type { ShellProps } from '../components/Shell';
import { roCls } from './reorder';
import { ibPins, ibViews, isSnoozed, snoozeLabel } from './inboxtools';
import { scrollBtn, scrolled } from './scrolling';
import { request } from '../components/req';
import { batch, beginDrag, setDragging, setGate, setShell, shellProps } from './frame';

export const saveNotes = () => localStorage.setItem('notes', JSON.stringify(S.notes));

export function notesProps() {
  const f = S.nf || 'all', unread = S.notes.filter((n) => !n.read).length;
  const rows = S.notes.filter((n) => f === 'all' || (f === 'unread' ? !n.read : n.read)).map((n) => ({ id: n.id, read: !!n.read, ref: n.ref, target: n.target || '', title: n.title, text: n.text, when: when(n.at).replace(/<\/?span[^>]*>/g, '') }));
  return { f, rows, unread, total: S.notes.length };
}


// ---- Inbox: PRs that need you ----
export async function loadInbox(force = false) {
  S.inbox = S.inbox || { data: null, err: '', loading: true };
  S.inbox!.loading = true; S.inbox!.err = ''; render();
  try { S.inbox!.data = tauri ? await tauri!.invoke('inbox', { force, repos: selNames() }) : { requested: [], mine: [], ready: [] }; }
  catch (e) { S.inbox!.err = String(e).replace(/^Error: /, ''); }
  S.inbox!.loading = false; S.keepScroll = true; render(); S.keepScroll = false;
}


// ---- New pull request ----
export const npHuman = (s: string) => s.replace(/^[a-z]+\//i, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export let npSeq = 0;
export const bumpNp = () => { npSeq++; };

export function newPrProps(): NewPrProps {
  const n = S.np!, repos = (S.repos || []).filter((r) => !r.archived), br = n.branches[n.repo];
  const same = !!(n.base && n.base === n.head);
  const c = n.cmp;
  const cmp = c === 'loading' ? { kind: 'loading' as const, text: '', ahead: 0, files: 0, behind: 0 } : !c ? { kind: 'none' as const, text: '', ahead: 0, files: 0, behind: 0 } : typeof c === 'string' ? { kind: 'err' as const, text: c, ahead: 0, files: 0, behind: 0 }
    : c.ahead_by ? { kind: 'ok' as const, text: '', ahead: c.ahead_by, files: c.files, behind: c.behind_by } : { kind: 'same' as const, text: '', ahead: 0, files: 0, behind: 0 };
  const ready = !!(n.title.trim() && n.repo && n.base && n.head && !same && n.cmp && typeof n.cmp === 'object' && n.cmp.ahead_by > 0);
  return ({ hasRepos: repos.length > 0, repo: n.repo, base: n.base, head: n.head, hasBranches: !!br, same, cmp, title: n.title, tpls: n.tpl[`${n.repo}|${n.base}`] ?? null, tplText: n.tplText, seq: npSeq, isDraft: !!n.draft, err: n.err || '', ready, meta: npMetaProps(n) });
}

// Reviewers / assignees / labels / milestone / linked issues pickers
export function npMetaProps(n: NewPr): NpMetaProps | null {
  const m = n.meta?.[n.repo]; if (!m) return null;
  const ppl = m.people.map((x) => x.login), me = S.me || '';
  const row = (k: NpListKey, name: string, list: string[]) => ({ k, name, chips: n[k].slice() as string[], free: list.filter((x) => !n[k].includes(x)) });
  return ({ rows: [row('reviewers', 'Reviewers', ppl.filter((x) => x !== me)), row('assignees', 'Assignees', ppl), row('labels', 'Labels', m.labels.map((x) => x.name))], milestones: m.milestones.map((x) => ({ number: x.number, title: x.title, on: String(n.milestone) === String(x.number) })), issues: n.issues });
}

export async function npLoadMeta(repo: string) {
  const n = S.np; if (!repo || !tauri || n!.meta[repo]) return;
  try { n!.meta[repo] = await tauri!.invoke('repo_meta', { repo }); } catch { n!.meta[repo] = { people: [], labels: [], milestones: [] }; }
  if (S.np === n) rerender();
}

export async function npLoadBranches(repo: string) {
  const n = S.np; npLoadMeta(repo); if (!repo || n!.branches[repo]) return npPickDefaults();
  if (!tauri) { n!.err = 'Creating pull requests needs the desktop app.'; return render(); }
  try { n!.branches[repo] = await tauri!.invoke('list_branches', { repo }); n!.err = ''; } catch (e) { n!.err = String(e).replace(/^Error: /, ''); n!.branches[repo] = { default: '', branches: [] } as unknown as BranchInfo; }
  npPickDefaults();
}

export function npPickDefaults() {
  const n = S.np, b = n!.branches[n!.repo]; if (!b) return render();
  if (!b.branches.includes(n!.base)) n!.base = b.default || b.branches[0] || '';
  if (!b.branches.includes(n!.head) || n!.head === n!.base) n!.head = b.branches.find((x) => x !== n!.base) || '';
  npCompare();
}

// Pull request templates from the repo: pre-fill an empty description (or one still showing the previous template).
export async function npLoadTemplates() {
  const n = S.np; if (!n!.repo || !n!.base || !tauri) return;
  const k = `${n!.repo}|${n!.base}`; if (n!.tpl[k] !== undefined) return n!.tpl[k] ? npApplyTemplate() : undefined;
  n!.tpl[k] = null;
  try { n!.tpl[k] = await tauri!.invoke('pr_templates', { repo: n!.repo, base: n!.base }); } catch { n!.tpl[k] = []; }
  if (S.np === n && `${n!.repo}|${n!.base}` === k) npApplyTemplate();
}

export function npApplyTemplate() {
  const n = S.np, list = n!.tpl[`${n!.repo}|${n!.base}`], cur = (S.draft.newpr || '').trim();
  if (list?.length && (!cur || cur === n!.tplText.trim())) { S.draft.newpr = n!.tplText = list[0].body; saveDrafts(); }
  rerender();
}

export async function npCompare() {
  const n = S.np; n!.cmp = null; npLoadTemplates();
  if (!n!.repo || !n!.base || !n!.head || n!.base === n!.head) return rerender();
  const key = `${n!.repo}|${n!.base}|${n!.head}`; n!.key = key; n!.cmp = 'loading'; rerender();
  try {
    const r = await tauri!.invoke('compare_branches', { repo: n!.repo, base: n!.base, head: n!.head }); if (S.np!.key !== key) return;
    n!.cmp = r;
    if (!n!.titleTouched) n!.title = r.commits.length === 1 ? r.commits[0] : npHuman(n!.head);
  } catch (e) { if (S.np!.key !== key) return; n!.cmp = String(e).replace(/^Error: /, ''); }
  rerender();
}

export function openNewPr(repo?: string, head?: string) {
  const cur = (typeof repo === 'string' && repo) || S.bundle?.pull.base.repo.full_name || S.repo || '';
  bumpNp(); S.view = 'newpr'; S.nav = false; S.np = { repo: cur, base: '', head: (typeof head === 'string' && head) || '', branches: {}, meta: {}, reviewers: [], assignees: [], labels: [], milestone: '', issues: '', cmp: null, title: '', titleTouched: false, draft: false, err: '', key: '', tpl: {}, tplText: '' };
  delete S.draft.newpr; render();
  if (tauri && !S.repos) loadRepos().then(() => { if (!S.np!.repo && S.repos?.[0]) S.np!.repo = S.repos[0].full_name; npLoadBranches(S.np!.repo); }); else npLoadBranches(cur);
}


export function openInbox() { S.view = 'inbox'; S.nav = false; render(); if (!S.inbox?.data || !qc.fresh('inbox', 45000)) { qc.set('inbox', 1 as unknown as Bundle); loadInbox(); } }

export const IB_SORTS: [string, string][] = [['updated', 'Newest activity'], ['oldest', 'Oldest activity'], ['comments', 'Most comments'], ['repo', 'Repository'], ['author', 'Author'], ['title', 'Title']];
const ibCmp = (k: string): ((a: InboxItem, b: InboxItem) => number) => {
  const t = (x: string, y: string) => x.localeCompare(y, undefined, { sensitivity: 'base' }), at = (a: InboxItem, b: InboxItem) => (b.updated_at > a.updated_at ? 1 : b.updated_at < a.updated_at ? -1 : 0);
  switch (k) {
    case 'oldest': return (a, b) => at(b, a);
    case 'comments': return (a, b) => (b.comments || 0) - (a.comments || 0) || at(a, b);
    case 'repo': return (a, b) => t(a.repo, b.repo) || at(a, b);
    case 'author': return (a, b) => t(a.user, b.user) || at(a, b);
    case 'title': return (a, b) => t(a.title, b.title);
    default: return at;
  }
};
export const ibSecKey = (title: string) => 'ib:' + title;
export const IB_TITLES = ['Pinned', 'Review requested', 'Ready to merge', 'Mentioned', 'Participated', 'Your pull requests', 'Recently closed or merged', 'Snoozed'];
// The section order is the user's: saved as a list of titles, with any section not in it kept in its default place.
export const ibOrder = () => { const saved = S.ibOrder || []; return [...(saved.includes('Pinned') ? [] : ['Pinned']), ...saved.filter((t) => IB_TITLES.includes(t)), ...IB_TITLES.filter((t) => !saved.includes(t) && t !== 'Pinned')]; };
export function inboxProps(): InboxProps {
  const I: Partial<InboxState> = S.inbox || { loading: true }, d = I.data, q = (S.ibQ || '').toLowerCase(), cmp = ibCmp(S.ibSort || 'updated');
  const pins = ibPins();
  const row = (p: InboxItem) => { const ref = `${p.repo}#${p.number}`, was = seen[ref]?.at; return { ref, avatar: p.avatar, title: p.title, sub: `${ref} · ${p.user} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}${p.draft ? ' · Draft' : ''}`, fresh: !!(was && p.updated_at > was), comments: p.comments || 0, updated: p.updated_at, pinned: pins.includes(ref), snz: snoozeLabel(ref), sel: S.ibSel === ref, snzOpen: S.ibSnzOpen === ref }; };
  const refOf = (x: InboxItem) => `${x.repo}#${x.number}`, match = (x: InboxItem) => !q || `${x.title} ${x.repo} ${x.user} #${x.number}`.toLowerCase().includes(q);
  const lists: [string, string, InboxItem[]][] = d ? [['Review requested', 'Waiting on you', d.requested], ['Ready to merge', 'Your approved pull requests', d.ready], ['Mentioned', 'Open PRs where you were @mentioned', d.mentioned || []], ['Participated', 'Open PRs you commented on or reviewed', d.participated || []], ['Your pull requests', 'Open PRs you opened', d.mine], ['Recently closed or merged', 'PRs you were involved in', d.closed || []]] : [];
  // Snoozed PRs leave every list; pinned ones move up into their own section.
  const everything = new Map<string, InboxItem>(); lists.forEach(([, , l]) => l.forEach((x) => everything.has(refOf(x)) || everything.set(refOf(x), x)));
  const snoozed = [...everything.values()].filter((x) => isSnoozed(refOf(x), x.updated_at)), hidden = new Set(snoozed.map(refOf));
  const pinned = [...everything.values()].filter((x) => pins.includes(refOf(x)) && !hidden.has(refOf(x)));
  const taken = new Set([...hidden, ...pinned.map(refOf)]);
  const sec = (title: string, sub: string, list: InboxItem[]) => ({ title, sub, key: ibSecKey(title), closed: !!S.fold[ibSecKey(title)], rows: list.filter(match).sort(cmp).map(row) });
  const all = d ? [...(pinned.length ? [sec('Pinned', 'Kept on top', pinned)] : []), ...lists.map(([t, s, l]) => sec(t, s, l.filter((x) => !taken.has(refOf(x))))), ...(snoozed.length ? [sec('Snoozed', 'Hidden until their time is up or they have new activity', snoozed)] : [])] : null;
  const order = ibOrder();
  return ({ loading: !!I.loading, err: I.err || '', sort: S.ibSort || 'updated', sorts: IB_SORTS, q: S.ibQ || '', custom: !!S.ibOrder?.length, views: ibViews().map((v) => v.name), view: S.ibView || '', naming: !!S.ibNaming, secs: all ? all.sort((x, y) => order.indexOf(x.title) - order.indexOf(y.title)).map((x, i, l) => ({ ...x, first: i === 0, last: i === l.length - 1, ro: roCls('ib', x.title) })) : null });
}




// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
export const needSignIn = () => (tauri && S.authChecked && !S.hasToken) || new URLSearchParams(location.search).get('gate') === '1';


// #app holds two persistent hosts: Preact owns #top (toolbar and tab strip) and #rest (the shell, or the sign-in gate).
export { setDragging } from './frame';
// The page scrolls where the state says: every move is a numbered request that the shown page applies.
export function scrollMain(top: number, smooth = false) { S.mainTop = top; request('scroll:main', { top, smooth }); }
// The sidebar grip: drag to resize, double-click to reset; the scrim closes the mobile drawer.
const gripDown = (e: MouseEvent) => {
  e.preventDefault(); const x0 = e.clientX, w0 = S.sbw;
  setDragging(true);
  beginDrag({ move: (ev) => { S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0)); repaintShell({ sbw: S.sbw }); }, end: () => { setDragging(false); localStorage.setItem('sbw', String(Math.round(S.sbw))); } });
};
const gripReset = () => { S.sbw = 260; localStorage.setItem('sbw', '260'); S.keepScroll = true; render(); S.keepScroll = false; };
const scrimTap = () => { S.nav = false; S.keepScroll = true; render(); S.keepScroll = false; };

export const repaintShell = (patch: Partial<ShellProps>) => { const cur = shellProps(); if (cur) setShell({ ...cur, ...patch }); };

const liveView = (): VNode | null => {
  if (S.loading) return <Skeleton />;
  if (S.view === 'inbox') return <InboxView />;
  if (S.view === 'notes') return <NotesView />;
  if (S.view === 'repo') return <RepoView />;
  if (S.view === 'newpr') return S.np ? <NewPrView /> : null;
  if (S.view === 'pr' && S.bundle) return <PrView />;
  return (S.view === 'home' || !S.bundle) && S.view !== 'newpr' ? <HomeView /> : null;
};

// Links inside a pull request page (comment bodies are pre-built HTML) open in the app or the browser.
const followLink = (e: MouseEvent) => {
  if (S.view !== 'pr') return;
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]'); if (!a) return;
  e.preventDefault(); const h = a.getAttribute('href');
  if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h!)) openPr(h!); else if (/^https?:\/\//.test(h!)) openExternal(h!);
};

// What the page last drew for the open pull request: leaving the tab parks exactly this vnode, coming back puts it in again untouched.
let shown: { ref: string; vnode: VNode } | null = null;
export const shownPage = () => shown;

export function render() {
  if (needSignIn()) {
    shown = null;
    batch(() => { clearTop(); setGate(<Gate err={S.gateErr ? String(S.gateErr) : ''} go={() => { tokenDialog(); setTimeout(() => $('#oauthgo')?.click(), 50); }} tok={tokenDialog} />); paintDlg(); });
    return;
  }
  const stash = S.stash, live = stash ? stash.vnode : liveView(), ref = curRef();
  const key = S.loading ? 'loading' : S.view === 'pr' && S.bundle ? 'pr:' + ref : S.view || 'home';
  if (S.view === 'pr' && S.bundle && !S.loading && live) shown = { ref, vnode: live };
  const kept = [...S.alive].filter(([r]) => 'pr:' + r !== key).map(([r, a]) => ({ key: 'pr:' + r, children: a.vnode }));
  batch(() => {
    paintTop();
    setShell({ nav: !!S.nav, navHidden: !!S.hide.nav, sbw: S.sbw, lw: S.lw, fade: !!S.fadeMain, enter: !!S.enter, stuck: !!S.stuck, active: { key, children: live }, onPage: followLink, onGrip: (e) => gripDown(e), onGripReset: () => gripReset(), onScrim: () => scrimTap(), onScroll: (e) => scrolled('main', e.currentTarget as HTMLElement), onMeasure: (el) => { if (S.scrollId === 'main' || !S.scrollId) scrollBtn(el); }, kept });
    paintSide(); paintDlg(); paintNotes();
  });
  S.stash = null;
  (S.ios || []).forEach((o) => o.disconnect()); S.ios = []; bindSticky();
  if (S.fadeMain) S.fadeMain = false;
  syncUnread();
  document.title = S.bundle ? `${S.bundle.pull.title} · ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : 'GitHub PR View';
}
