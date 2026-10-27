import { options } from 'preact';
import { editorMount } from '../components/Actions';
import { request } from '../components/req';
import type { ComposerProps, MergeActProps } from '../components/Actions';
import type { ActArgs, Bundle, CommentLike, ReviewComment, TimelineEvent } from '../types';
import { openExternal } from './addressbar';
import { S, load, setFlash, tauri } from './core';
import { qc } from './data';
import { pendKey, pendList, savePending, sugOf } from './diff';
import { closePop, openPop } from './dialogs';
import { confetti } from './fun';
import { setComposer } from './keyboard';
import { openPr } from './nav';
import { render } from './pages';
import { checkState } from './timeline';

// ---- Write actions (comment, reply, review, merge, close/reopen) ----
export const peopleList = () => { const b = S.bundle; if (!b) return []; const s = new Set<string>(); [b.pull.user, ...b.timeline.map((e) => e.user || e.actor || e.author), ...b.review_comments.map((c) => c.user)].forEach((u) => u?.login && s.add(u.login)); return [...s]; };

export const drafts = load<Record<string, Record<string, string>>>('drafts', {});

export function saveDrafts() { if (!S.draftRef) return; const d = Object.fromEntries(Object.entries(S.draft).filter(([, v]) => v && v.trim())); if (Object.keys(d).length) drafts[S.draftRef] = d; else delete drafts[S.draftRef]; try { localStorage.setItem('drafts', JSON.stringify(drafts)); } catch { /* storage full */ } }

export const prRef = () => ({ repo: S.bundle!.pull.base.repo.full_name, number: S.bundle!.pull.number });


export const errMsg = (k: string) => (S.actErr && S.actErr.k === k ? S.actErr.m : '');
export function composerProps(b: Bundle): ComposerProps {
  const p = b.pull, closed = p.state === 'closed', busy = S.busy === 'comment';
  const open = busy || S.cOpen === true, dr = (S.draft.comment || '').trim();
  // Docked: it sticks to the bottom of the view, so you can write from anywhere in the thread; the bar expands in place.
  return { open, draft: dr ? dr.replace(/\s+/g, ' ').slice(0, 60) : '', err: errMsg('comment'), merged: !!p.merged, closed, busy };
}
const mergeMethod = () => { const am = S.bundle?.pull.auto_merge; return am ? (({ MERGE: 'merge', SQUASH: 'squash', REBASE: 'rebase' } as Record<string, string>)[am.merge_method!] || 'merge') : 'merge'; };

export function mergeActProps(b: Bundle): MergeActProps | null {
  const p = b.pull; if (p.merged || p.state === 'closed') return null;
  const busy = S.busy === 'merge', am = p.auto_merge, blocked = p.mergeable_state !== 'clean' && p.mergeable_state !== 'unstable';
  return { draft: !!p.draft, err: errMsg('merge'), method: S.method || mergeMethod(), busy, auto: am ? { method: am.merge_method!.toLowerCase(), busy: S.busy === 'disable_automerge' } : null, canAuto: blocked, autoBusy: S.busy === 'automerge', errAuto: errMsg('automerge') };
}


export function closeDlg() {
  const d = S.dlg; if (!d) return;
  if (d.k === 'editpr') delete S.draft.prbody; else if (d.k === 'editc') delete S.draft.editc; else if (d.k === 'commits') S.cpick = null; else if (d.k === 'token') S.oauthLive = false;
  S.dlg = null; render();
}

export function reviewDialog() {
  S.dlg = { k: 'review', ev: 'COMMENT', ok: async () => {
    const ev = (S.dlg as { ev: string }).ev;
    const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
    const r = await act('review', { body: S.draft.review || '', event: ev, extra: lines }, 'review', true);
    if (r === undefined) return;
    delete S.draft.review; delete S.pending![pendKey()]; savePending(); S.dlg = null; await refreshPr();
  } };
  render();
}


