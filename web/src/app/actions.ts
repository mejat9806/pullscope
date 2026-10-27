import { openExternal } from './addressbar';
import { $, REACTS, S, esc, icon, load, tauri } from './core';
import { qc } from './data';
import { pendKey, pendList, savePending, sugOf } from './diff';
import { confetti } from './fun';
import { setComposer } from './keyboard';
import { openPr } from './nav';
import { render, saveNotes } from './pages';
import { checkState } from './timeline';

// ---- Write actions (comment, reply, review, merge, close/reopen) ----
export const peopleList = () => { const b = S.bundle; if (!b) return []; const s = new Set(); [b.pull.user, ...b.timeline.map((e: { user: any; actor: any; author: any; }) => e.user || e.actor || e.author), ...b.review_comments.map((c: { user: any; }) => c.user)].forEach((u) => u?.login && s.add(u.login)); return [...s]; };

export const drafts: Record<string, any> = load('drafts', {});

export function saveDrafts() { if (!S.draftRef) return; const d = Object.fromEntries(Object.entries(S.draft).filter(([, v]: any) => v && v.trim())); if (Object.keys(d).length) drafts[S.draftRef] = d; else delete drafts[S.draftRef]; try { localStorage.setItem('drafts', JSON.stringify(drafts)); } catch { /* storage full */ } }

export const prRef = () => ({ repo: S.bundle.pull.base.repo.full_name, number: S.bundle.pull.number });

export const draftBox = (key: string, ph: string, rows = 4) => `<div class="tt" data-draft="${key}" data-ph="${esc(ph)} — type / for blocks" style="--rows:${rows}"></div>`;

export const errLine = (k: string) => (S.actErr && S.actErr.k === k ? `<div class="act-err">${esc(S.actErr.m)}</div>` : '');


export function composer(b: { pull: any; }) {
  const p = b.pull, closed = p.state === 'closed', busy = S.busy === 'comment';
  const open = busy || S.cOpen === true, dr = (S.draft.comment || '').trim();
  // Docked: it sticks to the bottom of the view, so you can write from anywhere in the thread; the bar expands in place.
  return `<div class="composer dock${open ? '' : ' collapsed'}" id="composer"><div class="composer-h" id="cbar" role="button" tabindex="0" title="Write a comment (C)">${icon('comment')}<b>Add a comment</b><span class="cbar-ph">${dr ? `Draft: ${esc(dr.replace(/\s+/g, ' ').slice(0, 60))}` : 'Write a comment…'}</span><kbd>C</kbd><span class="cbar-x">${icon('chevron-down')}</span></div>
  <div class="composer-body">${draftBox('comment', 'Write a comment… (Markdown supported)')}${errLine('comment')}
  <div class="composer-f"><span class="hint">⌘↵ to send · Esc to collapse</span><span style="flex:1"></span>
  ${p.merged ? '' : `<button class="btn ghost" id="doclose">${closed ? 'Reopen pull request' : 'Close pull request'}</button>`}
  <button class="btn primary" id="docomment" ${busy ? 'disabled' : ''}>${busy ? 'Sending…' : 'Comment'}</button></div></div></div>`;
}


export function mergeActions(b: { pull: any; }) {
  const p = b.pull; if (p.merged || p.state === 'closed') return '';
  const busy = S.busy === 'merge', am = p.auto_merge, blocked = p.mergeable_state !== 'clean' && p.mergeable_state !== 'unstable';
  const opts = (sel: string) => [['merge', 'Create a merge commit'], ['squash', 'Squash and merge'], ['rebase', 'Rebase and merge']].map(([v, t]) => `<option value="${v}" ${sel === v ? 'selected' : ''}>${t}</option>`).join('');
  const cur = am ? ({ MERGE: 'merge', SQUASH: 'squash', REBASE: 'rebase' }[am.merge_method] || 'merge') : 'merge';
  if (p.draft) return `<div class="merge-act"><button class="btn ghost" id="doclose">Close pull request</button>${errLine('merge')}</div>`;
  return `<div class="merge-act"><select class="sel" id="mmethod">${opts(cur)}</select><button class="btn primary" id="domerge" ${busy ? 'disabled' : ''}>${busy ? 'Merging…' : 'Merge pull request'}</button>
  ${am ? `<button class="btn" id="noauto" title="Auto-merge is on (${esc(am.merge_method.toLowerCase())})">${S.busy === 'disable_automerge' ? 'Turning off…' : 'Disable auto-merge'}</button>` : blocked ? `<button class="btn" id="doauto" title="Merge automatically once required checks and reviews pass">${S.busy === 'automerge' ? 'Enabling…' : 'Enable auto-merge'}</button>` : ''}
  <button class="btn ghost" id="todraft" title="Mark as draft again">Convert to draft</button>${errLine('merge')}${errLine('automerge')}</div>`;
}


