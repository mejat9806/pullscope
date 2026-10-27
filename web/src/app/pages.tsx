import type { BranchInfo, Bundle, InboxItem, InboxState, NewPr, NpListKey } from '../types';
import { mountEditors, rerender, saveDrafts, setBusy } from './actions';
import { syncFoldAll } from './bind';
import { paintNotes } from './notes';
import { paintDlg } from './dialogs';
import { tokenDialog } from './token';
import { bindSticky, openExternal } from './addressbar';
import { $, S, applyMode, icon, syncUnread, tauri, when, qa } from './core';
import { pushBanners, qc, seen } from './data';
import { loadRepos, openPr } from './nav';
import { paintSide } from './side';
import { HomeView } from './home';
import { InboxView, NewPrView, NotesView, RepoView } from './views';
import { PrView } from './pr';
import { render as paint } from 'preact';
import type { VNode } from 'preact';
import { clearTop, paintTop } from './top';
import type { InboxProps } from '../components/Pages';
import type { NewPrProps, NpMetaProps } from '../components/Pages';
import { gateHtmlStr, landingHtml, skeletonHtml } from '../components/Pages';

export function landing() {
  return landingHtml(pushBanners(), S.error ? String(S.error) : '', icon('git-pull-request', 24).replace('width="24" height="24"', 'width="40" height="40"'));
}


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
  try { S.inbox!.data = tauri ? await tauri!.invoke('inbox', { force }) : { requested: [], mine: [], ready: [] }; }
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

export function inboxProps(): InboxProps {
  const I: Partial<InboxState> = S.inbox || { loading: true }, d = I.data;
  const row = (p: InboxItem) => { const ref = `${p.repo}#${p.number}`, was = seen[ref]?.at; return { ref, avatar: p.avatar, title: p.title, sub: `${ref} · ${p.user} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}${p.draft ? ' · Draft' : ''}`, fresh: !!(was && p.updated_at > was), comments: p.comments || 0 }; };
  const sec = (title: string, sub: string, list: InboxItem[]) => ({ title, sub, rows: list.map(row) });
  return ({ loading: !!I.loading, err: I.err || '', secs: d ? [sec('Review requested', 'Waiting on you', d.requested), sec('Ready to merge', 'Your approved pull requests', d.ready), sec('Your pull requests', 'Open PRs you opened', d.mine)] : null });
}


export function page() { return S.loading ? skeletonHtml() : ''; }


// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
export const needSignIn = () => (tauri && S.authChecked && !S.hasToken) || new URLSearchParams(location.search).get('gate') === '1';

export function gateHtml() { return gateHtmlStr(icon('alert'), S.gateErr ? String(S.gateErr) : ''); }

// #app holds two persistent hosts: Preact owns #top (toolbar and tab strip), #rest is still markup.
function hosts() {
  const app = $('#app')!;
  if (!app.querySelector(':scope > #top')) app.innerHTML = '<div id="top" style="display:contents"></div><div id="rest" style="display:contents"></div>';
  return { top: $('#top')!, rest: $('#rest')! };
}

// Views that are already live Preact trees; every other view is still markup painted into #page.
const liveView = (): VNode | null => {
  if (S.loading || S.mainStub) return null;
  if (S.view === 'inbox') return <InboxView />;
  if (S.view === 'notes') return <NotesView />;
  if (S.view === 'repo') return <RepoView />;
  if (S.view === 'newpr') return S.np ? <NewPrView /> : null;
  if (S.view === 'pr' && S.bundle) return <PrView />;
  return (S.view === 'home' || !S.bundle) && S.view !== 'newpr' ? <HomeView /> : null;
};

// Links inside a pull request page (comment bodies are pre-built HTML) open in the app or the browser.
const linkHosts = new WeakSet<Element>();
const followLink = (e: MouseEvent) => {
  if (S.view !== 'pr') return;
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]'); if (!a) return;
  e.preventDefault(); const h = a.getAttribute('href');
  if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h!)) openPr(h!); else if (/^https?:\/\//.test(h!)) openExternal(h!);
};

