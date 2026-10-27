import type { ComponentChildren } from 'preact';
import { Bars, CommitRow, CommitRun, Committed, CrossRef, FoldBar, LabelRow, MergedRow, Simple, attentionHtml, checksHtml, commitRowHtml, referencedHtml } from '../components/Timeline';
import type { AttItem, BarHandlers, CommitRowProps, CrossRefProps, RangeBarProps, SimpleProps, WhoBarProps } from '../components/Timeline';
import { Composer, MergeAct } from '../components/Actions';
import type { ComposerHandlers, ComposerProps, MergeActHandlers, MergeActProps } from '../components/Actions';
import { ClosedBox, MergeBox, MergedBox } from '../components/Merge';
import type { MergeBoxHandlers } from '../components/Merge';
import { html } from '../components/html';
import { Island } from '../components/ui';
import { CommentBox } from '../components/Comments';
import { ReviewBlock } from '../components/Diff';
import type { Bundle, Check, CommentLike, Person, TimelineEvent, Verification } from '../types';
import { composerProps, mergeActProps } from './actions';
import { commentBoxProps } from './comments';
import type { CommentBoxProps, ConvHandlers } from '../components/Comments';
import { S, esc } from './core';
import { reviewBlockProps } from './diff';
import type { ReviewBlockProps } from '../components/Diff';
import { mergeModel } from './mergebox';
import type { MergeModel } from './mergebox';
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

// Rows hold prebuilt HTML for comment boxes and reviews (still string views); everything else is data for live components.
export type TlRow =
  | { t: 'html'; h: string }
  | { t: 'comment'; p: CommentBoxProps }
  | { t: 'review'; p: ReviewBlockProps }
  | { t: 'run'; n: number; first: string; last: string }
  | { t: 'committed'; row: CommitRowProps }
  | { t: 'merged'; actor: Person | null | undefined; commit: string; base: string; at: string }
  | { t: 'brk' }
  | { t: 'cross'; p: CrossRefProps }
  | { t: 'label'; actor: Person | null | undefined; verb: string; color: string; name: string; at: string }
  | { t: 'simple'; p: SimpleProps };
export interface TlModel { who: WhoBarProps | null; range: RangeBarProps; rows: TlRow[]; empty: string; merge: MergeModel | null; act: MergeActProps | null; composer: ComposerProps }