export function editPrDialog() {
  const p = S.bundle!.pull; S.draft.prbody = p.body || '';
  S.dlg = { k: 'editpr', title: p.title, ok: async () => {
    const title = (S.dlg as { title: string }).title;
    const r = await act('edit', { body: S.draft.prbody ?? '', extra: { title } }, 'editpr', true);
    if (r === undefined) return;
    delete S.draft.prbody; S.dlg = null; await refreshPr();
  } };
  render();
}


// Write / Preview tabs on a rich editor; the preview is rendered by GitHub so it matches what gets posted.
// Markdown preview of a draft, rendered by the backend; falls back to the raw text with the reason when that is not possible.
export async function previewDraft(key: string): Promise<{ html: string } | { raw: string; err: string } | null> {
  const md = (S.draft[key] || '').trim(); if (!md) return null;
  try {
    if (!tauri) throw new Error('offline');
    const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
    return { html: await tauri!.invoke('render_markdown', { text: md, repo }) };
  } catch (e) { return { raw: md, err: String(e).replace(/^Error: /, '') }; }
}


export function confirmDlg(title: string, text: string, label: string, danger: boolean, fn: () => void | Promise<void>) {
  S.dlg = { k: 'confirm', title, text, label, danger, ok: async () => { S.dlg = null; render(); await fn(); } };
  render();
}


// Runs a write action. Returns the API response, or undefined after showing an error under `key`.
// Any write action puts a spinner in the button that started it and disables it until the request settles.
export const noteClick = (e: MouseEvent) => { const b = (e.target as HTMLElement).closest?.('button'); S.lastSel = b ? btnSel(b) : null; };

export const btnSel = (b: HTMLElement) => { if (b.id) return '#' + b.id; const a = [...b.attributes].find((x) => x.name.startsWith('data-')); return a ? `button[${a.name}="${CSS.escape(a.value)}"]` : null; };
// The same selector, computed from a button's props, so the views can tell which button is busy while they render.
export const propSel = (p: Record<string, unknown>) => { if (p.id) return '#' + String(p.id); const k = Object.keys(p).find((x) => x.startsWith('data-') && p[x] != null); return k ? `button[${k}="${CSS.escape(String(p[k]))}"]` : null; };

const prevVnode = options.vnode;
options.vnode = (v) => {
  if (v.type === 'button' && S.busySels?.length) {
    const p = v.props as Record<string, unknown>, sel = propSel(p);
    if (sel && S.busySels.includes(sel)) { p.class = `${String(p.class ?? p.className ?? '')} is-busy`.trim(); delete p.className; p.disabled = true; p['aria-busy'] = 'true'; }
  }
  prevVnode?.(v);
};

// A busy button is state (S.busySels): the views draw it with the spinner class and disabled until the request settles.
export const setBusy = (sel: string | null, on: boolean) => {
  if (!sel) return;
  const l = S.busySels ||= [], i = l.indexOf(sel);
  if (on) l.push(sel); else if (i >= 0) l.splice(i, 1); else return;
  rerender();
};

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
  const sel = S.lastSel ?? null; setBusy(sel, true);
  try { return await act2(action, args, key, inDialog); } finally { setBusy(sel, false); }
}

