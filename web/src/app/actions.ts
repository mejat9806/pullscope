import type { ComposerProps, MergeActProps } from '../components/Actions';
import type { ActArgs, Bundle, CommentLike, ReviewComment, TimelineEvent } from '../types';
import { openExternal } from './addressbar';
import { cmPopHtml, composerHtml, confirmDlgHtml, deleteCommentDialogHtml, draftBoxHtml, editCommentDialogHtml, editPrDialogHtml, errLineHtml, hideCommentDialogHtml, mergeActHtml, reactPopHtml, reviewDialogHtml } from '../components/Actions';
import { $, REACTS, S, esc, icon, load, tauri, qa, scoped } from './core';
import { qc } from './data';
import { pendKey, pendList, savePending, sugOf } from './diff';
import { confetti } from './fun';
import { setComposer } from './keyboard';
import { openPr } from './nav';
import { render, saveNotes } from './pages';
import { checkState } from './timeline';

// ---- Write actions (comment, reply, review, merge, close/reopen) ----
export const peopleList = () => { const b = S.bundle; if (!b) return []; const s = new Set<string>(); [b.pull.user, ...b.timeline.map((e) => e.user || e.actor || e.author), ...b.review_comments.map((c) => c.user)].forEach((u) => u?.login && s.add(u.login)); return [...s]; };

export const drafts = load<Record<string, Record<string, string>>>('drafts', {});

export function saveDrafts() { if (!S.draftRef) return; const d = Object.fromEntries(Object.entries(S.draft).filter(([, v]) => v && v.trim())); if (Object.keys(d).length) drafts[S.draftRef] = d; else delete drafts[S.draftRef]; try { localStorage.setItem('drafts', JSON.stringify(drafts)); } catch { /* storage full */ } }

export const prRef = () => ({ repo: S.bundle!.pull.base.repo.full_name, number: S.bundle!.pull.number });

export const draftBox = (key: string, ph: string, rows = 4) => draftBoxHtml(key, ph, rows);

export const errLine = (k: string) => (S.actErr && S.actErr.k === k ? errLineHtml(S.actErr.m) : '');


export const errMsg = (k: string) => (S.actErr && S.actErr.k === k ? S.actErr.m : '');
export function composerProps(b: Bundle): ComposerProps {
  const p = b.pull, closed = p.state === 'closed', busy = S.busy === 'comment';
  const open = busy || S.cOpen === true, dr = (S.draft.comment || '').trim();
  // Docked: it sticks to the bottom of the view, so you can write from anywhere in the thread; the bar expands in place.
  return { open, draft: dr ? dr.replace(/\s+/g, ' ').slice(0, 60) : '', err: errMsg('comment'), merged: !!p.merged, closed, busy };
}
export const composer = (b: Bundle) => composerHtml(composerProps(b));
export function mergeActProps(b: Bundle): MergeActProps | null {
  const p = b.pull; if (p.merged || p.state === 'closed') return null;
  const busy = S.busy === 'merge', am = p.auto_merge, blocked = p.mergeable_state !== 'clean' && p.mergeable_state !== 'unstable';
  const cur = am ? (({ MERGE: 'merge', SQUASH: 'squash', REBASE: 'rebase' } as Record<string, string>)[am.merge_method!] || 'merge') : 'merge';
  return { draft: !!p.draft, err: errMsg('merge'), method: cur, busy, auto: am ? { method: am.merge_method!.toLowerCase(), busy: S.busy === 'disable_automerge' } : null, canAuto: blocked, autoBusy: S.busy === 'automerge', errAuto: errMsg('automerge') };
}
export const mergeActions = (b: Bundle) => { const m = mergeActProps(b); return m ? mergeActHtml(m) : ''; };