export function reviewDialog() {
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Finish your review</h2>${draftBox('review', pendList().length ? `Leave a review comment (${pendList().length} line comment${pendList().length === 1 ? '' : 's'} will be included)` : 'Leave a review comment (required unless approving)', 5)}
  <div class="radios"><label><input type="radio" name="rev" value="COMMENT" checked> <b>Comment</b> <span>Submit general feedback without explicit approval.</span></label>
  <label><input type="radio" name="rev" value="APPROVE"> <b>Approve</b> <span>Submit feedback and approve merging these changes.</span></label>
  <label><input type="radio" name="rev" value="REQUEST_CHANGES"> <b>Request changes</b> <span>Submit feedback that must be addressed before merging.</span></label></div>
  <div id="reverr"></div><div class="btns"><button class="btn" id="revcancel">Cancel</button><button class="btn primary" id="revsubmit">Submit review</button></div></div></div>`;
  render();
  $('#revcancel').onclick = () => { S.dialog = ''; render(); };
  $('#revsubmit').onclick = async () => {
    const ev = document.querySelector('input[name=rev]:checked').value;
    const lines = pendList().map(({ path, line, side, body }) => ({ path, line, side, body }));
    const r = await act('review', { body: S.draft.review || '', event: ev, extra: lines }, 'review', true);
    if (r === undefined) return;
    delete S.draft.review; delete S.pending[pendKey()]; savePending(); S.dialog = ''; await refreshPr(); 
  };
}


export function editPrDialog() {
  const p = S.bundle.pull; S.draft.prbody = p.body || '';
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit pull request</h2><label class="np-l">Title</label><input class="input" id="eptitle" value="${esc(p.title)}" style="width:100%;box-sizing:border-box;height:34px"><label class="np-l">Description</label>${draftBox('prbody', 'Describe your changes', 8)}<div id="reverr">${errLine('editpr')}</div><div class="btns"><button class="btn" id="epcancel">Cancel</button><button class="btn primary" id="epsave">Save</button></div></div></div>`;
  render();
  $('#epcancel').onclick = () => { delete S.draft.prbody; S.dialog = ''; render(); };
  $('#epsave').onclick = async () => {
    const title = $('#eptitle').value;
    const r = await act('edit', { body: S.draft.prbody ?? '', extra: { title } }, 'editpr', true);
    if (r === undefined) return;
    delete S.draft.prbody; S.dialog = ''; await refreshPr();
  };
}


