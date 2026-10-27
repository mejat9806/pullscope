import type { BranchInfo, Bundle, Check, Inbox, InboxItem, InboxState, NewPr, NpListKey, Pull, Template } from '../types';
import { draftBox, rerender, saveDrafts, setBusy } from './actions';
import { bind, bindTokenDialog, tokDlgHtml, tokenDialog } from './bind';
import { homePage } from './bindwrite';
import { prHeader } from './comments';
import { $, S, applyMode, esc, icon, syncUnread, tauri, when, qa } from './core';
import { notePanel, pushBanners, qc, seen } from './data';
import { commitsView, filesView, sidebar, splitView } from './mergebox';
import { loadRepos } from './nav';
import { crumbs, prList, repoHeader } from './prlist';
import { sideRecent } from './tabs';
import { clearTop, paintTop } from './top';
import { attention, checksView, timeline } from './timeline';
import { gateHtmlStr, inboxPageHtml, landingHtml, newPrHtml, notesPageHtml, npMetaHtml, prPageHtml, skeletonHtml, splitPageHtml } from '../components/Pages';

export function landing() {
  return landingHtml(pushBanners(), S.error ? String(S.error) : '', icon('git-pull-request', 24).replace('width="24" height="24"', 'width="40" height="40"'));
}


export const saveNotes = () => localStorage.setItem('notes', JSON.stringify(S.notes));

export function notesPage() {
  const f = S.nf || 'all', unread = S.notes.filter((n) => !n.read).length;
  const rows = S.notes.filter((n) => f === 'all' || (f === 'unread' ? !n.read : n.read)).map((n) => ({ id: n.id, read: !!n.read, ref: n.ref, target: n.target || '', title: n.title, text: n.text, when: when(n.at).replace(/<\/?span[^>]*>/g, '') }));
  return notesPageHtml({ f, rows, unread, total: S.notes.length });
}


// ---- Inbox: PRs that need you ----
export async function loadInbox(force = false) {
  S.inbox = S.inbox || { data: null, err: '', loading: true };
  S.inbox!.loading = true; S.inbox!.err = ''; render();
  try { S.inbox!.data = tauri ? await tauri!.invoke('inbox', { force }) : { requested: [], mine: [], ready: [] }; }
  catch (e) { S.inbox!.err = String(e).replace(/^Error: /, ''); }
  S.inbox!.loading = false; S.keepScroll = true; render(); S.keepScroll = false;
}


// ---- New pull request ----
export const npHuman = (s: string) => s.replace(/^[a-z]+\//i, '').replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function newPrPage() {
  const n = S.np!, repos = (S.repos || []).filter((r) => !r.archived), br = n.branches[n.repo];
  const same = !!(n.base && n.base === n.head);
  const c = n.cmp;
  const cmp = c === 'loading' ? { kind: 'loading' as const, text: '', ahead: 0, files: 0, behind: 0 } : !c ? { kind: 'none' as const, text: '', ahead: 0, files: 0, behind: 0 } : typeof c === 'string' ? { kind: 'err' as const, text: c, ahead: 0, files: 0, behind: 0 }
    : c.ahead_by ? { kind: 'ok' as const, text: '', ahead: c.ahead_by, files: c.files, behind: c.behind_by } : { kind: 'same' as const, text: '', ahead: 0, files: 0, behind: 0 };
  const ready = !!(n.title.trim() && n.repo && n.base && n.head && !same && n.cmp && typeof n.cmp === 'object' && n.cmp.ahead_by > 0);
  return newPrHtml({ hasRepos: repos.length > 0, repo: n.repo, base: n.base, head: n.head, hasBranches: !!br, same, cmp, title: n.title, tpls: n.tpl[`${n.repo}|${n.base}`] ?? null, tplText: n.tplText, draftBox: draftBox('newpr', 'Describe your changes', 8), isDraft: !!n.draft, err: n.err || '', ready, meta: npMeta(n) });
}

// Reviewers / assignees / labels / milestone / linked issues pickers
// Reviewers, assignees and labels redraw only their own box, so the page (and the description editor) stay where they are.
export function npMetaRefresh() { const el = $('#npmeta')!; if (!el) return rerender(); el.outerHTML = npMeta(S.np!); bindNpMeta(); }