export function reviewDialog() {
  S.dialog = reviewDialogHtml(draftBox('review', pendList().length ? `Leave a review comment (${pendList().length} line comment${pendList().length === 1 ? '' : 's'} will be included)` : 'Leave a review comment (required unless approving)', 5));
  render();
  $('#revcancel')!.onclick = () => { S.dialog = ''; render(); };
  $('#revsubmit')!.onclick = async () => {
    const ev = $<HTMLInputElement>('input[name=rev]:checked')!.value;
    const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
    const r = await act('review', { body: S.draft.review || '', event: ev, extra: lines }, 'review', true);
    if (r === undefined) return;
    delete S.draft.review; delete S.pending![pendKey()]; savePending(); S.dialog = ''; await refreshPr(); 
  };
}


export function editPrDialog() {
  const p = S.bundle!.pull; S.draft.prbody = p.body || '';
  S.dialog = editPrDialogHtml(p.title, draftBox('prbody', 'Describe your changes', 8), errLine('editpr'));
  render();
  $('#epcancel')!.onclick = () => { delete S.draft.prbody; S.dialog = ''; render(); };
  $('#epsave')!.onclick = async () => {
    const title = $<HTMLInputElement>('#eptitle')!.value;
    const r = await act('edit', { body: S.draft.prbody ?? '', extra: { title } }, 'editpr', true);
    if (r === undefined) return;
    delete S.draft.prbody; S.dialog = ''; await refreshPr();
  };
}


// Write / Preview tabs on a rich editor; the preview is rendered by GitHub so it matches what gets posted.
export function addPreview(host: HTMLElement, key: string) {
  const tabs = document.createElement('div'); tabs.className = 'tt-tabs';
  tabs.innerHTML = '<button class="on" data-pv="write">Write</button><button data-pv="preview">Preview</button>';
  const pv = document.createElement('div'); pv.className = 'tt-preview markdown-body'; pv.hidden = true;
  host.prepend(tabs); host.append(pv);
  const show = async (mode: string) => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.pv === mode));
    const prev = mode === 'preview';
    host.querySelectorAll<HTMLElement>('.tt-bar, .tt-body').forEach((el) => { el.hidden = prev; });
    pv.hidden = !prev; host.classList.toggle('previewing', prev);
    if (!prev) { $('.tt-content', host)?.focus(); return; }
    const md = (S.draft[key!] || '').trim();
    if (!md) { pv.innerHTML = '<span class="empty">Nothing to preview</span>'; return; }
    pv.innerHTML = '<span class="empty">Loading preview…</span>';
    try {
      if (!tauri) throw new Error('offline');
      const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
      const html = await tauri!.invoke('render_markdown', { text: md, repo });
      if (!pv.hidden) pv.innerHTML = html;
    } catch (e) { if (!pv.hidden) pv.innerHTML = `<pre class="pv-raw"></pre><div class="act-err">Couldn't render the preview (${esc(String(e).replace(/^Error: /, ''))}). Showing the raw Markdown.</div>`, $('.pv-raw', pv)!.textContent = md; }
  };
  tabs.addEventListener('click', (e) => { const m = (e.target as HTMLElement).closest<HTMLElement>('[data-pv]')?.dataset.pv; if (m) show(m); });
}


export function confirmDlg(title: string, text: string, label: string, danger: boolean, fn: () => void | Promise<void>) {
  S.dialog = confirmDlgHtml(title, text, label, danger);
  render();
  $('#cfcancel')!.onclick = () => { S.dialog = ''; render(); };
  $('#cfok')!.onclick = async () => { S.dialog = ''; render(); await fn(); };
}


// Runs a write action. Returns the API response, or undefined after showing an error under `key`.
// Any write action puts a spinner in the button that started it and disables it until the request settles.
document.addEventListener('click', (e) => { S.lastBtn = (e.target as HTMLElement).closest?.('button') || null; }, true);

export const btnSel = (b: HTMLElement) => { if (b.id) return '#' + b.id; const a = [...b.attributes].find((x) => x.name.startsWith('data-')); return a ? `button[${a.name}="${CSS.escape(a.value)}"]` : null; };

export const setBusy = (b: (HTMLElement & { disabled?: boolean }) | null, on: boolean) => { if (!b) return; b.classList.toggle('is-busy', on); b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); };

