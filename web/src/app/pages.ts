import type { BranchInfo, Bundle, Check, Inbox, InboxItem, InboxState, NewPr, NpListKey, Pull, Template } from '../types';
import { draftBox, rerender, saveDrafts, setBusy } from './actions';
import { bind, bindTokenDialog, tokDlgHtml, tokenDialog } from './bind';
import { homePage } from './bindwrite';
import { prHeader } from './comments';
import { $, S, applyMode, esc, icon, offlineBar, syncUnread, tauri, when, qa } from './core';
import { notePanel, pushBanners, qc, seen } from './data';
import { commitsView, filesView, sidebar, splitView } from './mergebox';
import { loadRepos } from './nav';
import { crumbs, prList, repoHeader } from './prlist';
import { sideRecent, tabStrip, toolbar } from './tabs';
import { attention, checksView, timeline } from './timeline';

export function landing() {
  return `<div class="landing">${pushBanners() ? `<div class="push-wrap">${pushBanners()}</div>` : ''}${icon('git-pull-request', 24).replace('width="24" height="24"', 'width="40" height="40"')}<h1>Open a pull request</h1><p>Type <code>owner/repo#123</code> or paste a pull request URL in the bar above.<br>Shortcuts: ⌘L address bar · ⌘R reload · ⌘[ ⌘] history</p>${S.error ? `<div class="err">${esc(S.error)}</div>` : ''}</div>`;
}


export const saveNotes = () => localStorage.setItem('notes', JSON.stringify(S.notes));

