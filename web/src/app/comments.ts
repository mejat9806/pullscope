import { act, prRef } from './actions';
import { ASSOC, REACTS, S, avatar, esc, icon, tauri, when } from './core';
import { qc } from './data';

export function stateOf(p) {
  if (p.merged) return ['merged', 'git-merge', 'Merged'];
  if (p.state === 'closed') return ['closed', 'git-pull-request-closed', 'Closed'];
  if (p.draft) return ['draft', 'git-pull-request-draft', 'Draft'];
  return ['open', 'git-pull-request', 'Open'];
}


export function prHeader(b) {
  const p = b.pull, [st, ic, label] = stateOf(p), n = p.number;
  const commentsTotal = p.comments + p.review_comments + b.timeline.filter((e) => e.event === 'reviewed').length;
  const sq = (() => { const t = p.additions + p.deletions || 1; const small = t <= 5; const a = small ? p.additions : Math.round((p.additions / t) * 5); const d = small ? p.deletions : 5 - a; const arr = []; for (let i = 0; i < 5; i++) arr.push(i < a ? 'a' : i < a + d ? 'd' : ''); return arr.map((c) => `<i class="${c}"></i>`).join(''); })();
  const who = st === 'merged' ? `<a class="author" style="text-decoration:underline;text-underline-offset:2px" href="${esc(p.merged_by.html_url)}">${esc(p.merged_by.login)}</a> merged ${p.commits} commit${p.commits === 1 ? '' : 's'} into` : `<a class="author" href="${esc(p.user.html_url)}">${esc(p.user.login)}</a> wants to merge ${p.commits} commit${p.commits === 1 ? '' : 's'} into`;
  const at = st === 'merged' ? p.merged_at : st === 'closed' ? p.closed_at : p.created_at;
  const splitOk = S.tab !== 'files' && S.tab !== 'checks' && S.tab !== 'timeline';
  const tabs = [['conversation', 'comment-discussion', 'Conversation', commentsTotal + 0], ['timeline', 'clock', 'Timeline', b.timeline.length],['commits', 'git-commit', 'Commits', p.commits], ['checks', 'checklist', 'Checks', (b.checks || []).length], ['files', 'file-diff', 'Files changed', p.changed_files]];
  return `<div class="pr-title-area"><h1 class="pr-title"><span>${esc(p.title)}</span><span class="num">#${n}</span>${p.state === 'open' && !p.merged ? `<button class="copy-btn" id="editpr" title="Edit title and description">${icon('pencil')}</button>` : ''}</h1>
  <div class="pr-meta"><span class="state-pill state-${st}">${icon(ic)} ${label}</span><span>${who}</span> <span class="branch" title="${esc(p.base.repo.full_name)}:${esc(p.base.ref)}">${esc(p.base.label)}</span> <span>from</span> <span class="branch">${esc(p.head.label)}</span><button class="copy-btn" id="copybranch" aria-label="Copy head branch name to clipboard">${icon('copy')}</button><span>${when(at)}</span></div></div>
  <div class="pr-tabs"><span class="mini" title="${esc(p.title)}"><b>#${n}</b> ${esc(p.title)}</span><nav>${tabs.map(([k, i, t, c]) => `<a data-tab="${k}" class="${S.tab === k || (k === 'commits' && false) ? 'sel' : ''}">${icon(i)}${t}<span class="counter">${c}</span></a>`).join('')}</nav>
  <div class="tools"><button class="split-btn" id="review" title="Submit a review">${icon('eye')}<span>Review</span></button><button class="split-btn ${S.hide.side || S.split ? '' : 'on'}" id="sidetoggle" title="Show or hide the details panel" ${S.tab !== 'conversation' || S.split ? 'disabled' : ''} style="${S.tab !== 'conversation' ? 'visibility:hidden' : ''}">${icon('sidebar-expand')}<span>Details</span></button><button class="split-btn ${splitOk && S.split ? 'on' : ''}" id="split" title="${splitOk ? 'Split view: commits beside conversation' : 'Split view is available on the Conversation and Commits tabs'}" ${splitOk ? '' : 'disabled'}>${icon('columns')}<span>Split view</span></button><div class="diffstat"><span class="add">+${p.additions}</span><span class="del">-${p.deletions}</span><span class="sq">${sq}</span></div></div></div>`;
}


export const isFolded = (k, def = false) => (k in S.fold ? S.fold[k] : def);

export const folded = (k, def = false) => (isFolded(k, def) ? ' folded' : '');

export const foldBtn = (k, title = 'Collapse / expand', def = false) => `<button class="fold-btn" data-fold="${esc(k)}" data-def="${def ? 1 : 0}" title="${title}">${icon(isFolded(k, def) ? 'chevron-right' : 'chevron-down')}</button>`;


export function reactionsHtml(r, kind, id) {
  r = r || {};
  const items = REACTS.filter(([k]) => r[k] > 0).map(([k, e]) => `<span class="reaction${kind && id ? ' rc-btn' : ''}" ${kind && id ? `data-rck="${kind}" data-rcid="${id}" data-rcc="${k}" title="Click to add or remove your reaction"` : ''}><span class="e">${e}</span><span>${r[k]}</span></span>`);
  const add = kind && id ? `<span class="react-wrap"><button class="react-add" data-rk="${kind}" data-rid="${id}" title="Add reaction">${icon('smiley')}</button></span>` : '';
  return items.length || add ? `<div class="reactions">${items.join('')}${add}</div>` : '';
}