// Add a reaction, or remove it when you already left it (clicking the same emoji again), like github.com.
S.mine = {};
 // `${kind}:${id}` -> Promise of the Set of reactions you have left there
export const getMine = (kind: string, rid: number | string) => (S.mine![`${kind}:${rid}`] ||= tauri ? tauri!.invoke('my_reactions', { ...prRef(), kind, id: +rid }).then((l) => new Set<string>(l)).catch(() => { delete S.mine![`${kind}:${rid}`]; return new Set<string>(); }) : Promise.resolve(new Set()));

export async function toggleReact(kind: string, rid: number | string, c: string) {
  const mine = (await getMine(kind, rid)).has(c);
  const b = S.bundle, tgt = kind === 'pr' ? b!.pull : [...b!.timeline, ...b!.review_comments].find((x) => String(x.id) === String(rid));
  const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null, base = prev ? (prev as Record<string, number>)[c] || 0 : 0;
  const bump = (n: number) => { if (tgt) tgt.reactions = { ...(tgt.reactions || {}), [c]: Math.max(0, base + n) }; };
  bump(mine ? -1 : 1); S.refreshing = true; rerender();
  const r = await act('react', { kind, id: +rid, content: c }, 'react');
  if (r === undefined) { if (tgt && prev) tgt.reactions = prev; S.refreshing = false; rerender(); return; }
  const set = await getMine(kind, rid); (r as { added?: boolean }).added === false ? set.delete(c) : set.add(c);
  await refreshPr(kind === 'pr' ? '' : rid);
}

export type ActResult = ReviewComment & { added?: boolean };
export async function act(action: string, args: ActArgs, key: string, inDialog = false) {
  const btn = S.lastBtn && document.contains(S.lastBtn) ? S.lastBtn : null; S.busySel = btn ? btnSel(btn) : null; setBusy(btn!, true);
  try { return await act2(action, args, key, inDialog); } finally { S.busySel = null; setBusy(btn!, false); }
}

