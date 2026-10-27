import { attentionHtml, barsHtml, checksHtml, commitRowHtml, commitRunHtml, committedHtml, crossRefHtml, labelRowHtml, mergedRowHtml, referencedHtml, simpleHtml, tlWrapHtml } from '../components/Timeline';
import type { AttItem } from '../components/Timeline';
import type { Bundle, Check, CommentLike, Person, TimelineEvent, Verification } from '../types';
import { composer, mergeActions } from './actions';
import { commentBox } from './comments';
import { S, avatar, esc, icon, user, when } from './core';
import { reviewBlock } from './diff';
import { mergeBox } from './mergebox';
import { render } from './pages';

export function commitRow(msg: string, sha: string, author: Person | null, url: string, verification: Verification | undefined, trailing = '') {
  const first = String(msg || '').split('\n')[0];
  return commitRowHtml({ first, sha, author, url, verification, trailing });
}


export function rangeBounds() {
  const H = 3600e3, now = Date.now(), r = S.range;
  if (r === '1h') return [now - H, Infinity]; if (r === '24h') return [now - 24 * H, Infinity]; if (r === '7d') return [now - 7 * 24 * H, Infinity]; if (r === '30d') return [now - 30 * 24 * H, Infinity];
  if (r === 'custom') { const lo = S.rFrom ? new Date(S.rFrom + 'T00:00:00').getTime() : -Infinity, hi = S.rTo ? new Date(S.rTo + 'T23:59:59.999').getTime() : Infinity; return [lo, hi]; }
  return [-Infinity, Infinity];
}