// Write / Preview tabs on a rich editor; the preview is rendered by GitHub so it matches what gets posted.
export function addPreview(host: { prepend: (arg0: HTMLDivElement) => void; append: (arg0: HTMLDivElement) => void; querySelectorAll: (arg0: string) => any[]; classList: { toggle: (arg0: string,arg1: boolean) => void; }; querySelector: (arg0: string) => { (): any; new(): any; focus: { (): void; new(): any; }; }; }, key: string|number) {
  const tabs = document.createElement('div'); tabs.className = 'tt-tabs';
  tabs.innerHTML = '<button class="on" data-pv="write">Write</button><button data-pv="preview">Preview</button>';
  const pv = document.createElement('div'); pv.className = 'tt-preview markdown-body'; pv.hidden = true;
  host.prepend(tabs); host.append(pv);
  const show = async (mode: string) => {
    tabs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.pv === mode));
    const prev = mode === 'preview';
    host.querySelectorAll('.tt-bar, .tt-body').forEach((el: { hidden: boolean; }) => { el.hidden = prev; });
    pv.hidden = !prev; host.classList.toggle('previewing', prev);
    if (!prev) { host.querySelector('.tt-content')?.focus(); return; }
    const md = (S.draft[key] || '').trim();
    if (!md) { pv.innerHTML = '<span class="empty">Nothing to preview</span>'; return; }
    pv.innerHTML = '<span class="empty">Loading preview…</span>';
    try {
      if (!tauri) throw new Error('offline');
      const repo = S.bundle?.pull.base.repo.full_name || S.np?.repo || null;
      const html = await tauri.invoke('render_markdown', { text: md, repo });
      if (!pv.hidden) pv.innerHTML = html;
    } catch (e) { if (!pv.hidden) pv.innerHTML = `<pre class="pv-raw"></pre><div class="act-err">Couldn't render the preview (${esc(String(e).replace(/^Error: /, ''))}). Showing the raw Markdown.</div>`, pv.querySelector('.pv-raw').textContent = md; }
  };
  tabs.addEventListener('click', (e) => { const m = e.target.closest('[data-pv]')?.dataset.pv; if (m) show(m); });
}


export function confirmDlg(title: string, text: string, label: string, danger: boolean, fn: { (): Promise<void>; (): Promise<void>; (): Promise<void>; (): Promise<void>; (): any; }) {
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="btns"><button class="btn" id="cfcancel">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfok">${esc(label)}</button></div></div></div>`;
  render();
  $('#cfcancel').onclick = () => { S.dialog = ''; render(); };
  $('#cfok').onclick = async () => { S.dialog = ''; render(); await fn(); };
}


// Runs a write action. Returns the API response, or undefined after showing an error under `key`.
// Any write action puts a spinner in the button that started it and disables it until the request settles.
document.addEventListener('click', (e) => { S.lastBtn = e.target.closest?.('button') || null; }, true);

export const btnSel = (b: { id: string; attributes: any; }) => { if (b.id) return '#' + b.id; const a = [...b.attributes].find((x) => x.name.startsWith('data-')); return a ? `button[${a.name}="${CSS.escape(a.value)}"]` : null; };

export const setBusy = (b: { classList: { toggle: (arg0: string,arg1: any) => void; }; disabled: any; setAttribute: (arg0: string,arg1: string) => void; }, on: boolean) => { if (!b) return; b.classList.toggle('is-busy', on); b.disabled = on; b.setAttribute('aria-busy', on ? 'true' : 'false'); };

// Add a reaction, or remove it when you already left it (clicking the same emoji again), like github.com.
S.mine = {};
 // `${kind}:${id}` -> Promise of the Set of reactions you have left there
export const getMine = (kind: any, rid: string|number) => (S.mine[`${kind}:${rid}`] ||= tauri ? tauri.invoke('my_reactions', { ...prRef(), kind, id: +rid }).then((l: Iterable<unknown>|null|undefined) => new Set(l)).catch(() => { delete S.mine[`${kind}:${rid}`]; return new Set(); }) : Promise.resolve(new Set()));

export async function toggleReact(kind: string, rid: string|number|undefined, c: string|number) {
  const mine = (await getMine(kind, rid)).has(c);
  const b = S.bundle, tgt = kind === 'pr' ? b.pull : [...b.timeline, ...b.review_comments].find((x) => String(x.id) === String(rid));
  const prev = tgt && tgt.reactions ? { ...tgt.reactions } : null, base = prev ? prev[c] || 0 : 0;
  const bump = (n: number) => { if (tgt) tgt.reactions = { ...(tgt.reactions || {}), [c]: Math.max(0, base + n) }; };
  bump(mine ? -1 : 1); S.refreshing = true; rerender();
  const r = await act('react', { kind, id: +rid, content: c }, 'react');
  if (r === undefined) { if (tgt && prev) tgt.reactions = prev; S.refreshing = false; rerender(); return; }
  const set = await getMine(kind, rid); r.added === false ? set.delete(c) : set.add(c);
  await refreshPr(kind === 'pr' ? '' : rid);
}