export async function act2(action: string, args: ActArgs, key: string, inDialog = false): Promise<ActResult | undefined> {
  S.actErr = null;
  if (!tauri) { S.actErr = { k: key, m: 'Writing needs the desktop app.' }; if (inDialog) $('#reverr')!.innerHTML = `<div class="act-err">${S.actErr.m}</div>`; else render(); return undefined; }
  S.busy = key; if (!inDialog) render();
  try {
    const r = action === 'react' ? await tauri!.invoke('toggle_reaction', { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri!.invoke('pr_action', { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
    S.busy = ''; if (action === 'merge' || (action === 'review' && args.event === 'APPROVE')) confetti(); return (r ?? {}) as ActResult;
  } catch (e) {
    S.busy = ''; S.actErr = { k: key, m: String(e).replace(/^Error: /, '') };
    if (inDialog) { const el = $('#reverr')!; if (el) el.innerHTML = `<div class="act-err">${esc(S.actErr.m)}</div>`; } else render();
    return undefined;
  }
}

export const refreshPr = (focus: string | number = '') => { qc.invalidate(`${prRef().repo}#${prRef().number}`); saveDrafts(); S.focus = focus ? String(focus) : ''; return openPr(`${prRef().repo}#${prRef().number}`, { nav: true, keepTab: true }); };


export function editCommentDialog(c: ReviewComment | TimelineEvent, kind: string) {
  S.draft.editc = c.body || '';
  S.dialog = editCommentDialogHtml(draftBox('editc', 'Edit your comment', 6), errLine('editc'));
  render();
  $('#eccancel')!.onclick = () => { delete S.draft.editc; S.dialog = ''; render(); };
  $('#ecsave')!.onclick = async () => {
    const r = await act('edit_comment', { id: c.id, kind, body: S.draft.editc ?? '' }, 'editc', true);
    if (r === undefined) return;
    delete S.draft.editc; S.dialog = ''; await refreshPr(c.id);
  };
}

export function deleteCommentDialog(c: { id?: number }, kind: string) {
  S.dialog = deleteCommentDialogHtml(errLine('delc'));
  render();
  $('#dccancel')!.onclick = () => { S.dialog = ''; render(); };
  $('#dcdo')!.onclick = async () => {
    const r = await act('delete_comment', { id: c.id, kind }, 'delc', true);
    if (r === undefined) return;
    S.dialog = ''; await refreshPr();
  };
}

export function hideCommentDialog(c: { node_id?: string; id?: number | string }) {
  const reasons = [['SPAM', 'Spam'], ['ABUSE', 'Abuse'], ['OFF_TOPIC', 'Off-topic'], ['OUTDATED', 'Outdated'], ['DUPLICATE', 'Duplicate'], ['RESOLVED', 'Resolved']];
  S.dialog = hideCommentDialogHtml(reasons as [string, string][], errLine('hidec'));
  render();
  $('#hccancel')!.onclick = () => { S.dialog = ''; render(); };
  $('#hcdo')!.onclick = async () => {
    const r = await act('minimize', { body: c.node_id || '', content: $<HTMLSelectElement>('#hcreason')!.value }, 'hidec', true);
    if (r === undefined) return;
    S.fold['c:' + c.id] = true; localStorage.setItem('fold', JSON.stringify(S.fold));
    S.dialog = ''; await refreshPr();
  };
}

export function cmAction(id: number, root: HTMLElement, how: string) {
  const b = S.bundle, c = [...b!.timeline, ...b!.review_comments].find((x) => String(x.id) === String(id)) || (String(b!.pull.id) === String(id) ? b!.pull : null); if (!c) return;
  if (how === 'link') return navigator.clipboard?.writeText(c.html_url || '');
  if (how === 'md') return navigator.clipboard?.writeText(c.body || '');
  const kind = (c as unknown) === b!.pull ? 'pr' : (b!.review_comments as unknown[]).includes(c) ? 'review_comment' : 'issue_comment';
  if (how === 'issue') { const r = prRef().repo; return openExternal(`https://github.com/${r}/issues/new?body=${encodeURIComponent(`Reference: ${c.html_url || ''}\n\n`)}`); }
  if (how === 'edit') return kind === 'pr' ? editPrDialog() : editCommentDialog(c as ReviewComment, kind);
  if (how === 'hide') return hideCommentDialog(c);
  if (how === 'del') return deleteCommentDialog(c, kind);
  const key = root ? 'reply-' + root : 'comment', q = (c.body || '').split('\n').map((l) => '> ' + l).join('\n');
  S.draft[key] = (S.draft[key] ? S.draft[key] + '\n\n' : '') + `@${((c as CommentLike).user || (c as CommentLike).actor || {} as { login?: string }).login || ''}\n\n${q}\n\n`;
  saveDrafts(); S.eds = []; S.keepScroll = true; render(); S.keepScroll = false;
  setTimeout(() => $(`[data-draft="${key}"]`)?.scrollIntoView({ block: 'center' }), 50);
}

// Show a just-posted comment from the API reply instead of re-fetching the whole PR.
export function addLocal(kind: string, r: ReviewComment | TimelineEvent, rootId?: number) {
  const b = S.bundle; if (!b || !r || !r.id || !r.body_html) return false;
  if (kind === 'commented') b.timeline.push({ ...r, event: 'commented', actor: r.user });
  else { const root = b.review_comments.find((c) => c.id === rootId); if (!root) return false; b.review_comments.push({ ...r, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position } as ReviewComment); }
  qc.set(`${prRef().repo}#${prRef().number}`, b); qc.invalidate(`${prRef().repo}#${prRef().number}`); qc.m.get(`${prRef().repo}#${prRef().number}`)!.at = Date.now() - 20000;
  S.focus = ''; S.keepScroll = true; render(); S.keepScroll = false;
  const el = document.getElementById('c-' + r.id); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash', 'pop-in'); }
  return true;
}

// Opening/closing the drawer only toggles a class — no page redraw, so nothing underneath moves.
export function setBell(open: boolean) {
  S.bell = open;
  $('.note-panel')?.classList.toggle('open', open);
  if (!open && S.notes.some((n) => !n.read)) {
    S.notes.forEach((n) => (n.read = true)); saveNotes();
    qa('.note-panel .note.new').forEach((el) => el.classList.remove('new'));
    $('#bell .dot')?.remove();
  }
}

// Click outside (or Esc) closes the notifications drawer; opening it marks everything read, as closing via the bell does.
document.addEventListener('mousedown', (e) => {
  if (!S.bell || (e.target as HTMLElement).closest<HTMLElement>('.note-panel, #bell')) return;
  setBell(false);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.bell) setBell(false); });

export async function rerequestReview(e: Event, login: string) {
  const b = e.currentTarget as HTMLElement & { disabled?: boolean };
  e.stopPropagation(); b.disabled = true; b.classList.add('spin');
  const r = await act('rerequest', { body: login }, 'rerequest'); if (r === undefined) { b.disabled = false; b.classList.remove('spin'); alert(S.actErr?.m || 'Could not re-request review.'); return; }
  await refreshPr();
}
// Merge box, merge actions and composer handlers: shared by the live PR page and by the imperatively bound copies (split view).
export function toggleComposer() { setComposer(document.getElementById('composer')!.classList.contains('collapsed'), true); }
export function cbarKey(e: KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }
export async function sendComment() {
  const r = await act('comment', { body: S.draft.comment || '' }, 'comment'); if (r === undefined) return;
  delete S.draft.comment; S.cOpen = false; if (!addLocal('commented', r)) await refreshPr(r.id);
}
export function toggleClosed() {
  const closed = S.bundle!.pull.state === 'closed';
  confirmDlg(closed ? 'Reopen this pull request?' : 'Close this pull request?', closed ? 'It will be open for review again.' : 'It will be closed without merging. You can reopen it later.', closed ? 'Reopen' : 'Close pull request', !closed, async () => { const r = await act(closed ? 'reopen' : 'close', {}, 'close'); if (r !== undefined) await refreshPr(); });
}
export function toggleMb(e: Event, k: string) { if ((e.target as HTMLElement).closest<HTMLElement>('#rerunck')) return; S.mbOpen = S.mbOpen || new Set(); S.mbOpen.has(k) ? S.mbOpen.delete(k) : S.mbOpen.add(k); rerender(); }
export async function rerunChecks(e: Event) { e.stopPropagation(); const urls = (S.bundle!.checks || []).filter((c) => checkState(c) === 'fail' && c.url).map((c) => c.url); setBusy(e.currentTarget as HTMLElement, true); const r = await act('rerun', { extra: urls }, 'rerun'); if (r !== undefined) { S.actErr = null; await refreshPr(); } else setBusy(e.currentTarget as HTMLElement, false); }
export async function updateBranch() { const r = await act('update_branch', {}, 'update_branch'); if (r !== undefined) await refreshPr(); }
export async function markReady() { const r = await act('ready', {}, 'ready'); if (r !== undefined) await refreshPr(); }
export function toDraft() { confirmDlg('Convert to draft?', 'Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.', 'Convert to draft', false, async () => { const r = await act('draft', {}, 'merge'); if (r !== undefined) await refreshPr(); }); }
export async function enableAuto() { const r = await act('automerge', { method: $<HTMLSelectElement>('#mmethod')!.value }, 'automerge'); if (r !== undefined) await refreshPr(); }
export async function disableAuto() { const r = await act('disable_automerge', {}, 'automerge'); if (r !== undefined) await refreshPr(); }
export function doMerge() {
  const m = $<HTMLSelectElement>('#mmethod')!.value, p = S.bundle!.pull, names: Record<string, string> = { merge: 'merge commit', squash: 'squash and merge', rebase: 'rebase and merge' };
  confirmDlg('Merge this pull request?', `${p.head.label} will be merged into ${p.base.label} using ${names[m]}. This changes the repository and cannot be undone from here.`, 'Merge', false, async () => { const r = await act('merge', { method: m }, 'merge'); if (r !== undefined) await refreshPr(); });
}

export const rerender = () => { S.keepScroll = true; render(); S.keepScroll = false; };

const mounted = new WeakSet<Element>();

// Editors are mounted once per host, so a live page can call this after every repaint.
export function mountEditors() {
  qa('.tt[data-draft]').forEach((host) => {
    if (mounted.has(host)) return; mounted.add(host);
    const key = host.dataset.draft;
    if (!window.createEditor) { host.innerHTML = '<div class="act-err">Editor failed to load.</div>'; return; }
    const send = () => (key === 'comment' ? $('#docomment') : key === 'lc' ? $('#lcadd') : key === 'newpr' ? $('#npcreate') : key!.startsWith('reply-') ? $(`[data-sendreply="${key!.slice(6)}"]`) : $('#revsubmit'))?.click();
    const mount = () => { (S.eds ||= []).push(window.createEditor!(host, { value: S.draft[key!] || '', placeholder: host.dataset.ph, people: peopleList(), onChange: (md) => { S.draft[key!] = md; saveDrafts(); }, onSubmit: send })); addPreview(host, key!); };
    // Editors are heavy: build each one only when its box is near the viewport.
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); if (host.isConnected) mount(); } }, { rootMargin: '300px' });
    io.observe(host);
  });
}

