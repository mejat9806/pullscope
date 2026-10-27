import type { Bundle, PendingComment, ReviewComment, TimelineEvent } from '../types';
import { draftBox, errLine } from './actions';
import { diffHunkTable, foldBtn, folded, isFolded, reactionsHtml } from './comments';
import { S, avatar, esc, icon, load, user, when } from './core';
import { b0open } from './mergebox';
import { lcCardsHtml, lcEditHtml, replyBoxHtml, reviewBlockHtml, sugBtnHtml, sugNoteHtml, tcHtml, threadRowHtml } from '../components/Diff';

// ---- File diffs: unified or side-by-side, syntax highlighted, with line comments for a draft review ----
S.diffMode = localStorage.getItem('diffmode') || 'unified';

S.pending = load<Record<string, PendingComment[]>>('pending', {});

export const pendKey = () => (S.bundle ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '');

export const pendList = () => S.pending![pendKey()] || [];

export const savePending = () => localStorage.setItem('pending', JSON.stringify(S.pending));

export function parsePatch(patch: string) {
  const rows = []; let o = 0, n = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('@@')) { const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/); if (m) { o = +m[1]; n = +m[2]; } rows.push({ t: 'hunk', text: line }); continue; }
    const c = line[0], txt = line.slice(1);
    if (c === '+') rows.push({ t: 'add', n: n++, text: txt });
    else if (c === '-') rows.push({ t: 'del', o: o++, text: txt });
    else if (c === '\\') rows.push({ t: 'note', text: line });
    else rows.push({ t: 'ctx', o: o++, n: n++, text: txt });
  }
  return rows;
}

export const codeHtml = (text: string, path: string) => (window.hlLine && window.hlLine(text, path)) ?? esc(text);

// "+" button + inline editor + saved draft comments for one line
export const lineKey = (path: string, line: number, side: 'LEFT' | 'RIGHT') => `${path}\u001f${side}\u001f${line}`;