export async function act(action: string, args: { body?: any; event?: any; extra?: any; kind?: any; id?: any; content?: any; method?: any; }, key: string, inDialog = false) {
  const btn = S.lastBtn && document.contains(S.lastBtn) ? S.lastBtn : null; S.busySel = btn ? btnSel(btn) : null; setBusy(btn, true);
  try { return await act2(action, args, key, inDialog); } finally { S.busySel = null; setBusy(btn, false); }
}

export async function act2(action: string, args: { kind: any; id: any; content: any; event: string; }, key: any, inDialog = false) {
  S.actErr = '';
  if (!tauri) { S.actErr = { k: key, m: 'Writing needs the desktop app.' }; if (inDialog) $('#reverr').innerHTML = `<div class="act-err">${S.actErr.m}</div>`; else render(); return undefined; }
  S.busy = key; if (!inDialog) render();
  try {
    const r = action === 'react' ? await tauri.invoke('toggle_reaction', { ...prRef(), kind: args.kind, id: args.id, content: args.content }) : await tauri.invoke('pr_action', { ...prRef(), action, body: null, id: null, event: null, method: null, kind: null, content: null, extra: null, ...args });
    S.busy = ''; if (action === 'merge' || (action === 'review' && args.event === 'APPROVE')) confetti(); return r ?? {};
  } catch (e) {
    S.busy = ''; S.actErr = { k: key, m: String(e).replace(/^Error: /, '') };
    if (inDialog) { const el = $('#reverr'); if (el) el.innerHTML = `<div class="act-err">${esc(S.actErr.m)}</div>`; } else render();
    return undefined;
  }
}

export const refreshPr = (focus = '') => { qc.invalidate(`${prRef().repo}#${prRef().number}`); saveDrafts(); S.focus = focus ? String(focus) : ''; return openPr(`${prRef().repo}#${prRef().number}`, { nav: true, keepTab: true }); };


export function editCommentDialog(c: { body: string; id: string|undefined; }, kind: string) {
  S.draft.editc = c.body || '';
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit comment</h2>${draftBox('editc', 'Edit your comment', 6)}<div id="reverr">${errLine('editc')}</div><div class="btns"><button class="btn" id="eccancel">Cancel</button><button class="btn primary" id="ecsave">Save</button></div></div></div>`;
  render();
  $('#eccancel').onclick = () => { delete S.draft.editc; S.dialog = ''; render(); };
  $('#ecsave').onclick = async () => {
    const r = await act('edit_comment', { id: c.id, kind, body: S.draft.editc ?? '' }, 'editc', true);
    if (r === undefined) return;
    delete S.draft.editc; S.dialog = ''; await refreshPr(c.id);
  };
}

export function deleteCommentDialog(c: { id: any; }, kind: string) {
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Delete this comment?</h2><p style="color:var(--fgColor-muted)">This can't be undone.</p><div id="reverr">${errLine('delc')}</div><div class="btns"><button class="btn" id="dccancel">Cancel</button><button class="btn danger" id="dcdo">Delete</button></div></div></div>`;
  render();
  $('#dccancel').onclick = () => { S.dialog = ''; render(); };
  $('#dcdo').onclick = async () => {
    const r = await act('delete_comment', { id: c.id, kind }, 'delc', true);
    if (r === undefined) return;
    S.dialog = ''; await refreshPr();
  };
}

