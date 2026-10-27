import { errLine } from './actions';
import { foldBtn, folded } from './comments';
import { S, avatar, esc, icon, tauri, when } from './core';
import { diffTable, pendList } from './diff';
import { render } from './pages';
import { CK, attention, checkState, commitRow, reqBadge, timeline } from './timeline';

export function mergeBox(b) {
  const p = b.pull;
  const head = p.head.label.split(':')[1];
  if (p.merged) {
    return `<div class="TL"><div class="TLI-break" style="margin-left:0"></div><div class="merge-box"><div class="badge"><span class="state-merged" style="background:var(--bgColor-done-emphasis)">${icon('git-merge')}</span></div><div class="merge-card merged-card"><div class="row"><div><h3>Pull request successfully merged and closed</h3><p style="font-size:14px;margin-top:4px">You're all set — the <span class="branch">${esc(head)}</span> branch can be safely deleted.</p></div></div></div></div></div>`;
  }
  if (p.state === 'closed') {
    return `<div class="merge-box"><div class="badge"><span class="state-closed" style="background:var(--bgColor-closed-emphasis, var(--bgColor-danger-emphasis))">${icon('git-pull-request-closed')}</span></div><div class="merge-card"><div class="row"><div><h3>Closed with unmerged commits</h3><p style="font-size:14px;margin-top:4px">This pull request is closed, but the <span class="branch">${esc(head)}</span> branch has unmerged commits.</p></div></div></div></div>`;
  }
  const clean = p.mergeable_state === 'clean' || p.mergeable !== false;
  const latest = new Map();
  b.timeline.filter((e) => e.event === 'reviewed' && e.user).forEach((e) => { const st = e.state.toLowerCase(); if (st === 'commented' && latest.has(e.user.login)) return; latest.set(e.user.login, st); });
  const ap = [...latest.values()].filter((x) => x === 'approved').length, cr = [...latest.values()].filter((x) => x === 'changes_requested').length, pendRev = (p.requested_reviewers || []).length;
  const rvHead = cr ? ['bad', 'x-circle-fill', 'Changes requested', `${cr} reviewer${cr === 1 ? '' : 's'} requested changes`] : ap ? ['ok', 'check-circle-fill', 'Changes approved', `${ap} approving review${ap === 1 ? '' : 's'}`] : ['', 'eye', 'Review not yet submitted', pendRev ? `${pendRev} pending review${pendRev === 1 ? '' : 's'}` : 'No reviews yet'];
  const list = (b.checks || []).map((c) => ({ ...c, st: checkState(c) })), cnt = (k) => list.filter((c) => c.st === k).length;
  const ckHead = cnt('fail') ? ['bad', 'x-circle-fill', `${cnt('fail')} check${cnt('fail') === 1 ? '' : 's'} failing`] : cnt('pending') ? ['', 'dot-fill', `${cnt('pending')} check${cnt('pending') === 1 ? '' : 's'} in progress`] : ['ok', 'check-circle-fill', 'All checks have passed'];
  const ckSub = [cnt('skip') && `${cnt('skip')} neutral`, cnt('pass') && `${cnt('pass')} successful`, cnt('fail') && `${cnt('fail')} failing`, cnt('pending') && `${cnt('pending')} pending`].filter(Boolean).join(', ');
  const grp = (k, title) => { const g = list.filter((c) => c.st === k); if (!g.length) return ''; const open = S.mbOpen?.has('g' + k) ?? k !== 'pass';
    return `<button class="mb-grp" data-mb="g${k}">${title} ${icon(open ? 'chevron-up' : 'chevron-down', 12)}</button>${open ? g.map((c) => `<a class="mb-ck ${c.st}" ${c.url ? `href="${esc(c.url)}"` : ''}>${icon(CK[c.st][0], 14)}<b>${esc(c.name)}</b>${reqBadge(c)}<i>${esc(c.description || c.app || '')}</i></a>`).join('') : ''}`; };
  const rerunable = list.some((c) => c.st === 'fail' && /\/actions\/runs\//.test(c.url || ''));
  const sec = (k, h, body) => { const open = S.mbOpen?.has(k); return `<div class="mb-sec"><button class="mb-h ${h[0]}" data-mb="${k}"><span class="mb-ic">${icon(h[1], 22)}</span><span class="mb-t"><b>${h[2]}</b><i>${h[3] || ''}</i></span>${k === 'ck' && rerunable ? '<span class="btn small" id="rerunck" role="button">Re-run failed</span>' : ''}${icon(open ? 'chevron-up' : 'chevron-down', 16)}</button>${open && body ? `<div class="mb-body">${body}</div>` : ''}</div>`; };
  const rvBody = `<div class="mb-line">${icon('check', 14)} ${ap} approval${ap === 1 ? '' : 's'}</div>${cr ? `<div class="mb-line bad">${icon('x-circle-fill', 14)} ${cr} requested changes</div>` : ''}<div class="mb-line">${icon('person', 14)} ${pendRev} pending review${pendRev === 1 ? '' : 's'}${pendRev ? `: ${p.requested_reviewers.map((u) => esc(u.login)).join(', ')}` : ''}</div>`;
  const behind = p.mergeable_state === 'behind';
  const upd = behind ? `<div class="mb-sec mb-warn"><div class="mb-h"><span class="mb-ic">${icon('alert', 22)}</span><span class="mb-t"><b>This branch is out-of-date with the base branch</b><i>Merge the latest changes from ${esc(p.base.ref)} into this branch.</i></span><button class="btn" id="updbranch">${S.busy === 'update_branch' ? 'Updating…' : 'Update branch'}</button></div></div>` : '';
  const st = p.draft ? `<div class="mb-sec"><div class="mb-h"><span class="mb-ic">${icon('git-pull-request-draft', 22)}</span><span class="mb-t"><b>This pull request is still a work in progress</b><i>Draft pull requests cannot be merged.</i></span><button class="btn primary" id="doready">${S.busy === 'ready' ? 'Updating…' : 'Ready for review'}</button></div></div>${errLine('ready')}` : '';
  const conf = `<div class="mb-sec"><div class="mb-h ${clean ? 'ok' : 'bad'}"><span class="mb-ic">${icon(clean ? 'check-circle-fill' : 'alert', 22)}</span><span class="mb-t"><b>${clean ? 'This branch has no conflicts with the base branch' : 'This branch has conflicts that must be resolved'}</b><i>${clean ? 'Merging can be performed automatically.' : 'Use the web editor or the command line to resolve conflicts.'}</i></span></div></div>`;
  return `<div class="merge-box"><div class="badge"><span style="background:var(--bgColor-success-emphasis)">${icon('git-pull-request')}</span></div><div class="merge-card mb-card">${st}${sec('rv', rvHead, rvBody)}${list.length ? sec('ck', ckHead.concat(ckSub), grp('fail', 'Failing checks') + grp('pending', 'In progress') + grp('skip', 'Neutral checks') + grp('pass', 'Successful checks')) : ''}${upd}${conf}${errLine('update_branch')}</div></div>`;
}


export function sidebar(b) {
  const p = b.pull;
  const reviewers = new Map();
  p.requested_reviewers.forEach((u) => reviewers.set(u.login, { u, st: 'req' }));
  b.timeline.filter((e) => e.event === 'reviewed').forEach((e) => { const st = e.state.toLowerCase(); const cur = reviewers.get(e.user.login); if (cur?.st === 'req') { if (!cur.prev || st === 'approved' || st === 'changes_requested') cur.prev = st; } else if (!cur || st === 'approved' || st === 'changes_requested') reviewers.set(e.user.login, { u: e.user, st }); });
  const rv = [...reviewers.values()];
  const canRe = !p.merged && p.state === 'open';
  const rvHtml = (r) => `<div class="reviewer"><a href="${esc(r.u.html_url)}">${avatar(r.u, 20)}</a><a class="nm" href="${esc(r.u.html_url)}">${esc(r.u.login)}</a><span class="st ${r.st === 'approved' ? 'ok' : r.st === 'changes_requested' ? 'bad' : ''}">${r.st === 'req' && r.prev ? `<span title="Asked to review again" style="margin-right:6px">${icon('sync')}</span>${icon(r.prev === 'approved' ? 'check' : r.prev === 'changes_requested' ? 'file-diff' : 'comment')}` : icon(r.st === 'approved' ? 'check' : r.st === 'changes_requested' ? 'file-diff' : r.st === 'req' ? 'dot-fill' : 'comment')}</span>${canRe && r.st !== 'req' && r.u.login !== p.user.login ? `<button class="rerequest" data-rerequest="${esc(r.u.login)}" title="Ask ${esc(r.u.login)} to review again">${icon('sync')}</button>` : ''}</div>`;
  const first = rv.length > 1 ? `<button class="sb-toggle" id="rvtoggle"><span>${rv.length - 0} reviewers</span>${icon(S.showAllReviewers ? 'chevron-up' : 'chevron-down')}</button>` : '';
  const rvSection = rv.length ? `${rv.slice(0, 3).map(rvHtml).join('')}${rv.length > 3 ? `<button class="sb-toggle" id="rvtoggle"><span>+${rv.length - 3} more reviewer${rv.length - 3 === 1 ? '' : 's'}</span>${icon(S.showAllReviewers ? 'chevron-up' : 'chevron-down')}</button>${S.showAllReviewers ? rv.slice(3).map(rvHtml).join('') : ''}` : ''}` : '<div class="sb-none">No reviews</div>';
  const people = new Map();
  [p.user, ...b.timeline.map((e) => e.user || e.actor || e.author)].forEach((u) => u && u.login && !people.has(u.login) && people.set(u.login, u));
  const labels = p.labels.length ? p.labels.map((l) => `<span class="pill-label" style="background:#${esc(l.color)}33;color:#${esc(l.color)};border-color:#${esc(l.color)}">${esc(l.name)}</span>`).join('') : '<span class="sb-none">None yet</span>';
  const assignees = p.assignees.length ? p.assignees.map((u) => `<div class="reviewer"><a href="${esc(u.html_url)}">${avatar(u, 20)}</a><a class="nm" href="${esc(u.html_url)}">${esc(u.login)}</a></div>`).join('') : '<span class="sb-none">No one—</span>';
  const head = (t) => `<div class="sb-head">${foldBtn('sb:' + t, 'Hide section')}<span>${t}</span>${icon('gear', 16, 'gear')}</div>`;
  const item = (k, inner) => `<div class="sb-item${folded('sb:' + k)}">${inner}</div>`;
  return `<div class="pr-side-inner">${item('Reviewers', `<div class="sb-head">${foldBtn('sb:Reviewers', 'Hide section')}<span>Reviewers</span></div>${rvSection}`)}
  ${item('Assignees', head('Assignees') + assignees)}
  ${item('Labels', head('Labels') + labels)}
  ${item('Milestone', head('Milestone') + (p.milestone ? `<a class="sb-link" href="${esc(p.milestone.html_url)}">${esc(p.milestone.title)}</a>` : '<span class="sb-none">No milestone</span>'))}
  <div class="sb-item${folded('sb:people')}"><div class="sb-head">${foldBtn('sb:people', 'Hide section')}<span>${people.size} participant${people.size === 1 ? '' : 's'}</span></div><div class="participants">${[...people.values()].slice(0, 30).map((u) => `<a href="${esc(u.html_url)}" title="${esc(u.login)}">${avatar(u, 32)}</a>`).join('')}</div></div></div>`;
}


// Files changed can show all commits, one commit, or a consecutive range (indices into commitList, oldest first).
export const frKey = (cs, r) => r.a === r.b ? cs[r.a].sha : `${cs[r.a].parent}..${cs[r.b].sha}`;

export function frDiff(b) {
  const cs = commitList(b), r = S.fr; if (!r || !cs[r.a] || !cs[r.b]) return b.files;
  return r.a === r.b ? S.cdiff[cs[r.a].sha] : S.rdiff[frKey(cs, r)];
}

export async function loadFr() {
  const b = S.bundle, r = S.fr; if (!b || !r) return;
  const cs = commitList(b), single = r.a === r.b, k = frKey(cs, r), store = single ? S.cdiff : S.rdiff, repo = b.pull.base.repo.full_name;
  if (store[k] !== undefined && store[k] !== 'loading') return;
  store[k] = 'loading'; render();
  try {
    if (!tauri) throw new Error('Per-commit diffs are available in the desktop app.');
    if (!single && !cs[r.a].parent) throw new Error('This range has no parent commit to compare against.');
    store[k] = (single ? await tauri.invoke('fetch_commit', { repo, sha: k }) : await tauri.invoke('fetch_range', { repo, base: cs[r.a].parent, head: cs[r.b].sha })).files || [];
  } catch (e) { store[k] = String(e).replace(/^Error: /, ''); }
  render();
}

export function setFr(r) { S.fr = r; S.dialog = ''; render(); loadFr(); }

export function sinceReview(b) {
  const cs = commitList(b), mine = b.timeline.filter((e) => e.event === 'reviewed' && e.user?.login === S.me && e.commit_id);
  if (!S.me || !mine.length) return null;
  const at = cs.findIndex((c) => c.sha === mine[mine.length - 1].commit_id);
  return at < 0 ? null : { at, n: cs.length - 1 - at };
}

export function commitsDialog() {
  const b = S.bundle, cs = commitList(b), pick = S.cpick || S.fr, sr = sinceReview(b);
  const on = (i) => pick && i >= pick.a && i <= pick.b;
  const rows = cs.map((c, i) => `<label class="cp-row${on(i) ? ' on' : ''}" data-cp="${i}"><input type="checkbox" ${on(i) ? 'checked' : ''} tabindex="-1"><span class="cp-t"><b>${esc(String(c.message).split('\n')[0])}</b><i>${esc(c.name || c.author?.login || '')} committed ${when(c.date).replace(/<\/?span[^>]*>/g, '')}</i></span><code>${esc(c.sha.slice(0, 7))}</code></label>`).reverse().join('');
  const q = (S.cfilter || '').toLowerCase();
  return `<div class="dlg-bg" id="dlgbg"><div class="dlg cp-dlg"><div class="cp-h"><h2>Select commits to view</h2><button class="icon-btn" id="cpx" title="Close">${icon('x')}</button></div>
  <button class="cp-opt${S.fr ? '' : ' on'}" id="cpall"><b>All commits</b><i>${cs.length} commit${cs.length === 1 ? '' : 's'}</i></button>
  ${sr ? `<button class="cp-opt${S.fr && S.fr.a === sr.at + 1 && S.fr.b === cs.length - 1 ? ' on' : ''}" id="cpsince" ${sr.n ? '' : 'disabled'}><b>Changes since your last review</b><i>${sr.n ? `${sr.n} commit${sr.n === 1 ? '' : 's'}` : 'No new commits'}</i></button>` : ''}
  <div class="cp-sub">Select a commit, or click a second one to view the range between them</div>
  <input class="input cp-q" id="cpq" placeholder="Filter commits…" value="${esc(S.cfilter || '')}">
  <div class="cp-list" id="cplist" data-q="${esc(q)}">${rows}</div>
  <div class="btns"><span class="cp-sel">${pick ? (pick.a === pick.b ? '1 commit selected' : `${pick.b - pick.a + 1} commits selected`) : 'Nothing selected'}</span><span class="sp"></span><button class="btn" id="cpcancel">Cancel</button><button class="btn primary" id="cpsave" ${pick ? '' : 'disabled'}>Save</button></div></div></div>`;
}

export function openCommits() { S.cpick = S.fr ? { ...S.fr } : null; S.cfilter = ''; S.dialog = commitsDialog(); render(); }

export function filesView(b) {
  const cs = commitList(b), r = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = r && r.a === r.b;
  const label = !r ? `All commits <span class="counter">${cs.length}</span>` : single ? `Commit <code>${esc(cs[r.a].sha.slice(0, 7))}</code>` : `${r.b - r.a + 1} commits <code>${esc(cs[r.a].sha.slice(0, 7))}…${esc(cs[r.b].sha.slice(0, 7))}</code>`;
  const nav = single ? `<div class="seg-ctl"><button data-fstep="-1" ${r.a <= 0 ? 'disabled' : ''}>‹ Prev</button><button data-fstep="1" ${r.a >= cs.length - 1 ? 'disabled' : ''}>Next ›</button></div>` : '';
  const bar = `<div class="fc-bar"><button class="btn small" id="fcbtn" title="Choose which commits to view">${icon('git-commit')} ${label} ▾</button>${nav}${r ? `<span class="fc-t">${single ? esc(String(cs[r.a].message).split('\n')[0]) : ''}</span><button class="link-btn" id="fcall">Show all commits</button>` : ''}</div>`;
  if (!r) return bar + filesList(b.files, true);
  const d = frDiff(b);
  return bar + (d === undefined || d === 'loading' ? '<div class="diff-empty">Loading…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d));
}

export const b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === 'open';

export function filesList(files, canComment = false) {
  if (!files.length) return '<div class="diff-empty">No files changed.</div>';
    const pid = S.bundle?.pull?.id;
  const hasC = (f) => (S.bundle?.review_comments || []).some((c) => c.path === f.filename) || pendList().some((p) => p.path === f.filename);
  // Big PRs open with the heavy files collapsed (like GitHub); a folded file renders no rows at all until it is opened.
  if (S.autoFoldFor !== pid) {
    S.autoFoldFor = pid; let budget = 1200;
    for (const f of files) { const n = f.additions + f.deletions, key = 'f:' + f.filename; if (key in S.fold || hasC(f)) continue; if (n > 400 || n > budget) S.fold[key] = true; else budget -= n; }
  }
  const shown = (f) => !S.fold['f:' + f.filename];
  const srt = S.fileSort || 'path', cnt = (f) => (S.bundle?.review_comments || []).filter((c) => c.path === f.filename && !c.in_reply_to_id).length;
  const so = { path: null, pathz: (x, y) => y.filename.localeCompare(x.filename), most: (x, y) => (y.additions + y.deletions) - (x.additions + x.deletions), least: (x, y) => (x.additions + x.deletions) - (y.additions + y.deletions), comments: (x, y) => cnt(y) - cnt(x), status: (x, y) => String(x.status).localeCompare(String(y.status)) || x.filename.localeCompare(y.filename) };
  if (so[srt]) files = [...files].sort(so[srt]);
  const all = files.every((f) => S.fold['f:' + f.filename]);
  return `<div class="files-bar"><div class="seg-ctl"><button class="${S.diffMode === 'unified' ? 'on' : ''}" data-dmode="unified">Unified</button><button class="${S.diffMode === 'split' ? 'on' : ''}" data-dmode="split">Split</button></div><select class="input fsort" id="fsort" title="Sort files">${[['path', 'GitHub order'], ['pathz', 'Path Z–A'], ['most', 'Most changed'], ['least', 'Least changed'], ['comments', 'Most comments'], ['status', 'By status']].map(([v, t]) => `<option value="${v}" ${srt === v ? 'selected' : ''}>${t}</option>`).join('')}</select>${pendList().length ? `<button class="btn small primary" id="finishrev">Finish review · ${pendList().length} comment${pendList().length === 1 ? '' : 's'}</button>` : ''}<button class="link-btn" data-foldall="${all ? 'open' : 'close'}" data-files="${esc(files.map((f) => f.filename).join('\n'))}">${all ? 'Expand all files' : 'Collapse all files'}</button></div>` + files.map((f, i) => {
    const t = f.additions + f.deletions || 1, a = Math.round((f.additions / t) * 5), d = Math.min(5 - a, Math.round((f.deletions / t) * 5));
    const sq = Array.from({ length: 5 }, (_, i) => `<i class="${i < a ? 'a' : i < a + d ? 'd' : ''}"></i>`).join('');
    return `<div class="file${folded('f:' + f.filename)}"><div class="file-head" data-fold="f:${esc(f.filename)}"><span class="tgl">${icon(S.fold['f:' + f.filename] ? 'chevron-right' : 'chevron-down')}</span><span class="stat"><span class="a">+${f.additions}</span> <span class="d">−${f.deletions}</span></span><span class="sq">${sq}</span><span class="path">${esc(f.filename)}</span></div>${!shown(f) ? '' : f.patch ? diffTable(f.patch, f.filename, canComment && b0open()) : '<div class="diff-empty">Binary file or diff too large to display.</div>'}</div>`;
  }).join('');
}


export function commitsView(b) {
  const info = b.commit_info || {};
  const c = b.timeline.filter((e) => e.event === 'committed');
  return `<div style="border:1px solid var(--borderColor-default);border-radius:6px">${c.map((e) => `<div style="padding:16px;border-bottom:1px solid var(--borderColor-muted)">${commitRow(e.message, e.sha, e.author?.avatar_url ? e.author : null, e.html_url, e.verification)}</div>`).join('') || '<div class="diff-empty">No commits listed.</div>'}</div>`;
}


export function commitList(b) {
  if (b.commits && b.commits.length) return b.commits.map((c) => ({ sha: c.sha, message: c.commit.message, author: c.author, name: c.commit.author?.name, date: c.commit.author?.date, url: c.html_url, parent: c.parents?.[0]?.sha }));
  return b.timeline.filter((e) => e.event === 'committed').map((e) => ({ sha: e.sha, message: e.message, author: e.author?.avatar_url ? e.author : null, name: e.author?.name, date: e.author?.date, url: e.html_url }));
}


S.flip = localStorage.getItem('flip') === '1';

export function flipSides() { S.flip = !S.flip; localStorage.setItem('flip', S.flip ? '1' : '0'); document.querySelector('.split')?.classList.toggle('flip', S.flip); }

export function splitView(b) {
  const cs = commitList(b), sha = S.sel;
  const cnt = (c) => b.review_comments.filter((r) => r.original_commit_id === c || r.commit_id === c).length;
  const row = (c) => `<div class="cm ${sha === c.sha ? 'on' : ''}" data-sha="${esc(c.sha)}"><span class="cm-av">${c.author ? avatar(c.author, 24) : `<i>${esc((c.name || '?')[0])}</i>`}</span><span class="cm-t"><b>${esc(String(c.message).split('\n')[0])}</b><i>${esc(c.name || c.author?.login || '')} · ${when(c.date).replace(/<\/?span[^>]*>/g, '')}</i></span>${cnt(c.sha) ? `<span class="cm-n">${icon('comment')}${cnt(c.sha)}</span>` : ''}<code>${esc(c.sha.slice(0, 7))}</code></div>`;
  const all = `<div class="cm all ${sha ? '' : 'on'}" data-sha=""><span class="cm-av"><i>${icon('diff')}</i></span><span class="cm-t"><b>All changes</b><i>${b.pull.changed_files} files · +${b.pull.additions} −${b.pull.deletions}</i></span></div>`;
  let diff;
  if (!sha) diff = filesList(b.files, true);
  else {
    const d = S.cdiff[sha];
    diff = d === undefined || d === 'loading' ? '<div class="diff-empty">Loading commit…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d);
  }
  const hl = S.hide.l, hr = S.hide.r;
  const rail = (k, label, ic) => `<button class="pane-rail" data-show="${k}" title="Show ${label}">${icon(ic)}<span>${label}</span></button>`;
  const left = hl ? rail('l', 'Commits', 'git-commit') : `<section class="pane pane-l"><div class="fold-sec${folded('cm-list')}"><div class="pane-h">${icon('git-commit')}<span>Commits</span><span class="counter">${cs.length}</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">⇄</button>${foldBtn('cm-list', 'Collapse commit list')}<button class="fold-btn" data-hide="l" title="Hide this panel">${icon('x')}</button></div><div class="cm-list">${all}${cs.map(row).join('')}</div></div><div class="fold-sec${folded('cm-diff')}"><div class="pane-h sub">${icon('file-diff')}<span>${sha ? 'Commit ' + esc(sha.slice(0, 7)) : 'All changes'}</span><span class="sp"></span>${foldBtn('cm-diff', 'Collapse changes')}</div><div class="pane-body">${diff}</div></div></section>`;
  const right = hr ? rail('r', 'Conversation', 'comment-discussion') : `<section class="pane pane-r"><div class="pane-h">${icon('comment-discussion')}<span>Conversation</span><span class="sp"></span><button class="fold-btn flip-btn" data-flip title="Swap sides (F)">⇄</button><button class="fold-btn" data-hide="r" title="Hide this panel">${icon('x')}</button></div><div class="pane-body">${attention(b)}${timeline(b)}</div></section>`;
  return `<div class="split ${hl ? 'hl' : ''} ${hr ? 'hr' : ''} ${S.flip ? 'flip' : ''}" style="--lw:${S.lw}%">${left}${hl || hr ? '' : '<div class="gutter" id="gutter" title="Drag to resize"></div>'}${right}</div>`;
}


export async function selectCommit(sha) {
  S.sel = sha || null; render();
  if (!sha || S.cdiff[sha] !== undefined) return;
  S.cdiff[sha] = 'loading';
  try {
    if (!tauri) throw new Error('Per-commit diffs are available in the desktop app.');
    S.cdiff[sha] = (await tauri.invoke('fetch_commit', { repo: S.bundle.pull.base.repo.full_name, sha })).files || [];
  } catch (e) { S.cdiff[sha] = String(e).replace(/^Error: /, ''); }
  if (S.sel === sha) render();
}