export function notesPage() {
  const f = S.nf || 'all', unread = S.notes.filter((n) => !n.read).length;
  const list = S.notes.filter((n) => f === 'all' || (f === 'unread' ? !n.read : n.read));
  const rows = list.map((n) => `<div class="np-row ${n.read ? '' : 'new'}"><button class="np-dot" data-nread="${n.id}" title="${n.read ? 'Mark as unread' : 'Mark as read'}"></button>
    <a class="np-main" data-open="${esc(n.ref)}" data-target="${esc(n.target || '')}" data-note="${n.id}"><b>${esc(n.title)}</b><span>${esc(n.text)}</span><i>${esc(n.ref)} · ${when(n.at).replace(/<\/?span[^>]*>/g, '')}</i></a>
    <button class="np-act" data-nread="${n.id}">${n.read ? 'Mark unread' : 'Mark read'}</button><button class="np-act del" data-ndel="${n.id}" title="Delete">${icon('x')}</button></div>`).join('')
    || `<div class="note-empty np-empty">${f === 'unread' ? 'You are all caught up.' : f === 'read' ? 'Nothing read yet.' : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}</div>`;
  return `<div class="notes-page"><div class="np-head"><h1>${icon('bell')} Notifications</h1><div class="np-tools"><button class="btn small" id="npcheck">Check now</button><button class="btn small" id="npreadall" ${unread ? '' : 'disabled'}>Mark all as read</button><button class="btn small ghost" id="npclear" ${S.notes.length ? '' : 'disabled'}>Clear all</button></div></div>
  <div class="np-tabs">${[['all', 'All', S.notes.length], ['unread', 'Unread', unread], ['read', 'Read', S.notes.length - unread]].map(([k, l, c]) => `<button class="${f === k ? 'sel' : ''}" data-nf="${k}">${l}<span>${c}</span></button>`).join('')}</div>
  <div class="np-list">${rows}</div></div>`;
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
  const n = S.np, repos = (S.repos || []).filter((r) => !r.archived), br = n!.branches[n!.repo];
  const opts = (list: string[], cur: string) => list.map((x) => `<option value="${esc(x)}" ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('');
  const repoSel = repos.length ? `<button type="button" class="sel bp-btn" id="nprepo"><span>${esc(n!.repo || 'Choose a repository')}</span>${icon('chevron-down', 14)}</button>` : `<input class="input" id="nprepoin" placeholder="owner/repo" value="${esc(n!.repo)}">`;
  const same = n!.base && n!.base === n!.head;
  const cmp = n!.cmp === 'loading' ? '<span class="np-note">Comparing…</span>' : !n!.cmp ? '' : typeof n!.cmp === 'string' ? `<span class="np-note err">${esc(n!.cmp)}</span>`
    : n!.cmp.ahead_by ? `<span class="np-note ok">${icon('git-commit')} ${n!.cmp.ahead_by} commit${n!.cmp.ahead_by === 1 ? '' : 's'} · ${n!.cmp.files} file${n!.cmp.files === 1 ? '' : 's'} changed${n!.cmp.behind_by ? ` · ${n!.cmp.behind_by} behind ${esc(n!.base)}` : ''}</span>` : '<span class="np-note err">These branches are identical — there is nothing to compare.</span>';
  const ready = n!.title.trim() && n!.repo && n!.base && n!.head && !same && n!.cmp && typeof n!.cmp === 'object' && n!.cmp.ahead_by > 0;
  return `<div class="notes-page np-new"><div class="np-head"><h1>${icon('git-pull-request')} New pull request</h1></div>
  <div class="np-card"><div class="np-main-col">
    <div class="np-box"><label class="np-l">Repository</label>${repoSel}
    <div class="np-branches"><div><label class="np-l">Base <i>merge into</i></label><button type="button" class="sel bp-btn" id="npbase" data-bp="base" ${br ? '' : 'disabled'}><span>${br ? esc(n!.base || 'Choose a branch') : 'Loading…'}</span>${icon('chevron-down', 14)}</button></div>
      <button class="tb-btn" id="npswap" title="Swap base and head">⇄</button>
      <div><label class="np-l">Head <i>changes from</i></label><button type="button" class="sel bp-btn" id="nphead" data-bp="head" ${br ? '' : 'disabled'}><span>${br ? esc(n!.head || 'Choose a branch') : 'Loading…'}</span>${icon('chevron-down', 14)}</button></div></div>
    <div class="np-cmp">${same ? '<span class="np-note err">Base and head are the same branch.</span>' : cmp}</div></div>
    <div class="np-box"><label class="np-l">Title</label><input class="input" id="nptitle" placeholder="Title" value="${esc(n!.title)}"></div>
    <div class="np-box"><label class="np-l">Description</label>${(() => { const t = n!.tpl[`${n!.repo}|${n!.base}`]; return t && t.length > 1 ? `<select class="sel np-tpl" id="nptpl"><option value="">No template</option>${t.map((x, i) => `<option value="${i}" ${x.body === n!.tplText ? 'selected' : ''}>Template: ${esc(x.name)}</option>`).join('')}</select>` : ''; })()}${draftBox('newpr', 'Describe your changes', 8)}</div>
    <div class="np-box"><label class="np-check"><input type="checkbox" id="npdraft" ${n!.draft ? 'checked' : ''}> Create as draft <span>(not ready for review yet)</span></label>
    ${n!.err ? `<div class="act-err">${esc(n!.err)}</div>` : ''}
    <div class="np-btns"><button class="btn" id="npcancel">Cancel</button><button class="btn primary" id="npcreate" ${ready ? '' : 'disabled'}>${n!.draft ? 'Create draft pull request' : 'Create pull request'}</button></div></div>
  </div><div class="np-side-col">${npMeta(n!)}</div></div></div>`;
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
  const chips = (k: string, label: string) => `<span class="np-chip" data-npdel="${k}" data-v="${esc(label)}" title="Remove">${esc(label)} ×</span>`;
  const add = (k: NpListKey, title: string, list: string[]) => { const free = list.filter((x) => !n[k].includes(x)); return free.length ? `<select class="sel np-add" data-npadd="${k}"><option value="">${title}</option>${free.map((x) => `<option>${esc(x)}</option>`).join('')}</select>` : ''; };
  const row = (k: NpListKey, name: string, list: string[]) => `<div class="np-meta"><label class="np-l">${name}</label><div class="np-chips">${n[k].map((x: string) => chips(k, x)).join('')}${add(k, `Add ${name.toLowerCase()}…`, list)}</div></div>`;
  return `<div class="np-box np-metas" id="npmeta">${row('reviewers', 'Reviewers', ppl.filter((x) => x !== me))}${row('assignees', 'Assignees', ppl)}${row('labels', 'Labels', m.labels.map((x) => x.name))}
    <div class="np-meta"><label class="np-l">Milestone</label><select class="sel" id="npmile"><option value="">None</option>${m.milestones.map((x) => `<option value="${x.number}" ${String(n.milestone) === String(x.number) ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select></div>
    <div class="np-meta"><label class="np-l">Linked issues <i>closed when this merges</i></label><input class="input" id="npissues" placeholder="e.g. 12, 15" value="${esc(n.issues)}"></div></div>`;
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
  const row = (p: InboxItem) => { const ref = `${p.repo}#${p.number}`, was = seen[ref]?.at, fresh = was && p.updated_at > was;
    return `<a class="ib-row" data-open="${esc(ref)}"><img src="${esc(p.avatar)}" alt=""><span class="ib-t"><b>${esc(p.title)}</b><i>${esc(ref)} · ${esc(p.user)} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}${p.draft ? ' · Draft' : ''}</i></span>${fresh ? '<span class="ib-new">New activity</span>' : ''}${p.comments ? `<span class="ib-c">${icon('comment')} ${p.comments}</span>` : ''}</a>`; };
  const sec = (title: string, sub: string, list: InboxItem[]) => `<section class="ib-sec"><h2>${title}<span>${list.length}</span></h2><p>${sub}</p>${list.length ? list.map(row).join('') : '<div class="ib-none">Nothing here. Nice.</div>'}</section>`;
  const body = I.err ? `<div class="diff-empty err">${esc(I.err)}</div>` : !d ? '<div class="skel"><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>'
    : sec('Review requested', 'Waiting on you', d.requested) + sec('Ready to merge', 'Your approved pull requests', d.ready) + sec('Your pull requests', 'Open PRs you opened', d.mine);
  return `<div class="notes-page"><div class="np-head"><h1>${icon('checklist')} Inbox</h1><div class="np-tools"><button class="btn small" id="ibrefresh" ${I.loading ? 'disabled' : ''}>${I.loading ? 'Loading…' : 'Refresh'}</button></div></div>${body}</div>`;
}


export function page() {
  const b = S.bundle;
  if (S.loading) return `<div class="skel" aria-busy="true"><div class="sk sk-crumb"></div><div class="sk sk-title"></div><div class="sk sk-pill"></div><div class="sk sk-line w60"></div><div class="sk-tabs"><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>${[0, 1, 2].map((i) => `<div class="sk-row" style="--i:${i}"><div class="sk sk-av"></div><div class="sk-card"><div class="sk sk-line w40"></div><div class="sk sk-line"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div></div>`).join('')}</div>`;
  if (S.view === 'newpr') return crumbs(S.np!?.repo, [{ t: 'New pull request' }]) + newPrPage();
  if (S.view === 'inbox') return crumbs('', [{ t: 'Inbox' }]) + inboxPage();
  if (S.view === 'notes') return crumbs('', [{ t: 'Notifications' }]) + notesPage();
  if (S.view === 'repo') return crumbs(S.repo!, [{ t: 'Pull requests' }]) + prList();
  if (S.view === 'home' || !b) return crumbs('', S.homeOwner ? [{ t: S.homeOwner }] : []) + homePage();
  if (S.split && S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline') return `<div class="pr-page is-split">${repoHeader(b.pull)}${prHeader(b)}${splitView(b)}</div>`;
  const body = S.tab === 'files' ? filesView(b) : S.tab === 'commits' ? commitsView(b) : S.tab === 'checks' ? checksView(b) : S.tab === 'timeline' ? `<div class="rail">${timeline(b)}</div>` : attention(b) + timeline(b);
  const side = S.tab !== 'conversation' ? '' : S.hide.side ? `<button class="pane-rail side-rail" data-show="side" title="Show details">${icon('columns')}<span>Details</span></button>` : `<aside class="pr-side"><div class="side-top"><span>Details</span><button class="fold-btn" data-hide="side" title="Hide this panel">${icon('x')}</button></div>${sidebar(b)}</aside>`;
  return `<div class="pr-page">${repoHeader(b.pull)}${prHeader(b)}<div class="pr-layout"><main class="pr-main">${body}</main>${side}</div></div>`;
}


// Signing in is required: anonymous GitHub access is capped at 60 requests an hour and is too slow to use.
export const needSignIn = () => (tauri && S.authChecked && !S.hasToken) || new URLSearchParams(location.search).get('gate') === '1';

export function gateHtml() {
  return `<div class="gate"><div class="gate-card"><img src="logo.png" alt="" width="72" height="72"><h1>Sign in to Pullscope</h1>
  <p class="gate-err">${icon('alert')} No GitHub sign-in or token was found.</p>
  <p>Pullscope needs your GitHub account to load pull requests. Without one GitHub allows only 60 requests an hour, so the app would be slow and keep failing.</p>
  ${S.gateErr ? `<p class="gate-err">${esc(S.gateErr)}</p>` : ''}
  <div class="btns" style="justify-content:center"><button class="btn primary" id="gatego">Sign in with GitHub</button><button class="btn" id="gatetok">Use a token instead</button></div>
  <small>Tip: running <code>gh auth login</code> in a terminal also works.</small></div></div>`;
}

export function render() {
  applyMode();
  if (needSignIn()) {
    (S.eds || []).forEach((e) => e.destroy()); S.eds = []; S.lastHtml = '';
    $('#app')!.innerHTML = `${gateHtml()}${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}`;
    $('#gatego')?.addEventListener('click', () => { tokenDialog(); setTimeout(() => $('#oauthgo')?.click(), 50); });
    $('#gatetok')?.addEventListener('click', tokenDialog);
    bindTokenDialog(); return;
  }
  const html = `${S.refreshing ? '<div class="refreshing-bar"></div>' : ''}${toolbar()}${offlineBar()}${tabStrip()}<div class="shell ${S.nav ? 'nav-open' : ''} ${S.hide.nav ? 'nav-hidden' : ''}" style="--sbw:${S.sbw}px">${sideRecent()}<div class="sb-grip" id="sbgrip" title="Drag to resize · double-click to reset"></div><div class="scrim" id="scrim"></div><div class="main">${S.mainStub ? '' : page()}</div></div>${S.dialog === '__TOKDLG__' ? tokDlgHtml() : S.dialog || ''}${notePanel()}`;
  const scroll = $('.main')?.scrollTop || 0;
  const viewKey = () => `${S.bundle?.pull?.id ?? ''}|${S.tab}|${$('.main > *')?.className ?? ''}`, before = viewKey();
  const same = () => viewKey() === before;
  // Anchor on the first element with an id that is on screen, so a redraw keeps *it* where it was
  // (heights above the viewport can change between renders, which made the view creep upward).
  let anchor = null;
  { const mn = $('.main')!; if (mn) { const top = mn.getBoundingClientRect().top; for (const el of mn.querySelectorAll('[id]')) { const r = el.getBoundingClientRect(); if (r.bottom > top + 4) { anchor = { id: el.id, off: r.top - top }; break; } } } }
  const inner = true ? [...qa('.pane-body, .cm-list, .sb-list')].map((e) => [e.parentElement!.className + e.className, e.scrollTop]) : [];
  if (html === S.lastHtml && $('#app')!.firstElementChild && !S.fadeMain) return;
  (S.eds || []).forEach((e) => e.destroy()); S.eds = [];
  $('#app')!.innerHTML = html; S.lastHtml = html;
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