// Pending comments are Markdown; show code fences (incl. suggestions) as blocks, everything else as plain text.
export const lcBody = (md: string) => String(md).split(/```/).map((p, i) => i % 2 ? (() => { const m = p.match(/^(\w*)\n?([\s\S]*)$/); return `<pre class="lc-code${m![1] === 'suggestion' ? ' sug' : ''}">${m![1] === 'suggestion' ? '<b>Suggested change</b>\n' : ''}${esc(m![2].replace(/\n$/, ''))}</pre>`; })() : esc(p).replace(/\n/g, '<br>')).join('');

// Existing review threads for one line, shown read-only under it (reply / resolve live in the Conversation tab).
export function threadsFor(path: string) { return (S.bundle?.review_comments || []).filter((c) => c.path === path); }

export function lineThreads(path: string, line: number, side: 'LEFT' | 'RIGHT', cols: number) {
  const all = threadsFor(path); if (!all.length) return '';
  const roots = all.filter((c) => !c.in_reply_to_id && (c.line ?? c.original_line) === line && (c.side || 'RIGHT') === side); if (!roots.length) return '';
  const res = new Set(S.bundle!.resolved_ids || []);
  const b = S.bundle, card = (c: ReviewComment, rootId: number) => tcHtml({ user: c.user, login: c.user?.login || 'ghost', at: c.created_at, id: c.id, root: rootId, withMenu: !!S.hasToken, body: c.body_html || esc(c.body || ''), reactions: reactionsHtml(c.reactions, 'review_comment', c.id), sug: '', anchorId: false });
  return roots.map((r) => {
    const isRes = res.has(r.id), tid = (b!.thread_ids || {})[r.id], list = [r, ...all.filter((c) => c.in_reply_to_id === r.id)];
    const act = tid && S.hasToken ? { tid, res: isRes } : null;
    const reply = S.hasToken ? replyBoxHtml(draftBox('reply-' + r.id, 'Write a reply', 2), errLine('reply-' + r.id), r.id) : '';
    return threadRowHtml({ cols, folded: folded('t:' + r.id, isRes), foldBtn: foldBtn('t:' + r.id, 'Hide this thread', isRes), side: side === 'LEFT' ? 'L' : 'R', line, outdated: r.line == null, resolved: isRes, cards: list.map((c) => card(c, r.id)), reply, act });
  }).join('');
}

export function lineExtras(path: string, line: number, side: 'LEFT' | 'RIGHT', cols: number, canComment: boolean, text?: string) {
  const k = lineKey(path, line, side), th = lineThreads(path, line, side, cols), mine = pendList().filter((c) => c.path === path && c.line === line && c.side === side);
  const cards = mine.length ? lcCardsHtml(mine.map((c) => ({ id: c.id, body: lcBody(c.body) }))) : '';
  const open = canComment && S.lcOpen === k ? lcEditHtml(draftBox('lc', 'Leave a comment on this line', 3), side === 'RIGHT' && text !== undefined ? text : null) : '';
  return th + (cards || open ? `<tr class="lc-row"><td colspan="${cols}"><div class="lc">${cards}${open}</div></td></tr>` : '');
}

// Built diff HTML is cached per file, so redraws, tab switches and returning to a PR do not rebuild thousands of rows.
export const diffCache = new Map();

export function diffTable(patch: string, path: string, canComment: boolean) {
  const open = S.lcOpen && String(S.lcOpen).includes(path);
  if (open) return diffTableBuild(patch, path, canComment);
  const key = `${window.hlLine ? 1 : 0}|${S.diffMode}|${canComment ? 1 : 0}|${path}|${JSON.stringify(pendList().filter((c) => c.path === path))}|${threadsFor(path).map((c) => c.id + ':' + (c.updated_at || '') + JSON.stringify(c.reactions || {}) + ((S.bundle!.resolved_ids || []).includes(c.id) ? 'r' : '') + (isFolded('t:' + c.id, (S.bundle!.resolved_ids || []).includes(c.id)) ? 'f' : '')).join(',')}|${S.hasToken ? 1 : 0}|${S.actErr && String(S.actErr.k).startsWith('reply-') ? S.actErr.k + S.actErr.m : ''}`, hit = diffCache.get(key);
  if (hit && hit.patch === patch) return hit.html;
  const html = diffTableBuild(patch, path, canComment);
  diffCache.set(key, { patch, html });
  if (diffCache.size > 400) diffCache.delete(diffCache.keys().next().value);
  return html;
}

export function diffTableBuild(patch: string, path: string, canComment: boolean) {
  const rows = parsePatch(patch), plus = (line: number, side: 'LEFT' | 'RIGHT') => canComment ? `<button class="lc-plus" data-lc="${esc(lineKey(path, line, side))}" title="Add a comment on this line">+</button>` : '';
  const out = [];
  if (S.diffMode === 'split') {
    let i = 0;
    while (i < rows.length) {
      const r = rows[i];
      if (r.t === 'hunk') { out.push(`<tr class="hunk"><td class="num"></td><td class="code" colspan="3">${esc(r.text)}</td></tr>`); i++; continue; }
      if (r.t === 'note') { i++; continue; }
      if (r.t === 'ctx') { out.push(`<tr><td class="num">${r.o}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td><td class="num">${r.n}${plus(r.n!, 'RIGHT')}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n!, 'RIGHT', 4, canComment, r.text)}`); i++; continue; }
      const dels = [], adds = [];
      while (rows[i] && rows[i].t === 'del') dels.push(rows[i++]);
      while (rows[i] && rows[i].t === 'add') adds.push(rows[i++]);
      for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
        const d = dels[k], a = adds[k];
        out.push(`<tr><td class="num${d ? ' del' : ' empty'}">${d ? d.o + plus(d.o!, 'LEFT') : ''}</td><td class="code${d ? ' del' : ' empty'}" ${d ? 'data-marker="-"' : ''}>${d ? codeHtml(d.text, path) : ''}</td><td class="num${a ? ' add' : ' empty'}">${a ? a.n + plus(a.n!, 'RIGHT') : ''}</td><td class="code${a ? ' add' : ' empty'}" ${a ? 'data-marker="+"' : ''}>${a ? codeHtml(a.text, path) : ''}</td></tr>${d ? lineExtras(path, d.o!, 'LEFT', 4, canComment) : ''}${a ? lineExtras(path, a.n!, 'RIGHT', 4, canComment, a.text) : ''}`);
      }
    }
    return chunkTables(out, 'diff sbs', '<colgroup><col style="width:64px"><col><col style="width:64px"><col></colgroup>');
  }
  for (const r of rows) {
    if (r.t === 'hunk') out.push(`<tr class="hunk"><td class="num">…</td><td class="num">…</td><td class="code">${esc(r.text)}</td></tr>`);
    else if (r.t === 'note') out.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(r.text)}</td></tr>`);
    else if (r.t === 'add') out.push(`<tr class="add"><td class="num"></td><td class="num">${r.n}${plus(r.n!, 'RIGHT')}</td><td class="code" data-marker="+">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n!, 'RIGHT', 3, canComment, r.text)}`);
    else if (r.t === 'del') out.push(`<tr class="del"><td class="num">${r.o}${plus(r.o!, 'LEFT')}</td><td class="num"></td><td class="code" data-marker="-">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.o!, 'LEFT', 3, canComment)}`);
    else out.push(`<tr><td class="num">${r.o}</td><td class="num">${r.n}${plus(r.n!, 'RIGHT')}</td><td class="code" data-marker=" ">${codeHtml(r.text, path)}</td></tr>${lineExtras(path, r.n!, 'RIGHT', 3, canComment, r.text)}`);
  }
  return chunkTables(out, 'diff', '<colgroup><col style="width:64px"><col style="width:64px"><col></colgroup>');
}

