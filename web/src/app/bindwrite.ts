import { S, esc, icon } from './core';
import { pushBanners } from './data';

export function homePage() {
  const tab = S.homeTab || 'repos', owner = S.homeOwner || '';
  const tabs = `<div class="np-tabs"><button class="${tab === 'repos' ? 'sel' : ''}" data-htab="repos">${icon('repo')} Repositories${S.repos ? `<span>${S.repos.filter((r) => !owner || r.full_name.startsWith(owner + '/')).length}</span>` : ''}</button><button class="${tab === 'recent' ? 'sel' : ''}" data-htab="recent">${icon('clock')} Recent<span>${S.recent.length}</span></button></div>`;
  let body;
  if (tab === 'recent') {
    const q = (S.recentFilter || '').toLowerCase(), st = S.recentState || 'all';
    const list = S.recent.filter((r) => (st === 'all' || r.state === st) && (!q || (r.title + ' ' + r.ref).toLowerCase().includes(q)));
    const bar = S.recent.length ? `<div class="hm-fbar"><input class="input hm-filter" id="hmrfilter" placeholder="Filter by title or repo…" value="${esc(S.recentFilter || '')}"><div class="seg-ctl">${['all', 'open', 'merged', 'closed'].map((x) => `<button class="${st === x ? 'on' : ''}" data-rstate="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>` : '';
    body = bar + (list.length ? `<div class="hm-grid">${list.map((r) => `<a class="hm-card" data-open="${esc(r.ref)}"><span class="rc-i ${r.state}">${icon(r.icon)}</span><span class="hm-t"><b>${esc(r.title)}</b><i>${esc(r.ref)}</i></span><button class="rc-x" data-rm="${esc(r.ref)}" title="Remove">${icon('x')}</button></a>`).join('')}</div>` : `<div class="diff-empty">${S.recent.length ? 'No matching pull requests.' : 'Pull requests you open appear here.'}</div>`);
  }
  else if (!S.hasToken) body = '<div class="diff-empty">Add an access token to list all your repositories and their pull requests.<br><br><button class="btn primary" id="addtoken">Add token</button></div>';
  else if (S.reposErr) body = `<div class="diff-empty err">${esc(S.reposErr)}</div>`;
  else if (!S.repos) body = '<div class="spinner" style="margin:48px auto">Loading repositories…</div>';
  else {
    const f = (S.repoFilter || '').toLowerCase();
    const vis = S.hmVis || 'all', srt = S.hmSort || 'pushed', grp = S.hmGroup || 'none';
    let list = S.repos.filter((r) => (!owner || r.full_name.startsWith(owner + '/')) && r.full_name.toLowerCase().includes(f) && (vis === 'all' || (vis === 'private') === !!r.private));
    const nm = (r) => r.full_name.split('/')[1], pushed = (r) => Date.parse(r.pushed_at || 0) || 0;
    const sorters = { name: (a, b) => nm(a).localeCompare(nm(b)), namez: (a, b) => nm(b).localeCompare(nm(a)), issues: (a, b) => (b.open_issues_count || 0) - (a.open_issues_count || 0) || nm(a).localeCompare(nm(b)), oldest: (a, b) => pushed(a) - pushed(b), owner: (a, b) => a.full_name.localeCompare(b.full_name), ownerz: (a, b) => b.full_name.split('/')[0].localeCompare(a.full_name.split('/')[0]) || nm(a).localeCompare(nm(b)) };
    if (sorters[srt]) list = [...list].sort(sorters[srt]);
    const card = (r) => `<a class="hm-card" data-repo="${esc(r.full_name)}"><span class="rc-i" style="color:var(--fgColor-muted)">${icon(r.private ? 'lock' : 'repo')}</span><span class="hm-t"><b>${esc(r.full_name.split('/')[1])}</b><i>${esc(r.full_name.split('/')[0])}${r.archived ? ' · archived' : ''}${r.open_issues_count ? ` · ${r.open_issues_count} open` : ''}</i>${r.description ? `<em>${esc(r.description)}</em>` : ''}</span></a>`;
    let grid;
    if (!list.length) grid = '<div class="diff-empty">No matching repositories.</div>';
    else if (grp === 'owner') { const by = new Map(); list.forEach((r) => { const o = r.full_name.split('/')[0]; if (!by.has(o)) by.set(o, []); by.get(o).push(r); }); grid = [...by].map(([o, rs]) => `<h3 class="hm-grp">${esc(o)}<span>${rs.length}</span></h3><div class="hm-grid">${rs.map(card).join('')}</div>`).join(''); }
    else grid = `<div class="hm-grid">${list.map(card).join('')}</div>`;
    const opt = (v, cur, t) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`;
    body = `<div class="hm-fbar"><input class="input hm-filter" id="hmfilter" placeholder="Find a repository…" value="${esc(S.repoFilter || '')}"><div class="seg-ctl">${['all', 'public', 'private'].map((x) => `<button class="${vis === x ? 'on' : ''}" data-hvis="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div><select class="input" id="hmsort" title="Sort">${opt('pushed', srt, 'Recently pushed')}${opt('oldest', srt, 'Least recently pushed')}${opt('name', srt, 'Name A–Z')}${opt('namez', srt, 'Name Z–A')}${opt('owner', srt, 'Owner A–Z')}${opt('ownerz', srt, 'Owner Z–A')}${opt('issues', srt, 'Most open issues')}</select><select class="input" id="hmgroup" title="Group">${opt('none', grp, 'No grouping')}${opt('owner', grp, 'Group by owner')}</select></div>` + grid;
  }
  return `<div class="notes-page hm-page"><div class="np-head"><h1>${icon('home')} ${owner ? esc(owner) : 'Home'}</h1></div>
  <p class="hm-hint">Open a pull request: type <code>owner/repo#123</code> or paste a URL in the bar above.</p>${pushBanners() ? `<div class="push-wrap">${pushBanners()}</div>` : ''}${S.error ? `<div class="err">${esc(S.error)}</div>` : ''}${tabs}${body}</div>`;
}