export function hideCommentDialog(c: { node_id: any; id: string; }) {
  const reasons = [['SPAM', 'Spam'], ['ABUSE', 'Abuse'], ['OFF_TOPIC', 'Off-topic'], ['OUTDATED', 'Outdated'], ['DUPLICATE', 'Duplicate'], ['RESOLVED', 'Resolved']];
  S.dialog = `<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Hide this comment</h2><label class="np-l">Reason</label><select class="sel" id="hcreason" style="width:100%;height:34px">${reasons.map(([v, l]) => `<option value="${v}" ${v === 'OUTDATED' ? 'selected' : ''}>${l}</option>`).join('')}</select><div id="reverr">${errLine('hidec')}</div><div class="btns"><button class="btn" id="hccancel">Cancel</button><button class="btn primary" id="hcdo">Hide comment</button></div></div></div>`;
  render();
  $('#hccancel').onclick = () => { S.dialog = ''; render(); };
  $('#hcdo').onclick = async () => {
    const r = await act('minimize', { body: c.node_id || '', content: $('#hcreason').value }, 'hidec', true);
    if (r === undefined) return;
    S.fold['c:' + c.id] = true; localStorage.setItem('fold', JSON.stringify(S.fold));
    S.dialog = ''; await refreshPr();
  };
}

export function cmAction(id: any, root: string, how: string) {
  const b = S.bundle, c = [...b.timeline, ...b.review_comments].find((x) => String(x.id) === String(id)) || (String(b.pull.id) === String(id) ? b.pull : null); if (!c) return;
  if (how === 'link') return navigator.clipboard?.writeText(c.html_url || '');
  if (how === 'md') return navigator.clipboard?.writeText(c.body || '');
  const kind = c === b.pull ? 'pr' : b.review_comments.includes(c) ? 'review_comment' : 'issue_comment';
  if (how === 'issue') { const r = prRef().repo; return openExternal(`https://github.com/${r}/issues/new?body=${encodeURIComponent(`Reference: ${c.html_url || ''}\n\n`)}`); }
  if (how === 'edit') return kind === 'pr' ? editPrDialog() : editCommentDialog(c, kind);
  if (how === 'hide') return hideCommentDialog(c);
  if (how === 'del') return deleteCommentDialog(c, kind);
  const key = root ? 'reply-' + root : 'comment', q = (c.body || '').split('\n').map((l: string) => '> ' + l).join('\n');
  S.draft[key] = (S.draft[key] ? S.draft[key] + '\n\n' : '') + `@${(c.user || c.actor || {}).login || ''}\n\n${q}\n\n`;
  saveDrafts(); S.eds = []; S.keepScroll = true; render(); S.keepScroll = false;
  setTimeout(() => document.querySelector(`[data-draft="${key}"]`)?.scrollIntoView({ block: 'center' }), 50);
}

// Show a just-posted comment from the API reply instead of re-fetching the whole PR.
export function addLocal(kind: string, r: { id: string; body_html: any; user: any; }, rootId?: number|undefined) {
  const b = S.bundle; if (!b || !r || !r.id || !r.body_html) return false;
  if (kind === 'commented') b.timeline.push({ ...r, event: 'commented', actor: r.user });
  else { const root = b.review_comments.find((c: { id: any; }) => c.id === rootId); if (!root) return false; b.review_comments.push({ ...r, pull_request_review_id: root.pull_request_review_id, path: root.path, diff_hunk: root.diff_hunk, position: root.position, original_position: root.original_position }); }
  qc.set(`${prRef().repo}#${prRef().number}`, b); qc.invalidate(`${prRef().repo}#${prRef().number}`); qc.m.get(`${prRef().repo}#${prRef().number}`).at = Date.now() - 20000;
  S.focus = ''; S.keepScroll = true; render(); S.keepScroll = false;
  const el = document.getElementById('c-' + r.id); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash', 'pop-in'); }
  return true;
}

// Opening/closing the drawer only toggles a class — no page redraw, so nothing underneath moves.
export function setBell(open: boolean) {
  S.bell = open;
  $('.note-panel')?.classList.toggle('open', open);
  if (!open && S.notes.some((n: { read: any; }) => !n.read)) {
    S.notes.forEach((n: { read: boolean; }) => (n.read = true)); saveNotes();
    document.querySelectorAll('.note-panel .note.new').forEach((el) => el.classList.remove('new'));
    $('#bell .dot')?.remove();
  }
}