export async function act2(action: string, args: ActArgs, key: string, inDialog = false): Promise<ActResult | undefined> {
  S.actErr = null;
  if (!tauri) { S.actErr = { k: key, m: 'Writing needs the desktop app.' }; render(); return undefined; }
  S.busy = key; if (!inDialog) render();
  try {
    const r = action === 'react' ? await tauri!.invoke('toggle_reaction', { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri!.invoke('pr_action', { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
    S.busy = ''; if (action === 'merge' || (action === 'review' && args.event === 'APPROVE')) confetti(); return (r ?? {}) as ActResult;
  } catch (e) {
    S.busy = ''; S.actErr = { k: key, m: String(e).replace(/^Error: /, '') };
    render();
    return undefined;
  }
}

export const refreshPr = (focus: string | number = '') => { qc.invalidate(`${prRef().repo}#${prRef().number}`); saveDrafts(); S.focus = focus ? String(focus) : ''; return openPr(`${prRef().repo}#${prRef().number}`, { nav: true, keepTab: true }); };


export function editCommentDialog(c: ReviewComment | TimelineEvent, kind: string) {
  S.draft.editc = c.body || '';
  S.dlg = { k: 'editc', ok: async () => {
    const r = await act('edit_comment', { id: c.id, kind, body: S.draft.editc ?? '' }, 'editc', true);
    if (r === undefined) return;
    delete S.draft.editc; S.dlg = null; await refreshPr(c.id);
  } };
  render();
}

export function deleteCommentDialog(c: { id?: number }, kind: string) {
  S.dlg = { k: 'delc', ok: async () => {
    const r = await act('delete_comment', { id: c.id, kind }, 'delc', true);
    if (r === undefined) return;
    S.dlg = null; await refreshPr();
  } };
  render();
}

export function hideCommentDialog(c: { node_id?: string; id?: number | string }) {
  const reasons = [['SPAM', 'Spam'], ['ABUSE', 'Abuse'], ['OFF_TOPIC', 'Off-topic'], ['OUTDATED', 'Outdated'], ['DUPLICATE', 'Duplicate'], ['RESOLVED', 'Resolved']];
  S.hideReason = 'OUTDATED'; S.dlg = { k: 'hidec', reasons: reasons as [string, string][], ok: async () => {
    const r = await act('minimize', { body: c.node_id || '', content: S.hideReason || 'OUTDATED' }, 'hidec', true);
    if (r === undefined) return;
    S.fold['c:' + c.id] = true; localStorage.setItem('fold', JSON.stringify(S.fold));
    S.dlg = null; await refreshPr();
  } };
  render();
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
  saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false; syncDraft(key);
  setTimeout(() => scrollDraft(key), 50);
}

// Show a just-posted comment from the API reply instead of re-fetching the whole PR.
export function addLocal(kind: string, r: ReviewComment | TimelineEvent, rootId?: number) {
  const b = S.bundle; if (!b || !r || !r.id || !r.body_html) return false;
  if (kind === 'commented') b.timeline.push({ ...r, event: 'commented', actor: r.user });
  else { const root = b.review_comments.find((c) => c.id === rootId); if (!root) return false; b.review_comments.push({ ...r, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position } as ReviewComment); }
  qc.set(`${prRef().repo}#${prRef().number}`, b); qc.invalidate(`${prRef().repo}#${prRef().number}`); qc.m.get(`${prRef().repo}#${prRef().number}`)!.at = Date.now() - 20000;
  S.focus = ''; S.keepScroll = true; render(); S.keepScroll = false;
  { setFlash('c-' + r.id, { block: 'start', pop: true }); S.keepScroll = true; render(); S.keepScroll = false; }
  return true;
}

export async function rerequestReview(e: Event, login: string) {
  const b = e.currentTarget as HTMLElement;
  e.stopPropagation(); const sel = btnSel(b); setBusy(sel, true);
  try {
    const r = await act('rerequest', { body: login }, 'rerequest'); if (r === undefined) { alert(S.actErr?.m || 'Could not re-request review.'); return; }
    await refreshPr();
  } finally { setBusy(sel, false); }
}
// Merge box, merge actions and composer handlers: shared by the live PR page and by the imperatively bound copies (split view).
export const composerOpen = () => S.busy === 'comment' || S.cOpen === true;
export function toggleComposer() { setComposer(!composerOpen(), true); }
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
export async function rerunChecks(e: Event) { e.stopPropagation(); const urls = (S.bundle!.checks || []).filter((c) => checkState(c) === 'fail' && c.url).map((c) => c.url); const sel = btnSel(e.currentTarget as HTMLElement); setBusy(sel, true); try { const r = await act('rerun', { extra: urls }, 'rerun'); if (r !== undefined) { S.actErr = null; await refreshPr(); } } finally { setBusy(sel, false); } }
export async function updateBranch() { const r = await act('update_branch', {}, 'update_branch'); if (r !== undefined) await refreshPr(); }
export async function markReady() { const r = await act('ready', {}, 'ready'); if (r !== undefined) await refreshPr(); }
export function toDraft() { confirmDlg('Convert to draft?', 'Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.', 'Convert to draft', false, async () => { const r = await act('draft', {}, 'merge'); if (r !== undefined) await refreshPr(); }); }
export async function enableAuto() { const r = await act('automerge', { method: S.method || mergeMethod() }, 'automerge'); if (r !== undefined) await refreshPr(); }
export async function disableAuto() { const r = await act('disable_automerge', {}, 'automerge'); if (r !== undefined) await refreshPr(); }
export function doMerge() {
  const m = S.method || mergeMethod(), p = S.bundle!.pull, names: Record<string, string> = { merge: 'merge commit', squash: 'squash and merge', rebase: 'rebase and merge' };
  confirmDlg('Merge this pull request?', `${p.head.label} will be merged into ${p.base.label} using ${names[m]}. This changes the repository and cannot be undone from here.`, 'Merge', false, async () => { const r = await act('merge', { method: m }, 'merge'); if (r !== undefined) await refreshPr(); });
}

// Comment, reaction, thread and suggestion handlers: shared by the live conversation and by the imperatively bound copies (diff lines, split view).
export function cmMenu(e: Event, btn: HTMLElement) {
  e.stopPropagation();
  const bb = S.bundle, cc = String(bb!.pull.id) === String(btn.dataset.cm) ? bb!.pull : [...bb!.timeline, ...bb!.review_comments].find((x) => String(x.id) === String(btn.dataset.cm));
  const isPr = cc === bb!.pull, own = !!S.me && ((cc as CommentLike | null)?.user || (cc as CommentLike | null)?.actor)?.login === S.me;
  const r = btn.getBoundingClientRect(), id = +btn.dataset.cm!, root = btn.dataset.root as unknown as HTMLElement;
  openPop({ k: 'cm', x: Math.min(r.left - 100, innerWidth - 180), y: r.bottom + 4, hr: own || (!isPr && !!S.hasToken), edit: own, hide: !isPr && !!S.hasToken, del: own && !isPr, pick: (h) => { closePop(); cmAction(id, root, h); } });
}
export function reactAdd(e: Event, btn: HTMLElement) {
  e.stopPropagation();
  const r = btn.getBoundingClientRect(), kind = btn.dataset.rk!, id = btn.dataset.rid!;
  openPop({ k: 'react', x: Math.min(r.left, innerWidth - 300), y: Math.min(r.bottom + 4, innerHeight - 60), pick: (c) => { closePop(); toggleReact(kind, id, c); } });
}
export function reactToggle(e: Event, kind: string, id: number | string, c: string) { e.stopPropagation(); toggleReact(kind, id, c); }
export async function threadAct(e: Event, node: string, how: string) {
  e.stopPropagation();
  // Optimistic: flip the thread locally right away, sync with GitHub in the background, undo on failure.
  const b = S.bundle, root = Object.keys(b!.thread_ids || {}).find((k) => b!.thread_ids[k] === node);
  const ids = [Number(root), ...b!.review_comments.filter((c) => String(c.in_reply_to_id) === String(root)).map((c) => c.id)].filter(Boolean);
  const prev = [...(b!.resolved_ids || [])], res = how === 'resolve';
  b!.resolved_ids = res ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x));
  rerender();
  const r = await act(how, { body: node }, 'thread', true);
  if (r === undefined) { b!.resolved_ids = prev; rerender(); alert(S.actErr?.m || 'Could not update the thread.'); return; }
  refreshPr();
}
export function applySuggestion(e: Event, id: string) {
  e.stopPropagation(); const b = S.bundle, c = b!.review_comments.find((x) => String(x.id) === id); if (!c) return;
  confirmDlg('Apply suggestion?', `This commits the change to ${c.path} on ${b!.pull.head.ref}.`, 'Commit suggestion', false, async () => {
    (S.applied ||= new Set()).add(String(c.id)); rerender();
    const r = await act('suggest', { extra: { head_repo: b!.pull.head.repo.full_name, branch: b!.pull.head.ref, path: c.path, line: c.line, start_line: c.start_line || null, text: sugOf(c) } }, 'sug', true);
    if (r === undefined) { S.applied!.delete(String(c.id)); rerender(); alert(S.actErr?.m || 'Could not apply the suggestion.'); return; }
    refreshPr().finally(() => { S.applied!.delete(String(c.id)); });
  });
}
export async function sendReply(id: string) {
  const r = await act('reply', { id: +id, body: S.draft['reply-' + id] || '' }, 'reply-' + id); if (r === undefined) return;
  delete S.draft['reply-' + id]; if (!addLocal('reply', r, +id)) await refreshPr(r.id);
}

// Diff view handlers: shared by the live files tab and the imperatively bound copies.
export function setDiffMode(m: string) { S.diffMode = m; localStorage.setItem('diffmode', m); rerender(); }
export function lcOpen(e: Event) { e.stopPropagation(); S.lcOpen = (e.currentTarget as HTMLElement).dataset.lc; rerender(); focusDraft('lc'); }
export function lcCancel() { S.lcOpen = ''; delete S.draft.lc; saveDrafts(); rerender(); }
export function lcSuggest(ev: Event) {
  const cur = (S.draft.lc || '').trimEnd(); S.draft.lc = `${cur}${cur ? '\n\n' : ''}\`\`\`suggestion\n${(ev.currentTarget as HTMLElement).dataset.code}\n\`\`\`\n`; saveDrafts();
  rerender(); focusDraft('lc');
}
export function lcAdd() {
  const body = (S.draft.lc || '').trim(); if (!body || !S.lcOpen) return;
  const [path, side, line] = S.lcOpen.split('\u001f'); (S.pending![pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body }); savePending();
  S.lcOpen = ''; delete S.draft.lc; saveDrafts(); rerender();
}
export function lcDel(id: string) { S.pending![pendKey()] = pendList().filter((c) => String(c.id) !== id); savePending(); rerender(); }

export const rerender = () => { S.keepScroll = true; render(); S.keepScroll = false; };

// Live editors, so a new draft can be pushed into one and the newest can be focused.
const live = new Map<EditorHandle, string>();
// Focus an editor by its draft key; when it has not been built yet (it mounts lazily) the request waits for it.
const wantFocus = new Set<string>();
editorMount.focus = (key) => { const ed = [...live].find(([, k]) => k === key)?.[0]; if (ed) ed.focus?.(); else wantFocus.add(key); };
export const focusDraft = (key: string) => request('draft:focus:' + key);
export const scrollDraft = (key: string) => request('draft:scroll:' + key);
export const blurDraft = (key: string) => request('draft:blur:' + key);
export function syncDraft(key: string) { live.forEach((k, ed) => { if (k === key) ed.setMarkdown?.(S.draft[key] || ''); }); }

// Called by every DraftBox when it mounts: builds the editor once its box is near the viewport; the returned function tears it down.
editorMount.preview = previewDraft;
editorMount.fn = (host, key, ph) => {
  if (!window.createEditor) { host.innerHTML = '<div class="act-err">Editor failed to load.</div>'; return () => {}; }
  const send = () => request('draft:submit:' + key);
  let ed: EditorHandle | null = null, gone = false;
  const mount = () => { if (gone) return; ed = window.createEditor!(host, { value: S.draft[key] || '', placeholder: ph, people: peopleList(), onChange: (md) => { S.draft[key] = md; saveDrafts(); }, onSubmit: send }); live.set(ed, key); if (wantFocus.delete(key)) ed.focus?.(); };
  // Editors are heavy: build each one only when its box is near the viewport.
  const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); mount(); } }, { rootMargin: '300px' });
  io.observe(host.parentElement || host);
  return () => { gone = true; io.disconnect(); if (ed) { live.delete(ed); ed.destroy(); } };
};

