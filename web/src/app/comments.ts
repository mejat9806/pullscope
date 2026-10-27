import { commentBoxHtml, diffHunkTableHtml, foldBtnHtml, prHeaderHtml, reactionsBarHtml } from '../components/Comments';
import type { HunkRow } from '../components/Comments';
import type { Bundle, CommentLike, Pull, Reactions } from '../types';
import { act, prRef } from './actions';
import { ASSOC, REACTS, S, tauri } from './core';
import { qc } from './data';

export function stateOf(p: Pull) {
  if (p.merged) return ['merged', 'git-merge', 'Merged'];
  if (p.state === 'closed') return ['closed', 'git-pull-request-closed', 'Closed'];
  if (p.draft) return ['draft', 'git-pull-request-draft', 'Draft'];
  return ['open', 'git-pull-request', 'Open'];
}


export function prHeader(b: Bundle) {
  const p = b.pull, [st, ic, label] = stateOf(p);
  const commentsTotal = p.comments + p.review_comments + b.timeline.filter((e) => e.event === 'reviewed').length;
  const sq = (() => { const t = p.additions + p.deletions || 1; const small = t <= 5; const a = small ? p.additions : Math.round((p.additions / t) * 5); const d = small ? p.deletions : 5 - a; const arr = []; for (let i = 0; i < 5; i++) arr.push(i < a ? 'a' : i < a + d ? 'd' : ''); return arr; })();
  const splitOk = S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline';
  return prHeaderHtml({ b, st, ic, label, tab: S.tab, split: S.split, hideSide: !!S.hide.side, splitOk, commentsTotal, sq });
}


export const isFolded = (k: string, def = false) => (k in S.fold ? S.fold[k] : def);

export const folded = (k: string, def = false) => (isFolded(k, def) ? ' folded' : '');

export const foldBtn = (k: string, title = 'Collapse / expand', def = false) => foldBtnHtml({ k, title, def, folded: isFolded(k, def) });


export function reactionsHtml(r: Reactions | undefined, kind: string, id: number) {
  return reactionsBarHtml({ r: r || {}, kind, id, defs: REACTS.map(([k, e]) => ({ k, e })) });
}


export const liveTasks = (h: string) => S.hasToken ? h.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m) => m.replace(/\sdisabled(="[^"]*")?/g, '')) : h;

export function toggleTask(body: string, n: number) {
  let i = -1, fence = false;
  return body.split('\n').map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return l; }
    if (fence) return l;
    return l.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/, (m, a, x, z) => (++i === n ? a + (x === ' ' ? 'x' : ' ') + z : m));
  }).join('\n');
}

document.addEventListener('click', async (e) => {
  const cb = (e.target as HTMLElement).closest<HTMLInputElement>('input.task-list-item-checkbox'); if (!cb || cb.disabled || !S.bundle) return;
  const box = cb.closest<HTMLElement>('.tl-comment'), md = cb.closest<HTMLElement>('.markdown-body'); if (!box || !md) return;
  const id = box.id.replace(/^c-/, ''), b = S.bundle;
  const c = String(b.pull.id) === id ? b.pull : b.timeline.find((x) => String(x.id) === id); if (!c) return;
  const n = [...md.querySelectorAll('input.task-list-item-checkbox')].indexOf(cb), body = toggleTask(c.body || '', n);
  if (body === (c.body || '')) { e.preventDefault(); return; }
  const on = cb.checked; // the browser has already flipped it; keep that, undo only if saving fails
  const r = c === b.pull ? await act('edit', { body, extra: {} }, 'task', true) : await act('edit_comment', { id: c.id, kind: 'issue_comment', body }, 'task', true);
  if (r === undefined) { cb.checked = !on; alert(`Couldn't update the checkbox: ${S.actErr?.m || 'unknown error'}`); return; }
  c.body = body; let i = -1;
  c.body_html = (c.body_html || '').replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m) => (++i === n ? (on ? (/\schecked/.test(m) ? m : m.replace(/<input/, '<input checked')) : m.replace(/\schecked(="[^"]*")?/, '')) : m));
  const key = `${prRef().repo}#${prRef().number}`; qc.set(key, b); qc.m.get(key)!.at = Date.now() - 20000;
  tauri?.invoke('invalidate_pr', { url: key }).catch(() => {});
});

export function commentBox(c: CommentLike, { isPr = false } = {}) {
  const body = c.body_html && c.body_html.trim() ? `<div class="markdown-body">${liveTasks(c.body_html)}</div>` : '<span class="empty">No description provided.</span>';
  return commentBoxHtml({ c, isPr, assoc: ASSOC[c.author_association ?? ''], body, folded: folded('c:' + c.id), foldHtml: foldBtn('c:' + c.id, 'Hide this comment'), reactions: reactionsHtml(c.reactions, isPr ? 'pr' : 'issue_comment', c.id!) });
}


export function diffHunkTable(hunk: string) {
  const rows: HunkRow[] = []; let o = 0, n = 0;
  for (const line of hunk.split('\n')) {
    if (line.startsWith('@@')) { const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/); if (m) { o = +m[1]; n = +m[2]; } rows.push({ kind: 'hunk', text: line }); continue; }
    const t = line[0], txt = line.slice(1);
    if (t === '+') rows.push({ kind: 'add', n: n++, text: txt });
    else if (t === '-') rows.push({ kind: 'del', o: o++, text: txt });
    else if (t === '\\') rows.push({ kind: 'meta', text: line });
    else rows.push({ kind: 'ctx', o: o++, n: n++, text: txt });
  }
  return diffHunkTableHtml(rows);
}
