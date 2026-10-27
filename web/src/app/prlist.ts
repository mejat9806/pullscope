import { folded, isFolded } from './comments';
import { S, esc, icon, when } from './core';
import { pushBanners } from './data';

export const PSORT = { updated: 'Recently updated', created: 'Newest', oldest: 'Oldest', number: 'Number', title: 'Title A–Z', author: 'Author' };

export const PGROUP = { none: 'No grouping', status: 'Status', author: 'Author', label: 'Label', base: 'Base branch' };

export const prStatus = (p) => (p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : p.draft ? 'draft' : 'open');

export const PICON = { open: 'git-pull-request', draft: 'git-pull-request-draft', merged: 'git-merge', closed: 'git-pull-request-closed' };

export function prSide() {
  const cur = S.bundle && S.view === 'pr' ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}` : '';
  const f = S.pf.toLowerCase();
  const sel = (id, opts, v) => `<select class="input sb-sel" id="${id}">${Object.entries(opts).map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const head = `<div class="sb-repo"><button class="fold-btn" data-side="repos" title="All repositories">${icon('chevron-left')}</button><b title="${esc(S.repo)}">${esc(S.repo)}</b></div>
  <div class="seg sb-seg">${['open', 'closed', 'all'].map((s) => `<button data-sps="${s}" class="${S.prState === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
  <input class="input sb-filter" id="prfilter" placeholder="Filter by title, #, author, label…" value="${esc(S.pf)}">
  <div class="sb-ctl"><label>Sort${sel('prsort', PSORT, S.psort)}</label><label>Group${sel('prgroup', PGROUP, S.pgroup)}</label></div>`;
  if (!S.prs) return head + '<div class="sb-empty">Loading pull requests…</div>';
  const list = S.prs.filter((p) => !f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f));
  const by = { updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number }[S.psort];
  list.sort(by);
  const row = (p) => { const st = prStatus(p), ref = `${S.repo}#${p.number}`; return `<a class="rc ${ref === cur ? 'on' : ''}" data-open="${esc(ref)}"><span class="rc-i ${st}">${icon(PICON[st])}</span><span class="rc-t"><b>${esc(p.title)}</b><i>#${p.number} · ${esc(p.user.login)} · ${when(p.updated_at).replace(/<\/?span[^>]*>/g, '')}</i></span></a>`; };
  if (!list.length) return head + `<div class="sb-empty">${S.pf ? 'No matches.' : 'No pull requests.'}</div>`;
  if (S.pgroup === 'none') return head + `<div class="sb-count">${list.length} pull request${list.length === 1 ? '' : 's'}</div>` + list.map(row).join('');
  const groups = new Map(), put = (k, p) => (groups.get(k) || groups.set(k, []).get(k)).push(p);
  list.forEach((p) => {
    if (S.pgroup === 'status') put({ open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' }[prStatus(p)], p);
    else if (S.pgroup === 'author') put(p.user.login, p);
    else if (S.pgroup === 'base') put(p.base?.ref || '—', p);
    else if ((p.labels || []).length) p.labels.forEach((l) => put(l.name, p)); else put('No label', p);
  });
  const order = S.pgroup === 'status' ? ['Open', 'Draft', 'Merged', 'Closed'] : [...groups.keys()].sort((a: any, b: any) => (a === 'No label') - (b === 'No label') || a.localeCompare(b));
  return head + order.filter((k) => groups.has(k)).map((k) => { const key = 'pg:' + S.pgroup + ':' + k; return `<div class="pg${folded(key)}"><div class="pg-h" data-fold="${esc(key)}">${icon(isFolded(key) ? 'chevron-right' : 'chevron-down')}<span>${esc(k)}</span><i>${groups.get(k).length}</i></div><div class="pg-b">${groups.get(k).map(row).join('')}</div></div>`; }).join('');
}


export function prFiltered() {
  const f = S.pf.toLowerCase();
  const list = (S.prs || []).filter((p) => (!f || `#${p.number} ${p.title} ${p.user.login} ${p.head?.ref || ''} ${(p.labels || []).map((l) => l.name).join(' ')}`.toLowerCase().includes(f))
    && (!S.pAuthor || p.user.login === S.pAuthor) && (!S.pLabel || (p.labels || []).some((l) => l.name === S.pLabel))
    && (!S.pStatus || prStatus(p) === S.pStatus));
  return list.sort({ updated: (a, b) => b.updated_at.localeCompare(a.updated_at), created: (a, b) => b.created_at.localeCompare(a.created_at), oldest: (a, b) => a.created_at.localeCompare(b.created_at), number: (a, b) => b.number - a.number, title: (a, b) => a.title.localeCompare(b.title), author: (a, b) => a.user.login.localeCompare(b.user.login) || b.number - a.number }[S.psort]);
}

export function prFilterBar() {
  if (!S.prs) return '';
  const authors = ([...new Set(S.prs.map((p) => p.user.login))] as string[]).sort((a, b) => a.localeCompare(b));
  const labels = [...new Set(S.prs.flatMap((p) => (p.labels || []).map((l) => l.name)))].sort((a, b) => a.localeCompare(b));
  const opt = (arr, v, all) => `<option value="">${all}</option>` + arr.map((x) => `<option value="${esc(x)}"${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const sts = { open: 'Open', draft: 'Draft', merged: 'Merged', closed: 'Closed' };
  const n = prFiltered().length, active = S.pf || S.pAuthor || S.pLabel || S.pStatus;
  return `<div class="prl-filters"><span class="pf-search">${icon('search')}<input class="input" id="mainfilter" placeholder="Filter by title, #, author, branch, label…" value="${esc(S.pf)}" spellcheck="false"></span>
  <select class="input" id="pfauthor">${opt(authors, S.pAuthor, 'Author: all')}</select>
  <select class="input" id="pflabel">${opt(labels, S.pLabel, 'Label: all')}</select>
  <select class="input" id="pfstatus"><option value="">Status: any</option>${Object.entries(sts).map(([k, t]) => `<option value="${k}"${k === S.pStatus ? ' selected' : ''}>${t}</option>`).join('')}</select>
  <select class="input" id="pfsort">${Object.entries(PSORT).map(([k, t]) => `<option value="${k}"${k === S.psort ? ' selected' : ''}>Sort: ${t}</option>`).join('')}</select>
  <span class="pf-count">${n} of ${S.prs.length}</span>${active ? '<button class="btn" id="pfclear">Clear</button>' : ''}</div>`;
}

export function prList() {
  const head = `<div class="prl-head"><div><span class="repo-ic">${icon('repo', 16)}</span> <b>${esc(S.repo)}</b></div><div class="seg">${['open', 'closed', 'all'].map((s) => `<button data-ps="${s}" class="${S.prState === s ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div></div>`;
  let body;
  const pb = pushBanners(S.repo);
  if (S.error) body = `<div class="err" style="padding:16px">${esc(S.error)}</div>`;
  else if (!S.prs) body = '<div class="spinner" style="margin:48px auto">Loading pull requests…</div>';
  else body = prFiltered().map((p) => {
    const st = p.merged_at ? ['merged', 'git-merge'] : p.state === 'closed' ? ['closed', 'git-pull-request-closed'] : p.draft ? ['draft', 'git-pull-request-draft'] : ['open', 'git-pull-request'];
    const lbl = (p.labels || []).map((l) => `<span class="pill-label" style="background:#${esc(l.color)}33;color:#${esc(l.color)};border-color:#${esc(l.color)};margin:0 0 0 4px">${esc(l.name)}</span>`).join('');
    return `<a class="prl-row" data-open="${esc(S.repo)}#${p.number}"><span class="rc-i ${st[0]}">${icon(st[1])}</span><span class="prl-main"><b>${esc(p.title)}</b>${lbl}<i>#${p.number} ${p.merged_at ? 'merged' : p.state === 'closed' ? 'closed' : 'opened'} ${when(p.merged_at || p.closed_at || p.created_at).replace(/<\/?span[^>]*>/g, '')} by ${esc(p.user.login)}</i></span><img src="${esc(p.user.avatar_url)}&s=40" width="20" height="20" style="border-radius:50%"></a>`;
  }).join('') || `<div class="diff-empty">${S.prs.length ? 'No pull requests match the filters.' : 'No pull requests.'}</div>`;
  return `<div class="pr-page"><div class="repoline" style="padding-bottom:16px"></div>${pb}<div class="prl">${head}${prFilterBar()}${body}</div></div>`;
}


// Breadcrumbs for every page: Home › (owner / repo) › … ; the last item is the current page.
export function crumbs(repo, trail = [], extra = '') {
  const sep = `<span class="crumb-sep">${icon('chevron-right', 12)}</span>`;
  const homeCur = !repo && !trail.length;
  const parts = [homeCur ? `<span class="crumb cur home">${icon('home', 14)}<span>Home</span></span>` : `<a class="crumb" data-home="1" title="Home">${icon('home', 14)}<span>Home</span></a>`];
  if (repo) {
    const [owner, name] = repo.split('/');
    parts.push(`<span class="crumb-grp"><a class="crumb" data-owner="${esc(owner)}" title="Repositories of ${esc(owner)}">${esc(owner)}</a><span class="crumb-slash">/</span><a class="crumb strong" data-repo="${esc(repo)}" title="All pull requests in ${esc(repo)}">${esc(name)}</a></span>`);
  }
  trail.forEach((t, i) => parts.push(i === trail.length - 1 ? `<span class="crumb cur">${esc(t.t)}</span>` : `<a class="crumb" ${t.repo ? `data-repo="${esc(t.repo)}"` : ''}>${esc(t.t)}</a>`));
  return `<nav class="repoline crumbs" aria-label="Breadcrumb">${parts.join(sep)}${extra}</nav>`;
}

export function repoHeader(p) {
  const r = p.base.repo;
  return crumbs(r.full_name, [{ t: 'Pull requests', repo: r.full_name }, { t: `#${p.number}` }], `<a class="crumb gh" href="${esc(r.html_url)}" data-ext title="Open on GitHub">${icon('link-external', 12)}</a>${S.refreshing ? '<span class="stale">Refreshing…</span>' : ''}`);
}