export function bindWrite(scope?: HTMLElement) {
  const { qa, $ } = scoped(scope);
  qa('.cm-btn').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation(); $('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop cm-pop';
    const bb = S.bundle, cc = String(bb!.pull.id) === String(btn.dataset.cm) ? bb!.pull : [...bb!.timeline, ...bb!.review_comments].find((x) => String(x.id) === String(btn.dataset.cm));
    const isPr = cc === bb!.pull, own = !!S.me && ((cc as CommentLike | null)?.user || (cc as CommentLike | null)?.actor)?.login === S.me;
    pop.innerHTML = cmPopHtml(own || (!isPr && S.hasToken), own, !isPr && S.hasToken, own && !isPr);
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left - 100, innerWidth - 180) + 'px'; pop.style.top = r.bottom + 4 + 'px';
    pop.onclick = (ev) => { const h = (ev.target as HTMLElement).dataset.h; if (h) { pop.remove(); cmAction(+btn.dataset.cm!, btn.dataset.root as unknown as HTMLElement, h); } };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
  }));
  mountEditors();
  qa<HTMLElement>('[data-rerequest]').forEach((b) => b.addEventListener('click', (e) => rerequestReview(e, b.dataset.rerequest!)));
  qa('[data-thread]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    // Optimistic: flip the thread locally right away, sync with GitHub in the background, undo on failure.
    const b = S.bundle, node = btn.dataset.thread, root = Object.keys(b!.thread_ids || {}).find((k) => b!.thread_ids[k] === node);
    const ids = [Number(root), ...b!.review_comments.filter((c) => String(c.in_reply_to_id) === String(root)).map((c) => c.id)].filter(Boolean);
    const prev = [...(b!.resolved_ids || [])], res = btn.dataset.res === 'resolve';
    b!.resolved_ids = res ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x));
    rerender();
    const r = await act(btn.dataset.res!, { body: node }, 'thread', true);
    if (r === undefined) { b!.resolved_ids = prev; rerender(); alert(S.actErr?.m || 'Could not update the thread.'); return; }
    refreshPr();
  }));
  qa('[data-sug]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation(); const b = S.bundle, c = b!.review_comments.find((x) => String(x.id) === btn.dataset.sug); if (!c) return;
    confirmDlg('Apply suggestion?', `This commits the change to ${c.path} on ${b!.pull.head.ref}.`, 'Commit suggestion', false, async () => {
      (S.applied ||= new Set()).add(String(c.id)); rerender();
      const r = await act('suggest', { extra: { head_repo: b!.pull.head.repo.full_name, branch: b!.pull.head.ref, path: c.path, line: c.line, start_line: c.start_line || null, text: sugOf(c) } }, 'sug', true);
      if (r === undefined) { S.applied!.delete(String(c.id)); rerender(); alert(S.actErr?.m || 'Could not apply the suggestion.'); return; }
      refreshPr().finally(() => { S.applied!.delete(String(c.id)); });
    });
  }));
  qa('[data-dmode]').forEach((b) => b.addEventListener('click', () => { S.diffMode = b.dataset.dmode; localStorage.setItem('diffmode', S.diffMode!); S.keepScroll = true; render(); S.keepScroll = false; }));
  qa('[data-lc]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.lcOpen = b.dataset.lc; S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 200); }));
  $('#lccancel')?.addEventListener('click', () => { S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#lcsuggest')?.addEventListener('click', (ev) => {
    const cur = (S.draft.lc || '').trimEnd(); S.draft.lc = `${cur}${cur ? '\n\n' : ''}\`\`\`suggestion\n${(ev.currentTarget as HTMLElement).dataset.code}\n\`\`\`\n`; saveDrafts();
    S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 150);
  });
  $('#lcadd')?.addEventListener('click', () => {
    const body = (S.draft.lc || '').trim(); if (!body || !S.lcOpen) return;
    const [path, side, line] = S.lcOpen.split('\u001f'); (S.pending![pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body }); savePending();
    S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false;
  });
  qa('[data-lcdel]').forEach((b) => b.addEventListener('click', () => { S.pending![pendKey()] = pendList().filter((c) => String(c.id) !== b.dataset.lcdel); savePending(); S.keepScroll = true; render(); S.keepScroll = false; }));
  $('#finishrev')?.addEventListener('click', reviewDialog);
  $('#cbar')?.addEventListener('click', toggleComposer);
  $('#cbar')?.addEventListener('keydown', cbarKey);
  $('#docomment')?.addEventListener('click', sendComment);
  qa('[data-sendreply]').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.sendreply, r = await act('reply', { id: +id!, body: S.draft['reply-' + id] || '' }, 'reply-' + id); if (r === undefined) return;
    delete S.draft['reply-' + id]; if (!addLocal('reply', r, +id!)) await refreshPr(r.id);
  }));
  qa('.react-add').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation(); $('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop';
    pop.innerHTML = reactPopHtml(REACTS as [string, string][]);
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left, innerWidth - 300) + 'px'; pop.style.top = Math.min(r.bottom + 4, innerHeight - 60) + 'px';
    document.body.appendChild(pop);
    pop.addEventListener('click', (ev) => { const c = (ev.target as HTMLElement).closest<HTMLElement>('[data-c]')?.dataset.c; if (!c) return; pop.remove(); toggleReact(btn.dataset.rk!, btn.dataset.rid!, c); });
    setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }), 0);
  }));
  qa('.rc-btn').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rck!, el.dataset.rcid!)));
  qa('.react-add').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rk!, el.dataset.rid!)));
  qa('.rc-btn').forEach((el) => el.addEventListener('click', (e) => { e.stopPropagation(); toggleReact(el.dataset.rck!, el.dataset.rcid!, el.dataset.rcc!); }));
  $('#doclose')?.addEventListener('click', toggleClosed);
  qa('[data-mb]').forEach((el) => el.addEventListener('click', (e) => toggleMb(e, el.dataset.mb!)));
  $('#rerunck')?.addEventListener('click', rerunChecks);
  $('#updbranch')?.addEventListener('click', updateBranch);
  $('#doready')?.addEventListener('click', markReady);
  $('#todraft')?.addEventListener('click', toDraft);
  $('#doauto')?.addEventListener('click', enableAuto);
  $('#noauto')?.addEventListener('click', disableAuto);
  $('#editpr')?.addEventListener('click', editPrDialog);
  $('#domerge')?.addEventListener('click', doMerge);
  $('#review')?.addEventListener('click', reviewDialog);
}
