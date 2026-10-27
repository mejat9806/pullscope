import type { Bundle, CommitRow, FileChange, FrRange, Reviewer, User } from '../types';
import { closedBoxHtml, commitsDialogHtml, commitsListHtml, fcBarHtml, fileBoxHtml, filesBarHtml, mergeBoxHtml, mergedBoxHtml, splitViewHtml } from '../components/Merge';
import type { CkGroup, PrSideProps } from '../components/Merge';
import { errLine } from './actions';
import { foldBtn, folded, isFolded } from './comments';
import { S, avatar, esc, icon, tauri, when, $ } from './core';
import { diffTable, pendList } from './diff';
import { render } from './pages';
import { CK, attention, checkState, commitRow, reqBadge, timeline } from './timeline';

export function mergeBox(b: Bundle) {
  const p = b.pull;
  const head = p.head.label!.split(':')[1];
  if (p.merged) return mergedBoxHtml(head);
  if (p.state === 'closed') return closedBoxHtml(head);
  const clean = p.mergeable_state === 'clean' || p.mergeable !== false;
  const latest = new Map();
  b.timeline.filter((e) => e.event === 'reviewed' && e.user).forEach((e) => { const st = e.state!.toLowerCase(); if (st === 'commented' && latest.has(e.user!.login)) return; latest.set(e.user!.login, st); });
  const ap = [...latest.values()].filter((x) => x === 'approved').length, cr = [...latest.values()].filter((x) => x === 'changes_requested').length, pendRev = (p.requested_reviewers || []).length;
  const rvHead = cr ? ['bad', 'x-circle-fill', 'Changes requested', `${cr} reviewer${cr === 1 ? '' : 's'} requested changes`] : ap ? ['ok', 'check-circle-fill', 'Changes approved', `${ap} approving review${ap === 1 ? '' : 's'}`] : ['', 'eye', 'Review not yet submitted', pendRev ? `${pendRev} pending review${pendRev === 1 ? '' : 's'}` : 'No reviews yet'];
  const list = (b.checks || []).map((c) => ({ ...c, st: checkState(c) })), cnt = (k: string) => list.filter((c) => c.st === k).length;
  const ckHead = cnt('fail') ? ['bad', 'x-circle-fill', `${cnt('fail')} check${cnt('fail') === 1 ? '' : 's'} failing`] : cnt('pending') ? ['', 'dot-fill', `${cnt('pending')} check${cnt('pending') === 1 ? '' : 's'} in progress`] : ['ok', 'check-circle-fill', 'All checks have passed'];
  const ckSub = [cnt('skip') && `${cnt('skip')} neutral`, cnt('pass') && `${cnt('pass')} successful`, cnt('fail') && `${cnt('fail')} failing`, cnt('pending') && `${cnt('pending')} pending`].filter(Boolean).join(', ');
  const grp = (k: string, title: string): CkGroup[] => { const g = list.filter((c) => c.st === k); if (!g.length) return []; const open = S.mbOpen?.has('g' + k) ?? k !== 'pass';
    return [{ k, title, open, items: g.map((c) => ({ st: c.st, url: c.url, icon: CK[c.st][0], name: c.name, req: reqBadge(c), desc: c.description || c.app || '' })) }]; };
  return mergeBoxHtml({
    draft: !!p.draft, busyReady: S.busy === 'ready', errReady: errLine('ready'),
    rv: { h: rvHead, open: !!S.mbOpen?.has('rv'), ap, cr, pend: pendRev, pendNames: (p.requested_reviewers || []).map((u) => u.login).join(', ') },
    ck: list.length ? { h: ckHead.concat(ckSub), open: !!S.mbOpen?.has('ck'), rerunable: list.some((c) => c.st === 'fail' && /\/actions\/runs\//.test(c.url || '')), groups: [...grp('fail', 'Failing checks'), ...grp('pending', 'In progress'), ...grp('skip', 'Neutral checks'), ...grp('pass', 'Successful checks')] } : null,
    behind: p.mergeable_state === 'behind', busyUpdate: S.busy === 'update_branch', baseRef: p.base.ref, errUpdate: errLine('update_branch'), clean,
  });
}


export function sidebarProps(b: Bundle): PrSideProps {
  const p = b.pull;
  const reviewers = new Map<string, Reviewer>();
  p.requested_reviewers.forEach((u) => reviewers.set(u.login, { u, st: 'req' }));
  b.timeline.filter((e) => e.event === 'reviewed').forEach((e) => { const st = e.state!.toLowerCase(); const cur = reviewers.get(e.user!.login); if (cur?.st === 'req') { if (!cur.prev || st === 'approved' || st === 'changes_requested') cur.prev = st; } else if (!cur || st === 'approved' || st === 'changes_requested') reviewers.set(e.user!.login, { u: e.user!, st }); });
  const canRe = !p.merged && p.state === 'open';
  const rv = [...reviewers.values()].map((r) => ({ ...r, canRe: canRe && r.st !== 'req' && r.u.login !== p.user.login }));
  const people = new Map<string, User>();
  [p.user, ...b.timeline.map((e) => e.user || e.actor || e.author)].forEach((u) => u && u.login && !people.has(u.login) && people.set(u.login, u as User));
  return {
    reviewers: rv, showAll: !!S.showAllReviewers, assignees: p.assignees, labels: p.labels, milestone: p.milestone ?? null,
    people: [...people.values()].slice(0, 30), peopleCount: people.size,
    folded: { reviewers: isFolded('sb:Reviewers'), assignees: isFolded('sb:Assignees'), labels: isFolded('sb:Labels'), milestone: isFolded('sb:Milestone'), people: isFolded('sb:people') },
  };
}


// Files changed can show all commits, one commit, or a consecutive range (indices into commitList, oldest first).
export const frKey = (cs: CommitRow[], r: FrRange) => r.a === r.b ? cs[r.a].sha : `${cs[r.a].parent}..${cs[r.b].sha}`;

export function frDiff(b: Bundle) {
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
    store[k] = (single ? await tauri!.invoke('fetch_commit', { repo, sha: k }) : await tauri!.invoke('fetch_range', { repo, base: cs[r.a].parent, head: cs[r.b].sha })).files || [];
  } catch (e) { store[k] = String(e).replace(/^Error: /, ''); }
  render();
}

export function setFr(r: FrRange | null) { S.fr = r; S.dialog = ''; render(); loadFr(); }

export function sinceReview(b: Bundle) {
  const cs = commitList(b), mine = b.timeline.filter((e) => e.event === 'reviewed' && e.user?.login === S.me && e.commit_id);
  if (!S.me || !mine.length) return null;
  const at = cs.findIndex((c) => c.sha === mine[mine.length - 1].commit_id);
  return at < 0 ? null : { at, n: cs.length - 1 - at };
}

export function commitsDialog() {
  const b = S.bundle, cs = commitList(b!), pick = S.cpick || S.fr, sr = sinceReview(b!);
  const on = (i: number) => !!pick && i >= pick.a && i <= pick.b;
  return commitsDialogHtml({
    rows: cs.map((c, i) => ({ i, on: on(i), title: String(c.message).split('\n')[0], by: c.name || c.author?.login || '', when: when(c.date!).replace(/<\/?span[^>]*>/g, ''), sha: c.sha!.slice(0, 7) })),
    count: cs.length, allOn: !S.fr,
    since: sr ? { on: !!S.fr && S.fr.a === sr.at + 1 && S.fr.b === cs.length - 1, n: sr.n } : null,
    filter: S.cfilter || '', q: (S.cfilter || '').toLowerCase(),
    selLabel: pick ? (pick.a === pick.b ? '1 commit selected' : `${pick.b - pick.a + 1} commits selected`) : 'Nothing selected', hasPick: !!pick,
  });
}

export function openCommits() { S.cpick = S.fr ? { ...S.fr } : null; S.cfilter = ''; S.dialog = commitsDialog(); render(); }

export function filesView(b: Bundle) {
  const cs = commitList(b), r = S.fr && cs[S.fr.a] && cs[S.fr.b] ? S.fr : null, single = !!r && r.a === r.b;
  const sh = (i: number) => cs[i]!.sha.slice(0, 7);
  const bar = fcBarHtml({
    label: !r ? 'All commits' : single ? 'Commit' : `${r.b - r.a + 1} commits`, count: !r ? cs.length : null,
    code: !r ? null : single ? sh(r.a) : `${sh(r.a)}…${sh(r.b)}`,
    nav: single ? { prevOff: r!.a <= 0, nextOff: r!.a >= cs.length - 1 } : null,
    title: r && single ? String(cs[r.a].message).split('\n')[0] : '', hasRange: !!r,
  });
  if (!r) return bar + filesList(b.files, true);
  const d = frDiff(b);
  return bar + (d === undefined || d === 'loading' ? '<div class="diff-empty">Loading…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d));
}

export const b0open = () => !!S.bundle && !S.bundle.pull.merged && S.bundle.pull.state === 'open';

export function filesList(files: FileChange[], canComment = false) {
  if (!files.length) return '<div class="diff-empty">No files changed.</div>';
    const pid = S.bundle?.pull?.id;
  const hasC = (f: FileChange) => (S.bundle?.review_comments || []).some((c) => c.path === f.filename) || pendList().some((p) => p.path === f.filename);
  // Big PRs open with the heavy files collapsed (like GitHub); a folded file renders no rows at all until it is opened.
  if (S.autoFoldFor !== pid) {
    S.autoFoldFor = pid; let budget = 1200;
    for (const f of files) { const n = f.additions + f.deletions, key = 'f:' + f.filename; if (key in S.fold || hasC(f)) continue; if (n > 400 || n > budget) S.fold[key] = true; else budget -= n; }
  }
  const shown = (f: FileChange) => !S.fold['f:' + f.filename];
  const srt = S.fileSort || 'path', cnt = (f: FileChange) => (S.bundle?.review_comments || []).filter((c) => c.path === f.filename && !c.in_reply_to_id).length;
  const so: Record<string, ((x: FileChange, y: FileChange) => number) | null> = { path: null, pathz: (x, y) => y.filename.localeCompare(x.filename), most: (x, y) => (y.additions + y.deletions) - (x.additions + x.deletions), least: (x, y) => (x.additions + x.deletions) - (y.additions + y.deletions), comments: (x, y) => cnt(y) - cnt(x), status: (x, y) => String(x.status).localeCompare(String(y.status)) || x.filename.localeCompare(y.filename) };
  const srtFn = so[srt]; if (srtFn) files = [...files].sort(srtFn);
  const all = files.every((f) => S.fold['f:' + f.filename]);
  return filesBarHtml({ mode: S.diffMode ?? '', sort: srt, pending: pendList().length, allFolded: all, names: files.map((f) => f.filename).join('\n') }) + files.map((f) => {
    const t = f.additions + f.deletions || 1, a = Math.round((f.additions / t) * 5), d = Math.min(5 - a, Math.round((f.deletions / t) * 5));
    const sq = Array.from({ length: 5 }, (_, i) => (i < a ? 'a' : i < a + d ? 'd' : ''));
    return fileBoxHtml({ name: f.filename, folded: folded('f:' + f.filename), closed: !!S.fold['f:' + f.filename], add: f.additions, del: f.deletions, sq, body: !shown(f) ? '' : f.patch ? diffTable(f.patch, f.filename, canComment && b0open()) : '<div class="diff-empty">Binary file or diff too large to display.</div>' });
  }).join('');
}

export function commitsView(b: Bundle) {
  const c = b.timeline.filter((e) => e.event === 'committed');
  return commitsListHtml(c.map((e) => commitRow(e.message!, e.sha!, e.author?.avatar_url ? e.author : null, e.html_url!, e.verification)));
}


export function commitList(b: Bundle): CommitRow[] {
  if (b.commits && b.commits.length) return b.commits.map((c) => ({ sha: c.sha, message: c.commit.message, author: c.author, name: c.commit.author?.name, date: c.commit.author?.date, url: c.html_url, parent: c.parents?.[0]?.sha }));
  return b.timeline.filter((e) => e.event === 'committed').map((e) => ({ sha: e.sha!, message: e.message!, author: e.author?.avatar_url ? (e.author as User) : null, name: e.author?.name, date: e.author?.date, url: e.html_url }));
}


S.flip = localStorage.getItem('flip') === '1';

export function flipSides() { S.flip = !S.flip; localStorage.setItem('flip', S.flip ? '1' : '0'); $('.split')?.classList.toggle('flip', S.flip); }

export function splitView(b: Bundle) {
  const cs = commitList(b), sha = S.sel;
  const cnt = (c: string) => b.review_comments.filter((r) => r.original_commit_id === c || r.commit_id === c).length;
  let diff;
  if (!sha) diff = filesList(b.files, true);
  else {
    const d = S.cdiff[sha];
    diff = d === undefined || d === 'loading' ? '<div class="diff-empty">Loading commit…</div>' : typeof d === 'string' ? `<div class="diff-empty err">${esc(d)}</div>` : filesList(d);
  }
  return splitViewHtml({
    hl: !!S.hide.l, hr: !!S.hide.r, flip: !!S.flip, lw: S.lw,
    allOn: !sha, allSub: `${b.pull.changed_files} files · +${b.pull.additions} −${b.pull.deletions}`,
    rows: cs.map((c) => ({ sha: c.sha, on: sha === c.sha, avatar: c.author ? avatar(c.author, 24) : '', initial: (c.name || '?')[0], title: String(c.message).split('\n')[0], sub: `${c.name || c.author?.login || ''} · ${when(c.date!).replace(/<\/?span[^>]*>/g, '')}`, n: cnt(c.sha) })),
    count: cs.length, subTitle: sha ? 'Commit ' + sha.slice(0, 7) : 'All changes',
    foldList: folded('cm-list'), foldDiff: folded('cm-diff'), foldBtnList: foldBtn('cm-list', 'Collapse commit list'), foldBtnDiff: foldBtn('cm-diff', 'Collapse changes'),
    diff, right: attention(b) + timeline(b),
  });
}


export async function selectCommit(sha: string) {
  S.sel = sha || null; render();
  if (!sha || S.cdiff[sha] !== undefined) return;
  S.cdiff[sha] = 'loading';
  try {
    if (!tauri) throw new Error('Per-commit diffs are available in the desktop app.');
    S.cdiff[sha] = (await tauri!.invoke('fetch_commit', { repo: S.bundle!.pull.base.repo.full_name, sha })).files || [];
  } catch (e) { S.cdiff[sha] = String(e).replace(/^Error: /, ''); }
  if (S.sel === sha) render();
}