// Click outside (or Esc) closes the notifications drawer; opening it marks everything read, as closing via the bell does.
document.addEventListener('mousedown', (e) => {
  if (!S.bell || e.target.closest('.note-panel, #bell')) return;
  setBell(false);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.bell) setBell(false); });

export const rerender = () => { S.keepScroll = true; render(); S.keepScroll = false; };

export function bindWrite() {
  document.querySelectorAll('.cm-btn').forEach((btn) => btn.addEventListener('click', (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); document.querySelector('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop cm-pop';
    const bb = S.bundle, cc = String(bb.pull.id) === String(btn.dataset.cm) ? bb.pull : [...bb.timeline, ...bb.review_comments].find((x) => String(x.id) === String(btn.dataset.cm));
    const isPr = cc === bb.pull, own = !!S.me && (cc?.user || cc?.actor)?.login === S.me;
    pop.innerHTML = `<button data-h="link">Copy link</button><button data-h="md">Copy Markdown</button><button data-h="quote">Quote reply</button><button data-h="issue">Reference in new issue</button>${own || (!isPr && S.hasToken) ? '<hr>' : ''}${own ? '<button data-h="edit">Edit</button>' : ''}${!isPr && S.hasToken ? '<button data-h="hide">Hide</button>' : ''}${own && !isPr ? '<button data-h="del" class="danger">Delete</button>' : ''}`;
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left - 100, innerWidth - 180) + 'px'; pop.style.top = r.bottom + 4 + 'px';
    pop.onclick = (ev) => { const h = ev.target.dataset.h; if (h) { pop.remove(); cmAction(btn.dataset.cm, btn.dataset.root, h); } };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
  }));
  document.querySelectorAll('.tt[data-draft]').forEach((host) => {
    const key = host.dataset.draft;
    if (!window.createEditor) { host.innerHTML = '<div class="act-err">Editor failed to load.</div>'; return; }
    const send = () => (key === 'comment' ? $('#docomment') : key === 'lc' ? $('#lcadd') : key === 'newpr' ? $('#npcreate') : key.startsWith('reply-') ? document.querySelector(`[data-sendreply="${key.slice(6)}"]`) : $('#revsubmit'))?.click();
    const mount = () => { (S.eds ||= []).push(window.createEditor(host, { value: S.draft[key] || '', placeholder: host.dataset.ph, people: peopleList(), onChange: (md: any) => { S.draft[key] = md; saveDrafts(); }, onSubmit: send })); addPreview(host, key); };
    // Editors are heavy: build each one only when its box is near the viewport.
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); if (host.isConnected) mount(); } }, { rootMargin: '300px' });
    io.observe(host);
  });
  document.querySelectorAll('[data-rerequest]').forEach((b) => b.addEventListener('click', async (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); b.disabled = true; b.classList.add('spin');
    const r = await act('rerequest', { body: b.dataset.rerequest }, 'rerequest'); if (r === undefined) { b.disabled = false; b.classList.remove('spin'); alert(S.actErr?.m || 'Could not re-request review.'); return; }
    await refreshPr();
  }));
  document.querySelectorAll('[data-thread]').forEach((btn) => btn.addEventListener('click', async (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    // Optimistic: flip the thread locally right away, sync with GitHub in the background, undo on failure.
    const b = S.bundle, node = btn.dataset.thread, root = Object.keys(b.thread_ids || {}).find((k) => b.thread_ids[k] === node);
    const ids = [Number(root), ...b.review_comments.filter((c: { in_reply_to_id: any; }) => String(c.in_reply_to_id) === String(root)).map((c: { id: any; }) => c.id)].filter(Boolean);
    const prev = [...(b.resolved_ids || [])], res = btn.dataset.res === 'resolve';
    b.resolved_ids = res ? [...new Set([...prev, ...ids])] : prev.filter((x) => !ids.includes(x));
    rerender();
    const r = await act(btn.dataset.res, { body: node }, 'thread', true);
    if (r === undefined) { b.resolved_ids = prev; rerender(); alert(S.actErr?.m || 'Could not update the thread.'); return; }
    refreshPr();
  }));
  document.querySelectorAll('[data-sug]').forEach((btn) => btn.addEventListener('click', async (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); const b = S.bundle, c = b.review_comments.find((x: { id: any; }) => String(x.id) === btn.dataset.sug); if (!c) return;
    confirmDlg('Apply suggestion?', `This commits the change to ${c.path} on ${b.pull.head.ref}.`, 'Commit suggestion', false, async () => {
      (S.applied ||= new Set()).add(String(c.id)); rerender();
      const r = await act('suggest', { extra: { head_repo: b.pull.head.repo.full_name, branch: b.pull.head.ref, path: c.path, line: c.line, start_line: c.start_line || null, text: sugOf(c) } }, 'sug', true);
      if (r === undefined) { S.applied.delete(String(c.id)); rerender(); alert(S.actErr?.m || 'Could not apply the suggestion.'); return; }
      refreshPr().finally(() => { S.applied.delete(String(c.id)); });
    });
  }));
  document.querySelectorAll('[data-dmode]').forEach((b) => b.addEventListener('click', () => { S.diffMode = b.dataset.dmode; localStorage.setItem('diffmode', S.diffMode); S.keepScroll = true; render(); S.keepScroll = false; }));
  document.querySelectorAll('[data-lc]').forEach((b) => b.addEventListener('click', (e: { stopPropagation: () => void; }) => { e.stopPropagation(); S.lcOpen = b.dataset.lc; S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 200); }));
  $('#lccancel')?.addEventListener('click', () => { S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#lcsuggest')?.addEventListener('click', (ev: { currentTarget: { dataset: { code: any; }; }; }) => {
    const cur = (S.draft.lc || '').trimEnd(); S.draft.lc = `${cur}${cur ? '\n\n' : ''}\`\`\`suggestion\n${ev.currentTarget.dataset.code}\n\`\`\`\n`; saveDrafts();
    S.keepScroll = true; render(); S.keepScroll = false; setTimeout(() => S.eds?.at(-1)?.focus?.(), 150);
  });
  $('#lcadd')?.addEventListener('click', () => {
    const body = (S.draft.lc || '').trim(); if (!body || !S.lcOpen) return;
    const [path, side, line] = S.lcOpen.split('\u001f'); (S.pending[pendKey()] ||= []).push({ id: Date.now(), path, side, line: +line, body }); savePending();
    S.lcOpen = ''; delete S.draft.lc; saveDrafts(); S.keepScroll = true; render(); S.keepScroll = false;
  });
  document.querySelectorAll('[data-lcdel]').forEach((b) => b.addEventListener('click', () => { S.pending[pendKey()] = pendList().filter((c: { id: any; }) => String(c.id) !== b.dataset.lcdel); savePending(); S.keepScroll = true; render(); S.keepScroll = false; }));
  $('#finishrev')?.addEventListener('click', reviewDialog);
  $('#cbar')?.addEventListener('click', () => setComposer(document.getElementById('composer').classList.contains('collapsed'), true));
  $('#cbar')?.addEventListener('keydown', (e: { key: string; preventDefault: () => void; currentTarget: { click: () => void; }; }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } });
  $('#docomment')?.addEventListener('click', async () => {
    const r = await act('comment', { body: S.draft.comment || '' }, 'comment'); if (r === undefined) return;
    delete S.draft.comment; S.cOpen = false; if (!addLocal('commented', r)) await refreshPr(r.id);
  });
  document.querySelectorAll('[data-sendreply]').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.sendreply, r = await act('reply', { id: +id, body: S.draft['reply-' + id] || '' }, 'reply-' + id); if (r === undefined) return;
    delete S.draft['reply-' + id]; if (!addLocal('reply', r, +id)) await refreshPr(r.id);
  }));
  document.querySelectorAll('.react-add').forEach((btn) => btn.addEventListener('click', (e: { stopPropagation: () => void; }) => {
    e.stopPropagation(); document.querySelector('.react-pop')?.remove();
    const pop = document.createElement('div'); pop.className = 'react-pop';
    pop.innerHTML = REACTS.map(([k, em]) => `<button data-c="${k}">${em}</button>`).join('');
    const r = btn.getBoundingClientRect(); pop.style.left = Math.min(r.left, innerWidth - 300) + 'px'; pop.style.top = Math.min(r.bottom + 4, innerHeight - 60) + 'px';
    document.body.appendChild(pop);
    pop.addEventListener('click', (ev) => { const c = ev.target.closest('[data-c]')?.dataset.c; if (!c) return; pop.remove(); toggleReact(btn.dataset.rk, btn.dataset.rid, c); });
    setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }), 0);
  }));
  document.querySelectorAll('.rc-btn').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rck, el.dataset.rcid)));
  document.querySelectorAll('.react-add').forEach((el) => el.addEventListener('mouseenter', () => getMine(el.dataset.rk, el.dataset.rid)));
  document.querySelectorAll('.rc-btn').forEach((el) => el.addEventListener('click', (e: { stopPropagation: () => void; }) => { e.stopPropagation(); toggleReact(el.dataset.rck, el.dataset.rcid, el.dataset.rcc); }));
  $('#doclose')?.addEventListener('click', () => {
    const closed = S.bundle.pull.state === 'closed';
    confirmDlg(closed ? 'Reopen this pull request?' : 'Close this pull request?', closed ? 'It will be open for review again.' : 'It will be closed without merging. You can reopen it later.', closed ? 'Reopen' : 'Close pull request', !closed, async () => { const r = await act(closed ? 'reopen' : 'close', {}, 'close'); if (r !== undefined) await refreshPr(); });
  });
  document.querySelectorAll('[data-mb]').forEach((el) => el.addEventListener('click', (e: { target: { closest: (arg0: string) => any; }; }) => { if (e.target.closest('#rerunck')) return; S.mbOpen = S.mbOpen || new Set(); const k = el.dataset.mb; S.mbOpen.has(k) ? S.mbOpen.delete(k) : S.mbOpen.add(k); rerender(); }));
  $('#rerunck')?.addEventListener('click', async (e: { stopPropagation: () => void; currentTarget: any; }) => { e.stopPropagation(); const urls = (S.bundle.checks || []).filter((c: { url: any; }) => checkState(c) === 'fail' && c.url).map((c: { url: any; }) => c.url); setBusy(e.currentTarget, true); const r = await act('rerun', { extra: urls }, 'rerun'); if (r !== undefined) { S.actErr = null; await refreshPr(); } else setBusy(e.currentTarget, false); });
  $('#updbranch')?.addEventListener('click', async () => { const r = await act('update_branch', {}, 'update_branch'); if (r !== undefined) await refreshPr(); });
  $('#doready')?.addEventListener('click', async () => { const r = await act('ready', {}, 'ready'); if (r !== undefined) await refreshPr(); });
  $('#todraft')?.addEventListener('click', () => confirmDlg('Convert to draft?', 'Reviewers keep their reviews, but the pull request cannot be merged until it is marked ready again.', 'Convert to draft', false, async () => { const r = await act('draft', {}, 'merge'); if (r !== undefined) await refreshPr(); }));
  $('#doauto')?.addEventListener('click', async () => { const r = await act('automerge', { method: $('#mmethod').value }, 'automerge'); if (r !== undefined) await refreshPr(); });
  $('#noauto')?.addEventListener('click', async () => { const r = await act('disable_automerge', {}, 'automerge'); if (r !== undefined) await refreshPr(); });
  $('#editpr')?.addEventListener('click', editPrDialog);
  $('#domerge')?.addEventListener('click', () => {
    const m = $('#mmethod').value, p = S.bundle.pull, names = { merge: 'merge commit', squash: 'squash and merge', rebase: 'rebase and merge' };
    confirmDlg('Merge this pull request?', `${p.head.label} will be merged into ${p.base.label} using ${names[m]}. This changes the repository and cannot be undone from here.`, 'Merge', false, async () => { const r = await act('merge', { method: m }, 'merge'); if (r !== undefined) await refreshPr(); });
  });
  $('#review')?.addEventListener('click', reviewDialog);
}