export function bindNpMeta() {
  qa('#npmeta [data-npadd]').forEach((el) => el.addEventListener('change', (e) => { if ((e.target as HTMLInputElement).value) { S.np![el.dataset.npadd as NpListKey].push((e.target as HTMLInputElement).value); npMetaRefresh(); } }));
  qa('#npmeta [data-npdel]').forEach((el) => el.addEventListener('click', () => { const k = el.dataset.npdel as NpListKey; S.np![k] = S.np![k].filter((x: string) => x !== el.dataset.v); npMetaRefresh(); }));
  $<HTMLSelectElement>('#npmile')?.addEventListener('change', (e) => { S.np!.milestone = (e.target as HTMLInputElement).value; });
  $<HTMLInputElement>('#npissues')?.addEventListener('input', (e) => { S.np!.issues = (e.target as HTMLInputElement).value; });
}

export function npMeta(n: NewPr) {
  const m = n.meta?.[n.repo]; if (!m) return '';
  const ppl = m.people.map((x) => x.login), me = S.me || '';
  const row = (k: NpListKey, name: string, list: string[]) => ({ k, name, chips: n[k].slice() as string[], free: list.filter((x) => !n[k].includes(x)) });
  return npMetaHtml({ rows: [row('reviewers', 'Reviewers', ppl.filter((x) => x !== me)), row('assignees', 'Assignees', ppl), row('labels', 'Labels', m.labels.map((x) => x.name))], milestones: m.milestones.map((x) => ({ number: x.number, title: x.title, on: String(n.milestone) === String(x.number) })), issues: n.issues });
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
  S.view = 'newpr'; S.nav = false; S.np = { repo: cur, base: '', head: (typeof head === 'string' && head) || '', branches: {}, meta: {}, reviewers: [], assignees: [], labels: [], milestone: '', issues: '', cmp: null, title: '', titleTouched: false, draft: false, err: '', key: '', tpl: {}, tplText: '' };
  delete S.draft.newpr; render();
  if (tauri && !S.repos) loadRepos().then(() => { if (!S.np!.repo && S.repos?.[0]) S.np!.repo = S.repos[0].full_name; npLoadBranches(S.np!.repo); }); else npLoadBranches(cur);
}


export function openInbox() { S.view = 'inbox'; S.nav = false; render(); if (!S.inbox?.data || !qc.fresh('inbox', 45000)) { qc.set('inbox', 1 as unknown as Bundle); loadInbox(); } }

export function inboxPage() {
  const I: Partial<InboxState> = S.inbox || { loading: true }, d = I.data;
  const row = (p: InboxItem) => { const ref = `${p.repo}#${p.number}`, was = seen[ref]?.at; return { ref, avatar: p.avatar, title: p.title, sub: `${ref} · ${p.user} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}${p.draft ? ' · Draft' : ''}`, fresh: !!(was && p.updated_at > was), comments: p.comments || 0 }; };
  const sec = (title: string, sub: string, list: InboxItem[]) => ({ title, sub, rows: list.map(row) });
  return inboxPageHtml({ loading: !!I.loading, err: I.err || '', secs: d ? [sec('Review requested', 'Waiting on you', d.requested), sec('Ready to merge', 'Your approved pull requests', d.ready), sec('Your pull requests', 'Open PRs you opened', d.mine)] : null });
}