export const liveTasks = (h) => S.hasToken ? h.replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m) => m.replace(/\sdisabled(="[^"]*")?/g, '')) : h;

export function toggleTask(body, n) {
  let i = -1, fence = false;
  return body.split('\n').map((l) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return l; }
    if (fence) return l;
    return l.replace(/^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/, (m, a, x, z) => (++i === n ? a + (x === ' ' ? 'x' : ' ') + z : m));
  }).join('\n');
}

document.addEventListener('click', async (e) => {
  const cb = e.target.closest?.('input.task-list-item-checkbox'); if (!cb || cb.disabled || !S.bundle) return;
  const box = cb.closest('.tl-comment'), md = cb.closest('.markdown-body'); if (!box || !md) return;
  const id = box.id.replace(/^c-/, ''), b = S.bundle;
  const c = String(b.pull.id) === id ? b.pull : b.timeline.find((x) => String(x.id) === id); if (!c) return;
  const n = [...md.querySelectorAll('input.task-list-item-checkbox')].indexOf(cb), body = toggleTask(c.body || '', n);
  if (body === (c.body || '')) { e.preventDefault(); return; }
  const on = cb.checked; // the browser has already flipped it; keep that, undo only if saving fails
  const r = c === b.pull ? await act('edit', { body, extra: {} }, 'task', true) : await act('edit_comment', { id: c.id, kind: 'issue_comment', body }, 'task', true);
  if (r === undefined) { cb.checked = !on; alert(`Couldn't update the checkbox: ${S.actErr?.m || 'unknown error'}`); return; }
  c.body = body; let i = -1;
  c.body_html = (c.body_html || '').replace(/<input[^>]*task-list-item-checkbox[^>]*>/g, (m) => (++i === n ? (on ? (/\schecked/.test(m) ? m : m.replace(/<input/, '<input checked')) : m.replace(/\schecked(="[^"]*")?/, '')) : m));
  const key = `${prRef().repo}#${prRef().number}`; qc.set(key, b); qc.m.get(key).at = Date.now() - 20000;
  tauri?.invoke('invalidate_pr', { url: key }).catch(() => {});
});

export function commentBox(c, { isPr = false } = {}) {
  const u = c.user || c.actor;
  const assoc = ASSOC[c.author_association];
  const body = c.body_html && c.body_html.trim() ? `<div class="markdown-body">${liveTasks(c.body_html)}</div>` : '<span class="empty">No description provided.</span>';
  return `<div class="tl-comment${folded('c:' + c.id)}" id="c-${esc(c.id ?? '')}"><div class="avatar-col"><a href="${esc(u?.html_url)}">${avatar(u, 40)}</a></div>
  <div class="cbox"><div class="chead"><div>${foldBtn('c:' + c.id, 'Hide this comment')} <a class="author u" href="${esc(u?.html_url)}"><span class="author" style="font-weight:600;color:var(--fgColor-default)">${esc(u?.login || 'ghost')}</span></a> ${isPr ? 'commented' : 'commented'} <a class="ts" href="${esc(c.html_url || '#')}">${when(c.created_at || c.submitted_at)}</a></div>
  <div class="rt">${assoc ? `<span class="assoc">${assoc}</span>` : ''}<button class="cm-btn" data-cm="${esc(c.id)}" title="Comment actions">⋯</button></div></div>
  <div class="cbody">${body}</div>${reactionsHtml(c.reactions, isPr ? 'pr' : 'issue_comment', c.id)}</div></div>`;
}


export function diffHunkTable(hunk) {
  const rows = []; let o = 0, n = 0;
  for (const line of hunk.split('\n')) {
    if (line.startsWith('@@')) { const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)/); if (m) { o = +m[1]; n = +m[2]; } rows.push(`<tr class="hunk"><td class="num">…</td><td class="num">…</td><td class="code">${esc(line)}</td></tr>`); continue; }
    const t = line[0], txt = line.slice(1);
    if (t === '+') rows.push(`<tr class="add"><td class="num"></td><td class="num">${n++}</td><td class="code" data-marker="+">${esc(txt)}</td></tr>`);
    else if (t === '-') rows.push(`<tr class="del"><td class="num">${o++}</td><td class="num"></td><td class="code" data-marker="-">${esc(txt)}</td></tr>`);
    else if (t === '\\') rows.push(`<tr><td class="num"></td><td class="num"></td><td class="code" style="color:var(--fgColor-muted)">${esc(line)}</td></tr>`);
    else rows.push(`<tr><td class="num">${o++}</td><td class="num">${n++}</td><td class="code" data-marker=" ">${esc(txt)}</td></tr>`);
  }
  return `<table class="diff"><colgroup><col style="width:50px"><col style="width:50px"><col></colgroup>${rows.join('')}</table>`;
}