export function timeline(b: Bundle) {
  const p = b.pull, out = [];
  const evUser = (e: TimelineEvent) => { const u = e.user || e.actor || e.author; return u?.login || (u as Person | undefined)?.name || ''; };
  const people = new Map<string, { u: Person; n: number }>(), bump = (u?: Person | null) => { if (!u?.login) return; const r = people.get(u.login) || { u, n: 0 }; r.n++; people.set(u.login, r); };
  bump(p.user); b.timeline.forEach((e) => { if (e.event === 'commented' || e.event === 'reviewed') bump(e.user); }); b.review_comments.forEach((c) => bump(c.user));
  S.who = S.who.filter((w) => people.has(w));
  const who = S.who, on = who.length > 0;
  const byUser = on ? b.timeline.filter((e) => who.includes(evUser(e)) || (e.event === 'reviewed' && b.review_comments.some((c) => c.pull_request_review_id === e.id && who.includes(c.user?.login)))) : b.timeline;
  const byKind = S.unres ? byUser.filter((e) => e.event === 'reviewed') : byUser;
  // Date filter: an event counts when its own time is in range; a review also counts when any of its comments or replies is.
  const evTime = (e: TimelineEvent) => e.created_at || e.submitted_at || e.committer?.date || e.author?.date || '';
  const [rLo, rHi] = rangeBounds(), rangeOn = S.range !== 'all';
  const inRange = (t: string) => { const x = t ? Date.parse(t) : NaN; return isNaN(x) || (x >= rLo && x <= rHi); };
  const keep = !rangeOn ? byKind : byKind.filter((e) => inRange(evTime(e)) || (e.event === 'reviewed' && b.review_comments.some((c) => c.pull_request_review_id === e.id && inRange(c.created_at)) ) || (e.event === 'reviewed' && b.review_comments.some((c) => inRange(c.created_at) && b.review_comments.some((r) => r.id === c.in_reply_to_id && r.pull_request_review_id === e.id))));
  const bars = barsHtml(people.size > 1 ? { everyone: !on, people: [...people.values()].sort((x, y) => y.n - x.n).map(({ u, n }) => ({ u, n, on: who.includes(u.login!) })) } : null, { range: S.range, from: S.rFrom, to: S.rTo, desc: S.sort === 'desc' });
  if (!S.unres && (!on || who.includes(p.user.login))) out.push(commentBox({ ...p, created_at: p.created_at, html_url: p.html_url, reactions: p.reactions }, { isPr: true }).replace('class="tl-comment"', 'class="tl-comment" style="margin-bottom:0"'));
  // Long runs of commits collapse into one row (the Commits tab lists them), so comments stay reachable.
  const evs = [];
  for (let i = 0; i < keep.length;) {
    let j = i; while (j < keep.length && keep[j].event === 'committed') j++;
    if (j - i >= 6) { evs.push({ event: 'commit-run', n: j - i, first: keep[i], last: keep[j - 1] }); i = j; } else { evs.push(keep[i]); i++; }
  }
  if (S.sort === 'desc') evs.reverse();
  const info = b.commit_info || {};
  let merged = false;
  for (const e of evs) {
    switch (e.event) {
      case 'commented': out.push(commentBox(e as CommentLike)); break;
      case 'commit-run': out.push(commitRunHtml({ n: e.n!, first: e.first!.sha!.slice(0, 7), last: e.last!.sha!.slice(0, 7) })); break;
      case 'reviewed': out.push(reviewBlock(e, b)); break;
      case 'committed': out.push(committedHtml(commitRow(e.message!, e.sha!, info[e.sha!]?.author || (e.author?.avatar_url ? e.author : null), e.html_url!, e.verification))); break;
      case 'referenced': {
        const ci = info[e.commit_id!];
        const ml = ci ? ci.message.split('\n')[0] : '';
        const linked = esc(ml).replace(/#(\d+)/, '</a><a href="#" style="color:var(--fgColor-accent)">#$1</a><a href="#">');
        out.push(referencedHtml({ actor: e.actor, at: e.created_at!, commit: ci ? { author: ci.author, html_url: ci.html_url, sha: ci.sha } : null, linked }));
        break;
      }
      case 'merged': merged = true; out.push(mergedRowHtml({ actor: e.actor, commit: (e.commit_id || '').slice(0, 7), base: p.base.label ?? '', at: e.created_at! })); out.push('<div class="TLI-break"></div>'); break;
      case 'closed': if (!p.merged) out.push(simple(e, 'git-pull-request-closed', 'closed this', 'danger')); break;
      case 'reopened': out.push(simple(e, 'git-pull-request', 'reopened this', 'success')); break;
      case 'cross-referenced': {
        const i = e.source?.issue; if (!i) break;
        const isPr = !!i.pull_request;
        out.push(crossRefHtml({ actor: e.actor, at: e.created_at!, isPr, open: i.state === 'open', icon: isPr ? (i.state === 'open' ? 'git-pull-request' : 'git-merge') : 'issue-opened', url: i.html_url, title: i.title.split('\n')[0].slice(0, 120), repo: i.repository?.full_name || '', number: i.number }));
        break;
      }
      case 'labeled': case 'unlabeled': out.push(labelRowHtml({ actor: e.actor, verb: e.event === 'labeled' ? 'added' : 'removed', color: e.label?.color ?? '', name: e.label?.name ?? '', at: e.created_at! })); break;
      case 'assigned': case 'unassigned': out.push(simple(e, 'person', `${e.event} ${e.assignee ? esc(e.assignee.login) : ''}`)); break;
      case 'review_requested': out.push(simple(e, 'eye', `requested a review from ${esc(e.requested_reviewer?.login || e.requested_team?.name || '')}`)); break;
      case 'renamed': out.push(simple(e, 'pencil', `changed the title <s>${esc(e.rename?.from)}</s> ${esc(e.rename?.to)}`)); break;
      case 'head_ref_force_pushed': out.push(simple(e, 'repo-push', 'force-pushed the head branch')); break;
      case 'head_ref_deleted': out.push(simple(e, 'git-branch', 'deleted the head branch')); break;
      case 'ready_for_review': out.push(simple(e, 'eye', 'marked this pull request as ready for review')); break;
      case 'convert_to_draft': out.push(simple(e, 'git-pull-request-draft', 'marked this pull request as draft')); break;
      case 'milestoned': out.push(simple(e, 'milestone', `added this to the ${esc(e.milestone?.title)} milestone`)); break;
      case 'locked': out.push(simple(e, 'lock', 'locked this conversation')); break;
      default: break; // subscribed, unsubscribed, mentioned: hidden by GitHub as well
    }
  }
  return tlWrapHtml({ bars, rows: out.join(''), empty: !evs.length && (on || rangeOn) ? (rangeOn ? 'No activity in this period.' : 'Nothing from the selected accounts.') : '', tail: `${on ? '' : mergeBox(b)}${mergeActions(b)}${composer(b)}` });
}

export const checkState = (c: Check) => (c.status !== 'completed' ? 'pending' : c.conclusion === 'success' ? 'pass' : ['skipped', 'neutral'].includes(c.conclusion!) ? 'skip' : 'fail');

export const CK: Record<string, [string, string]> = { pass: ['check-circle-fill', 'Passed'], fail: ['x-circle-fill', 'Failed'], pending: ['dot-fill', 'In progress'], skip: ['circle-slash', 'Skipped'] };

export const reqBadge = (c: Check) => ((S.bundle?.required_checks || []).includes(c.name) ? '<span class="ck-req" title="Required by branch protection">Required</span>' : '');

export function checksView(b: Bundle) {
  const list = (b.checks || []).map((c) => ({ ...c, st: checkState(c) }));
  if (!list.length) return '<div class="diff-empty">No checks reported for the latest commit.</div>';
  const n = (s: string) => list.filter((c) => c.st === s).length;
  const rank: Record<string, number> = { fail: 0, pending: 1, pass: 2, skip: 3 };
  list.sort((x, y) => rank[x.st] - rank[y.st] || String(x.name).localeCompare(String(y.name)));
  const head = n('fail') ? ['fail', `${n('fail')} failing`] : n('pending') ? ['pending', `${n('pending')} in progress`] : ['pass', 'All checks passed'];
  const dur = (c: Check) => { const s = Date.parse(c.started_at!), e = Date.parse(c.completed_at!); if (!s || !e || e < s) return ''; const t = Math.round((e - s) / 1000); return t >= 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t}s`; };
  const rows = list.map((c) => ({ name: c.name, st: c.st, url: c.url, desc: c.description || (c.app ? c.app : ''), req: (S.bundle?.required_checks || []).includes(c.name), status: c.st === 'fail' && c.conclusion && c.conclusion !== 'failure' ? c.conclusion.replace(/_/g, ' ') : CK[c.st][1], dur: dur(c), icon: CK[c.st][0] }));
  return checksHtml({ head: [head[0], head[1]] as [string, string], headIcon: CK[head[0]][0], summary: [n('fail') && `${n('fail')} failing`, n('pending') && `${n('pending')} in progress`, n('pass') && `${n('pass')} passed`, n('skip') && `${n('skip')} skipped`].filter(Boolean).join(' · '), rows });
}


export function unresolvedRoots(b: Bundle) {
  const res = new Set(b.resolved_ids || []);
  return b.review_comments.filter((c) => !c.in_reply_to_id && !res.has(c.id));
}

export function attention(b: Bundle) {
  const p = b.pull, rc = b.review_comments, roots = rc.filter((c) => !c.in_reply_to_id), open = unresolvedRoots(b);
  const known = S.hasToken || (b.resolved_ids || []).length > 0;
  const latest = new Map();
  b.timeline.filter((e) => e.event === 'reviewed' && e.user).forEach((e) => { const st = e.state!.toLowerCase(); if (st === 'commented' && latest.has(e.user!.login)) return; latest.set(e.user!.login, st); });
  const cr = [...latest.values()].filter((s) => s === 'changes_requested').length, ap = [...latest.values()].filter((s) => s === 'approved').length;
  const ck = (b.checks || []).map(checkState), fail = ck.filter((s) => s === 'fail').length, pend = ck.filter((s) => s === 'pending').length, pass = ck.filter((s) => s === 'pass').length;
  const it: AttItem[] = [];
  const add = (k: string, ic: string, text: string, attr: Partial<AttItem> = {}) => it.push({ k, ic, text, ...attr });
  if (roots.length) {
    if (!known) add('', 'comment', `${roots.length} review thread${roots.length === 1 ? '' : 's'}`);
    else if (open.length) add('bad', 'comment', `${open.length} unresolved thread${open.length === 1 ? '' : 's'}`, { id: 'nextun', title: 'Jump to the next unresolved thread' });
    else add('ok', 'check-circle-fill', 'All threads resolved');
  }
  add(cr ? 'bad' : ap ? 'ok' : '', cr ? 'file-diff' : ap ? 'check' : 'eye', cr ? `${cr} requesting changes` : ap ? `${ap} approved` : 'No approvals yet');
  if (ck.length) add(fail ? 'bad' : pend ? 'warn' : 'ok', fail ? 'x-circle-fill' : pend ? 'dot-fill' : 'check-circle-fill', fail ? `${fail} check${fail === 1 ? '' : 's'} failing` : pend ? `${pend} check${pend === 1 ? '' : 's'} running` : `${pass} check${pass === 1 ? '' : 's'} passed`, { dataTab: 'checks', title: 'Open checks' });
  if (p.merged) add('done', 'git-merge', 'Merged'); else if (p.state === 'closed') add('bad', 'git-pull-request-closed', 'Closed');
  else if (p.mergeable === false || p.mergeable_state === 'dirty') add('bad', 'alert', 'Has conflicts');
  else if (p.mergeable_state === 'clean') add('ok', 'git-merge', 'Ready to merge');
  else if (p.draft) add('', 'git-pull-request-draft', 'Draft');
  return attentionHtml({ items: it, unres: S.unres, showUnres: roots.length > 0 });
}

export function jumpUnresolved() {
  const b = S.bundle, list = unresolvedRoots(b!); if (!list.length) return;
  const c = list[S.unIdx % list.length]; S.unIdx++;
  const first = b!.review_comments.find((x) => x.pull_request_review_id === c.pull_request_review_id && x.path === c.path && (x.original_position ?? x.position) === (c.original_position ?? c.position)) || c;
  S.fold['r:' + c.pull_request_review_id] = false; S.fold['t:' + first.id] = false; S.fold['c:' + c.id] = false;
  localStorage.setItem('fold', JSON.stringify(S.fold));
  S.keepScroll = true; render(); S.keepScroll = false;
  const el = document.getElementById('c-' + c.id);
  if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
}


export function simple(e: TimelineEvent, ic: string, text: string, kind = '') {
  return simpleHtml({ actor: e.actor, ic, text, kind, at: e.created_at! });
}