export function page() {
  const b = S.bundle;
  if (S.loading) return skeletonHtml();
  if (S.view === 'newpr') return crumbs(S.np!?.repo, [{ t: 'New pull request' }]) + newPrPage();
  if (S.view === 'inbox') return crumbs('', [{ t: 'Inbox' }]) + inboxPage();
  if (S.view === 'notes') return crumbs('', [{ t: 'Notifications' }]) + notesPage();
  if (S.view === 'repo') return crumbs(S.repo!, [{ t: 'Pull requests' }]) + prList();
  if (S.view === 'home' || !b) return crumbs('', S.homeOwner ? [{ t: S.homeOwner }] : []) + homePage();
  if (S.split && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') return splitPageHtml(repoHeader(b.pull) + prHeader(b), splitView(b));
  const body = S.tab === 'files' ? filesView(b) : S.tab === 'commits' ? commitsView(b) : S.tab === 'checks' ? checksView(b) : S.tab === 'timeline' ? `<div class="rail">${timeline(b)}</div>` : attention(b) + timeline(b);
  const side = S.tab !== 'conversation' ? { kind: 'none' as const } : S.hide.side ? { kind: 'rail' as const, ic: icon('columns') } : { kind: 'aside' as const, x: icon('x'), inner: sidebar(b) };
  return prPageHtml({ header: repoHeader(b.pull) + prHeader(b), body, side });
}


// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
export const needSignIn = () => (tauri && S.authChecked && !S.hasToken) || new URLSearchParams(location.search).get('gate') === '1';

export function gateHtml() { return gateHtmlStr(icon('alert'), S.gateErr ? String(S.gateErr) : ''); }

// #app holds two persistent hosts: Preact owns #top (toolbar and tab strip), #rest is still markup.
function hosts() {
  const app = $('#app')!;
  if (!app.querySelector(':scope > #top')) app.innerHTML = '<div id="top" style="display:contents"></div><div id="rest" style="display:contents"></div>';
  return { top: $('#top')!, rest: $('#rest')! };
}

export function render() {
  applyMode();
  const { top, rest } = hosts();
  if (needSignIn()) {
    (S.eds || []).forEach((e) => e.destroy()); S.eds = []; S.lastHtml = '';
    clearTop(top); rest.innerHTML = `${gateHtml()}${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}`;
    $('#gatego')?.addEventListener('click', () => { tokenDialog(); setTimeout(() => $('#oauthgo')?.click(), 50); });
    $('#gatetok')?.addEventListener('click', tokenDialog);
    bindTokenDialog(); return;
  }
  paintTop(top);
  const html = `<div class="shell ${S.nav ? 'nav-open' : ''} ${S.hide.nav ? 'nav-hidden' : ''}" style="--sbw:${S.sbw}px">${sideRecent()}<div class="sb-grip" id="sbgrip" title="Drag to resize · double-click to reset"></div><div class="scrim" id="scrim"></div><div class="main">${S.mainStub ? '' : page()}</div></div>${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}${notePanel()}`;
  const scroll = $('.main')?.scrollTop || 0;
  const viewKey = () => `${S.bundle?.pull?.id ?? ''}|${S.tab}|${$('.main > *')?.className ?? ''}`, before = viewKey();
  const same = () => viewKey() === before;
  // Anchor on the first element with an id that is on screen, so a redraw keeps *it* where it was
  // (heights above the viewport can change between renders, which made the view creep upward).
  let anchor = null;
  { const mn = $('.main')!; if (mn) { const top = mn.getBoundingClientRect().top; for (const el of mn.querySelectorAll('[id]')) { const r = el.getBoundingClientRect(); if (r.bottom > top + 4) { anchor = { id: el.id, off: r.top - top }; break; } } } }
  const inner = true ? [...qa('.pane-body, .cm-list, .sb-list')].map((e) => [e.parentElement!.className + e.className, e.scrollTop]) : [];
  if (html === S.lastHtml && rest.firstElementChild && !S.fadeMain) return;
  (S.eds || []).forEach((e) => e.destroy()); S.eds = [];
  rest.innerHTML = html; S.lastHtml = html;
  qa('.sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement!.className + e.className); if (m) e.scrollTop = m[1] as number; });
  if (S.keepScroll || same()) { $('.main')!.scrollTop = scroll; if (anchor) { const el = document.getElementById(anchor.id), mn = $('.main'); if (el) mn!.scrollTop += el.getBoundingClientRect().top - mn!.getBoundingClientRect().top - anchor.off; } qa('.pane-body, .cm-list, .sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement!.className + e.className); if (m) e.scrollTop = m[1] as number; }); }
  bind(); bindTokenDialog();
  if (S.fadeMain) { S.fadeMain = false; $('.main')?.classList.add('tab-in'); }
  if (S.busy && S.busySel) setBusy($!(S.busySel), true);
  syncUnread();
  // A re-render (fresh data arriving) must not wipe the highlight of the comment we just jumped to.
  if (S.flashId && Date.now() < S.flashUntil!) document.getElementById('c-' + S.flashId)?.classList.add('flash'); else S.flashId = '';
  document.title = S.bundle ? `${S.bundle.pull.title} · ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : 'GitHub PR View';
}