function paintPage(host: HTMLElement, live: VNode) {
  host.setAttribute('data-live', '');
  if (!linkHosts.has(host)) { linkHosts.add(host); host.addEventListener('click', followLink); }
  paint(live, host); mountEditors(); syncFoldAll(); bindSticky();
}

export function render() {
  applyMode();
  const { top, rest } = hosts();
  if (needSignIn()) {
    (S.eds || []).forEach((e) => e.destroy()); S.eds = []; S.lastHtml = '';
    clearTop(top); rest.innerHTML = `${gateHtml()}<div id="dlg" style="display:contents"></div>`; paintDlg();
    $('#gatego')?.addEventListener('click', () => { tokenDialog(); setTimeout(() => $('#oauthgo')?.click(), 50); });
    $('#gatetok')?.addEventListener('click', tokenDialog);
    return;
  }
  paintTop(top);
  const side = $('#side'), live = liveView();
  const html = `<div class="shell ${S.nav ? 'nav-open' : ''} ${S.hide.nav ? 'nav-hidden' : ''}" style="--sbw:${S.sbw}px"><div id="side" style="display:contents"></div><div class="sb-grip" id="sbgrip" title="Drag to resize · double-click to reset"></div><div class="scrim" id="scrim"></div><div class="main"><div id="page" style="display:contents">${live || S.mainStub ? '' : page()}</div></div></div><div id="dlg" style="display:contents"></div><div id="notehost" style="display:contents"></div>`;
  const scroll = $('.main')?.scrollTop || 0;
  const viewKey = () => `${S.bundle?.pull?.id ?? ''}|${S.tab}|${$('#page > *')?.className ?? ''}`, before = viewKey();
  const same = () => viewKey() === before;
  // Anchor on the first element with an id that is on screen, so a redraw keeps *it* where it was
  // (heights above the viewport can change between renders, which made the view creep upward).
  let anchor = null;
  { const mn = $('.main')!; if (mn) { const top = mn.getBoundingClientRect().top; for (const el of mn.querySelectorAll('[id]')) { const r = el.getBoundingClientRect(); if (r.bottom > top + 4) { anchor = { id: el.id, off: r.top - top }; break; } } } }
  const inner = true ? [...qa('.pane-body, .cm-list, .sb-list')].map((e) => [e.parentElement!.className + e.className, e.scrollTop]) : [];
  const key = html + (live ? '\0live' : '');
  if (key === S.lastHtml && rest.firstElementChild && !S.fadeMain) { if (side) paintSide(side); const pg = $('#page'); if (live && pg) paintPage(pg, live); paintDlg(); paintNotes(); return; }
  (S.eds || []).forEach((e) => e.destroy()); S.eds = [];
  rest.innerHTML = html; S.lastHtml = key; paintSide($('#side')!); if (live) paintPage($('#page')!, live); paintDlg(); paintNotes();
  qa('.sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement!.className + e.className); if (m) e.scrollTop = m[1] as number; });
  if (S.keepScroll || same()) { $('.main')!.scrollTop = scroll; if (anchor) { const el = document.getElementById(anchor.id), mn = $('.main'); if (el) mn!.scrollTop += el.getBoundingClientRect().top - mn!.getBoundingClientRect().top - anchor.off; } qa('.pane-body, .cm-list, .sb-list').forEach((e) => { const m = inner.find(([k]) => k === e.parentElement!.className + e.className); if (m) e.scrollTop = m[1] as number; }); }
  (S.ios || []).forEach((o) => o.disconnect()); S.ios = []; bindSticky();
  if (S.fadeMain) { S.fadeMain = false; $('.main')?.classList.add('tab-in'); }
  if (S.busy && S.busySel) setBusy($!(S.busySel), true);
  syncUnread();
  // A re-render (fresh data arriving) must not wipe the highlight of the comment we just jumped to.
  if (S.flashId && Date.now() < S.flashUntil!) document.getElementById('c-' + S.flashId)?.classList.add('flash'); else S.flashId = '';
  document.title = S.bundle ? `${S.bundle.pull.title} · ${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : 'GitHub PR View';
}