export function timelineModel(b: Bundle): TlModel {
  const p = b.pull, out: TlRow[] = [], htm = (h: string) => out.push({ t: 'html', h });
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
  if (!S.unres && (!on || who.includes(p.user.login))) out.push({ t: 'comment', p: commentBoxProps({ ...p, created_at: p.created_at, html_url: p.html_url, reactions: p.reactions }, { isPr: true, flush: true }) });
  // Long runs of commits collapse into one row (the Commits tab lists them), so comments stay reachable.
  const evs = [];
  for (let i = 0; i < keep.length;) {
    let j = i; while (j < keep.length && keep[j].event === 'committed') j++;
    if (j - i >= 6) { evs.push({ event: 'commit-run', n: j - i, first: keep[i], last: keep[j - 1] }); i = j; } else { evs.push(keep[i]); i++; }
  }
  if (S.sort === 'desc') evs.reverse();
  const info = b.commit_info || {};
  const simpleRow = (e: TimelineEvent, ic: string, text: ComponentChildren, kind = '') => out.push({ t: 'simple', p: { actor: e.actor, ic, text, kind, at: e.created_at! } });
  for (const e of evs) {
    switch (e.event) {
      case 'commented': out.push({ t: 'comment', p: commentBoxProps(e as CommentLike) }); break;
      case 'commit-run': out.push({ t: 'run', n: e.n!, first: e.first!.sha!.slice(0, 7), last: e.last!.sha!.slice(0, 7) }); break;
      case 'reviewed': { const rp = reviewBlockProps(e, b); if (rp) out.push({ t: 'review', p: rp }); break; }
      case 'committed': out.push({ t: 'committed', row: { first: String(e.message || '').split('\n')[0], sha: e.sha!, author: info[e.sha!]?.author || (e.author?.avatar_url ? e.author : null), url: e.html_url!, verification: e.verification, trailing: '' } }); break;
      case 'referenced': {
        const ci = info[e.commit_id!];
        const ml = ci ? ci.message.split('\n')[0] : '';
        const linked = esc(ml).replace(/#(\d+)/, '</a><a href="#" style="color:var(--fgColor-accent)">#$1</a><a href="#">');
        htm(referencedHtml({ actor: e.actor, at: e.created_at!, commit: ci ? { author: ci.author, html_url: ci.html_url, sha: ci.sha } : null, linked }));
        break;
      }
      case 'merged': out.push({ t: 'merged', actor: e.actor, commit: (e.commit_id || '').slice(0, 7), base: p.base.label ?? '', at: e.created_at! }, { t: 'brk' }); break;
      case 'closed': if (!p.merged) simpleRow(e, 'git-pull-request-closed', 'closed this', 'danger'); break;
      case 'reopened': simpleRow(e, 'git-pull-request', 'reopened this', 'success'); break;
      case 'cross-referenced': {
        const i = e.source?.issue; if (!i) break;
        const isPr = !!i.pull_request;
        out.push({ t: 'cross', p: { actor: e.actor, at: e.created_at!, isPr, open: i.state === 'open', icon: isPr ? (i.state === 'open' ? 'git-pull-request' : 'git-merge') : 'issue-opened', url: i.html_url, title: i.title.split('\n')[0].slice(0, 120), repo: i.repository?.full_name || '', number: i.number } });
        break;
      }
      case 'labeled': case 'unlabeled': out.push({ t: 'label', actor: e.actor, verb: e.event === 'labeled' ? 'added' : 'removed', color: e.label?.color ?? '', name: e.label?.name ?? '', at: e.created_at! }); break;
      case 'assigned': case 'unassigned': simpleRow(e, 'person', `${e.event} ${e.assignee ? e.assignee.login : ''}`); break;
      case 'review_requested': simpleRow(e, 'eye', `requested a review from ${e.requested_reviewer?.login || e.requested_team?.name || ''}`); break;
      case 'renamed': simpleRow(e, 'pencil', <>changed the title <s>{e.rename?.from}</s> {e.rename?.to}</>); break;
      case 'head_ref_force_pushed': simpleRow(e, 'repo-push', 'force-pushed the head branch'); break;
      case 'head_ref_deleted': simpleRow(e, 'git-branch', 'deleted the head branch'); break;
      case 'ready_for_review': simpleRow(e, 'eye', 'marked this pull request as ready for review'); break;
      case 'convert_to_draft': simpleRow(e, 'git-pull-request-draft', 'marked this pull request as draft'); break;
      case 'milestoned': simpleRow(e, 'milestone', `added this to the ${e.milestone?.title ?? ''} milestone`); break;
      case 'locked': simpleRow(e, 'lock', 'locked this conversation'); break;
      default: break; // subscribed, unsubscribed, mentioned: hidden by GitHub as well
    }
  }
  return {
    who: people.size > 1 ? { everyone: !on, people: [...people.values()].sort((x, y) => y.n - x.n).map(({ u, n }) => ({ u, n, on: who.includes(u.login!) })) } : null,
    range: { range: S.range, from: S.rFrom, to: S.rTo, desc: S.sort === 'desc' },
    rows: out, empty: !evs.length && (on || rangeOn) ? (rangeOn ? 'No activity in this period.' : 'Nothing from the selected accounts.') : '',
    merge: on ? null : mergeModel(b), act: mergeActProps(b), composer: composerProps(b),
  };
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

export function attentionProps(b: Bundle) {
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
  return { items: it, unres: S.unres, showUnres: roots.length > 0 };
}
export const attention = (b: Bundle) => attentionHtml(attentionProps(b));

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



export interface TlHandlers { conv: ConvHandlers; bars: BarHandlers; foldAll: () => void; tab: (k: string) => void; merge: MergeBoxHandlers; act: MergeActHandlers; composer: ComposerHandlers }

function Row({ r, on }: { r: TlRow; on?: TlHandlers }) {
  switch (r.t) {
    case 'html': return <Island html={r.h} />;
    case 'comment': return <CommentBox {...r.p} on={on?.conv} />;
    case 'review': return <ReviewBlock {...r.p} on={on?.conv} />;
    case 'run': return <CommitRun n={r.n} first={r.first} last={r.last} onTab={on?.tab} />;
    case 'committed': return <Committed row={<CommitRow {...r.row} />} />;
    case 'merged': return <MergedRow actor={r.actor} commit={r.commit} base={r.base} at={r.at} />;
    case 'brk': return <div class="TLI-break"></div>;
    case 'cross': return <CrossRef {...r.p} />;
    case 'label': return <LabelRow actor={r.actor} verb={r.verb} color={r.color} name={r.name} at={r.at} />;
    case 'simple': return <Simple {...r.p} />;
  }
}

export function Timeline({ m, on }: { m: TlModel; on?: TlHandlers }) {
  const box = m.merge && (m.merge.kind === 'merged' ? <MergedBox head={m.merge.head} /> : m.merge.kind === 'closed' ? <ClosedBox head={m.merge.head} /> : <MergeBox {...m.merge.p} on={on?.merge} />);
  return <>
    <Bars who={m.who} range={m.range} on={on?.bars} /><FoldBar onClick={on?.foldAll} />
    <div class="TL">{m.rows.map((r) => <Row r={r} on={on} />)}{m.empty ? <div class="diff-empty">{m.empty}</div> : ''}</div>
    {box}{m.act ? <MergeAct {...m.act} on={on?.act} /> : ''}<Composer {...m.composer} on={on?.composer} />
  </>;
}

export const timeline = (b: Bundle) => html(<Timeline m={timelineModel(b)} />);
