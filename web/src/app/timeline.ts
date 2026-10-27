import type { Bundle, Check, CommentLike, Person, TimelineEvent, Verification } from '../types';
import { composer, mergeActions } from './actions';
import { commentBox } from './comments';
import { S, avatar, esc, icon, user, when } from './core';
import { reviewBlock } from './diff';
import { mergeBox } from './mergebox';
import { render } from './pages';

export function commitRow(msg: string, sha: string, author: Person | null, url: string, verification: Verification | undefined, trailing = '') {
  const first = String(msg || '').split('\n')[0];
  const unv = verification && !verification.verified;
  return `<div class="commit-row">${author ? `<span class="TLI-avatar" style="margin-right:8px">${avatar(author, 20)}</span>` : ''}<span class="msg" style="flex:0 1 auto"><a href="${esc(url || '#')}">${esc(first)}</a></span>${trailing}<span class="cm-ic">${icon('comment')}</span><span style="flex:1"></span>${verification ? `<span class="label-pill ${unv ? 'warn' : 'ok'}">${unv ? 'Unverified' : 'Verified'}</span>` : ''}<a class="sha" href="${esc(url || '#')}">${esc(String(sha).slice(0, 7))}</a></div>`;
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
  const rangeBar = `<div class="date-bar"><span class="who-l">${icon('clock')}When</span><select class="sel" id="crange" title="Only show activity from this period">${[['all', 'Any time'], ['1h', 'Last hour'], ['24h', 'Last 24 hours'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['custom', 'Custom range…']].map(([v, l]) => `<option value="${v}" ${S.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${S.range === 'custom' ? `<input type="date" class="input" id="cfrom" value="${esc(S.rFrom)}" title="From"><span class="who-l">to</span><input type="date" class="input" id="cto" value="${esc(S.rTo)}" title="To">` : ''}<span class="sp"></span><button class="who-chip" id="csort" title="Flip the order of the timeline">${icon(S.sort === 'desc' ? 'chevron-down' : 'chevron-up')}<span>${S.sort === 'desc' ? 'Newest first' : 'Oldest first'}</span></button></div>`;
  const bar = people.size > 1 ? `<div class="who-bar"><span class="who-l">${icon('person')}Show</span><button class="who-chip ${on ? '' : 'on'}" data-whoclear="1">Everyone</button>${[...people.values()].sort((x, y) => y.n - x.n).map(({ u, n }) => `<button class="who-chip ${who.includes(u.login!) ? 'on' : ''}" data-who="${esc(u.login)}" title="${n} comment${n === 1 ? '' : 's'}">${avatar(u, 18)}<span>${esc(u.login)}</span><i>${n}</i></button>`).join('')}</div>` : '';
  const bars = bar + rangeBar;
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
      case 'commit-run': out.push(`<div class="TLI"><div class="TLI-badge">${icon('git-commit')}</div><div class="TLI-body"><div class="row"><a data-tab="commits" class="run"><b>${e.n} commits</b> <span class="mono">${esc(e.first!.sha!.slice(0, 7))} … ${esc(e.last!.sha!.slice(0, 7))}</span> · view in Commits</a></div></div></div>`); break;
      case 'reviewed': out.push(reviewBlock(e, b)); break;
      case 'committed': out.push(`<div class="TLI"><div class="TLI-badge">${icon('git-commit')}</div><div class="TLI-body">${commitRow(e.message!, e.sha!, info[e.sha!]?.author || (e.author?.avatar_url ? e.author : null), e.html_url!, e.verification)}</div></div>`); break;
      case 'referenced': {
        const ci = info[e.commit_id!];
        const ml = ci ? ci.message.split('\n')[0] : '';
        const linked = esc(ml).replace(/#(\d+)/, '</a><a href="#" style="color:var(--fgColor-accent)">#$1</a><a href="#">');
        out.push(`<div class="TLI"><div class="TLI-badge">${icon('cross-reference')}</div><div class="TLI-body stack"><div class="row" style="min-height:32px">${user(e.actor)} <span>added a commit that referenced this pull request</span> <a class="time">${when(e.created_at!).replace(/<\/?span[^>]*>/g, '')}</a></div>${ci ? `<div class="line2"><div class="commit-row"><span class="TLI-avatar" style="margin:0 8px 0 0">${avatar(ci.author || e.actor, 20)}</span><span class="msg" style="flex:0 1 auto"><a href="${esc(ci.html_url)}">${linked}</a></span><span class="mono" style="background:var(--bgColor-neutral-muted);border-radius:6px;padding:0 6px;margin-left:12px;font-size:12px;line-height:16px">…</span><span class="cm-ic">${icon('comment')}</span><span style="flex:1"></span><a class="sha" href="${esc(ci.html_url)}">${esc(ci.sha.slice(0, 7))}</a></div></div>` : ''}</div></div>`);
        break;
      }
      case 'merged': merged = true; out.push(`<div class="TLI mergedrow"><div class="TLI-badge done">${icon('git-merge')}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>merged commit <b class="mono" style="color:var(--fgColor-default);font-size:12px">${esc((e.commit_id || '').slice(0, 7))}</b> into <span class="branch">${esc(p.base.label)}</span></span> <a class="time">${when(e.created_at!).replace(/<\/?span[^>]*>/g, '')}</a></div></div></div>`); out.push('<div class="TLI-break"></div>'); break;
      case 'closed': if (!p.merged) out.push(simple(e, 'git-pull-request-closed', 'closed this', 'danger')); break;
      case 'reopened': out.push(simple(e, 'git-pull-request', 'reopened this', 'success')); break;
      case 'cross-referenced': {
        const i = e.source?.issue; if (!i) break;
        const isPr = !!i.pull_request;
        out.push(`<div class="TLI"><div class="TLI-badge">${icon('cross-reference')}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>mentioned this ${isPr ? 'pull request' : 'issue'}</span> <a class="time">${when(e.created_at!).replace(/<\/?span[^>]*>/g, '')}</a></div>
        <div class="ref-card"><span style="color:var(--fgColor-${i.state === 'open' ? 'success' : 'done'});margin-top:2px">${icon(isPr ? (i.state === 'open' ? 'git-pull-request' : 'git-merge') : 'issue-opened')}</span><div><a class="t" href="${esc(i.html_url)}" style="color:var(--fgColor-default)">${esc(i.title.split('\n')[0].slice(0, 120))}</a><span class="r">${esc(i.repository?.full_name || '')}#${i.number}</span></div></div></div></div>`);
        break;
      }
      case 'labeled': case 'unlabeled': out.push(`<div class="TLI condensed"><div class="TLI-badge">${icon('tag')}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body">${user(e.actor)} <span>${e.event === 'labeled' ? 'added' : 'removed'}</span> <span class="pill-label" style="background:#${esc(e.label?.color)};color:#fff;margin:0">${esc(e.label?.name)}</span> <span>label</span> <a class="time">${when(e.created_at!).replace(/<\/?span[^>]*>/g, '')}</a></div></div>`); break;
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
  const foldAll = `<div class="fold-bar"><button class="btn small" id="foldallconv" title="Collapse or expand every comment, review and thread">${icon('chevron-down')} <span>Collapse all conversations</span></button></div>`;
  return `${bars}${foldAll}<div class="TL">${out.join('')}${!evs.length && (on || rangeOn) ? `<div class="diff-empty">${rangeOn ? 'No activity in this period.' : 'Nothing from the selected accounts.'}</div>` : ''}</div>${on ? '' : mergeBox(b)}${mergeActions(b)}${composer(b)}`;
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
  return `<div class="checks"><div class="ck-head ${head[0]}">${icon(CK[head[0]][0], 20)}<div><b>${head[1]}</b><span>${[n('fail') && `${n('fail')} failing`, n('pending') && `${n('pending')} in progress`, n('pass') && `${n('pass')} passed`, n('skip') && `${n('skip')} skipped`].filter(Boolean).join(' · ')}</span></div></div>${list.map((c) => `<a class="ck-row ${c.st}" ${c.url ? `href="${esc(c.url)}"` : ''}><span class="ck-i">${icon(CK[c.st][0])}</span><span class="ck-n"><b>${esc(c.name)}</b>${reqBadge(c)}<i>${esc(c.description || (c.app ? c.app : ''))}</i></span><span class="ck-s">${c.st === 'fail' && c.conclusion && c.conclusion !== 'failure' ? esc(c.conclusion.replace(/_/g, ' ')) : CK[c.st][1]}</span><span class="ck-d">${dur(c)}</span></a>`).join('')}</div>`;
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
  const it: string[] = [];
  const add = (k: string, ic: string, text: string, attr = '') => it.push(`<button class="att-i ${k}" ${attr}>${icon(ic)}<span>${text}</span></button>`);
  if (roots.length) {
    if (!known) add('', 'comment', `${roots.length} review thread${roots.length === 1 ? '' : 's'}`);
    else if (open.length) add('bad', 'comment', `${open.length} unresolved thread${open.length === 1 ? '' : 's'}`, 'id="nextun" title="Jump to the next unresolved thread"');
    else add('ok', 'check-circle-fill', 'All threads resolved');
  }
  add(cr ? 'bad' : ap ? 'ok' : '', cr ? 'file-diff' : ap ? 'check' : 'eye', cr ? `${cr} requesting changes` : ap ? `${ap} approved` : 'No approvals yet');
  if (ck.length) add(fail ? 'bad' : pend ? 'warn' : 'ok', fail ? 'x-circle-fill' : pend ? 'dot-fill' : 'check-circle-fill', fail ? `${fail} check${fail === 1 ? '' : 's'} failing` : pend ? `${pend} check${pend === 1 ? '' : 's'} running` : `${pass} check${pass === 1 ? '' : 's'} passed`, 'data-tab="checks" title="Open checks"');
  if (p.merged) add('done', 'git-merge', 'Merged'); else if (p.state === 'closed') add('bad', 'git-pull-request-closed', 'Closed');
  else if (p.mergeable === false || p.mergeable_state === 'dirty') add('bad', 'alert', 'Has conflicts');
  else if (p.mergeable_state === 'clean') add('ok', 'git-merge', 'Ready to merge');
  else if (p.draft) add('', 'git-pull-request-draft', 'Draft');
  return `<div class="attn">${it.join('')}${roots.length ? `<span class="sp"></span><button class="att-tog ${S.unres ? 'on' : ''}" id="unres" title="Hide everything except review threads that are still open">${icon('comment')}Unresolved only</button>` : ''}</div>`;
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
  return `<div class="TLI"><div class="TLI-badge ${kind}">${icon(ic)}</div><div class="TLI-avatar">${avatar(e.actor, 20)}</div><div class="TLI-body"><div class="row">${user(e.actor)} <span>${text}</span> <a class="time">${when(e.created_at!).replace(/<\/?span[^>]*>/g, '')}</a></div></div></div>`;
}