// Diffs render as one table per file (no lazy blocks: skipping off-screen rows made scrolling janky).
export function chunkTables(out: string[], cls: string, cols: string, size = Infinity) {
  if (out.length <= size) return `<table class="${cls}">${cols}${out.join('')}</table>`;
  let h = '';
  for (let i = 0; i < out.length; i += size) { const n = Math.min(size, out.length - i); h += `<div class="dchunk" style="contain-intrinsic-size:auto ${n * 22}px"><table class="${cls}">${cols}${out.slice(i, i + size).join('')}</table></div>`; }
  return h;
}



// ```suggestion blocks in a review comment can be applied as a commit on the PR branch
export const sugOf = (c: { body?: string | null }) => { const m = (c.body || '').match(/```suggestion[^\n]*\n([\s\S]*?)\n?```/); return m ? m[1] : null; };

export function suggestBtn(c: ReviewComment, b: Bundle, list: ReviewComment[]) {
  const t = sugOf(c); if (t !== null && S.applied?.has(String(c.id))) return sugNoteHtml('Applying suggestion…');
  if (t === null || !b0open() || list.some((x) => (b.resolved_ids || []).includes(x.id))) return '';
  const p = b.pull, mine = p.head.repo && !p.head.repo.fork || (p.head.repo && p.head.repo.full_name === p.base.repo.full_name);
  if (!c.line) return sugNoteHtml('Outdated suggestion — the lines have changed.');
  return sugBtnHtml(c.id, !p.head.repo, p.head.ref, !!mine);
}

export function reviewBlock(e: TimelineEvent, b: Bundle) {
  const resolved = new Set(b.resolved_ids || []), isRes = (list: ReviewComment[]) => list.some((c) => resolved.has(c.id));
  const stateMap: Record<string, string[]> = { approved: ['check', 'success', 'approved these changes'], changes_requested: ['file-diff', 'danger', 'requested changes'], commented: ['eye', '', 'reviewed'], dismissed: ['x', '', 'dismissed a review'] };
  const [ic, kind, verb] = stateMap[e.state!.toLowerCase()] || ['eye', '', 'reviewed'];
  const mine = b.review_comments.filter((c) => c.pull_request_review_id === e.id), mineIds = new Set(mine.map((c) => c.id));
  const cs = [...mine, ...b.review_comments.filter((c) => c.pull_request_review_id !== e.id && mineIds.has(c.in_reply_to_id!))].filter((c) => !S.who.length || S.who.includes(e.user?.login!) || S.who.includes(c.user?.login));
  const hasBody = e.body_html && e.body_html.trim();
  const byPath: Record<string, ReviewComment[]> = {};
  cs.forEach((c) => (byPath[`${c.path}\u0000${c.original_position ?? c.position}`] ||= []).push(c));
  const all = Object.values(byPath).map((l) => l.sort((x, y) => (x.in_reply_to_id ? 1 : 0) - (y.in_reply_to_id ? 1 : 0) || x.id - y.id)), allRes = all.length > 0 && all.every(isRes), nres = all.filter(isRes).length, rk = 'r:' + e.id;
  const lists = S.unres ? all.filter((l) => !isRes(l)) : all;
  if (S.unres && !lists.length) return '';
  const threads = lists.map((list) => ({
    folded: folded('t:' + list[0].id, isRes(list)), foldBtn: foldBtn('t:' + list[0].id, 'Hide this thread', isRes(list)), path: list[0].path, resolved: isRes(list), tid: (b.thread_ids || {})[list[0].id] ? b.thread_ids[list[0].id] : null,
    hunk: diffHunkTable(list[0].diff_hunk || ''),
    cards: list.map((c) => tcHtml({ user: c.user, login: c.user.login, at: c.created_at, id: c.id, root: list[0].id, withMenu: true, body: c.body_html || '', reactions: reactionsHtml(c.reactions, 'review_comment', c.id), sug: suggestBtn(c, b, list), anchorId: true })),
    reply: replyBoxHtml(draftBox('reply-' + list[0].id, 'Reply…', 2), errLine('reply-' + list[0].id), list[0].id),
  }));
  const sum = all.length ? { ok: allRes, allRes, text: `${all.length} thread${all.length === 1 ? '' : 's'}${nres ? ` · ${nres} resolved` : ''}` } : null;
  return reviewBlockHtml({ folded: folded(rk, allRes), kind, ic, avatar: avatar(e.user, 20), foldBtn: foldBtn(rk, 'Collapse / expand this review', allRes), who: user(e.user), verb, url: e.html_url ?? '', at: when(e.submitted_at!).replace(/<\/?span[^>]*>/g, ''), sum, bodyHtml: hasBody ? e.body_html! : '', threads });
}
