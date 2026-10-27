import type { AcRow, BpGroup, BpRow, BranchInfo, PrListItem, RepoSummary } from '../types';
import { $, S, esc, icon, tauri } from './core';
import { openPr } from './nav';
import { render } from './pages';
import { curRef, openTab } from './tabs';

// ---- Address bar autocomplete: open tabs and recent PRs, then repositories, then that repo's PR numbers ----
export const AC: { rows: AcRow[]; sel: number; nav: boolean; prs: Record<string, PrListItem[] | null> } = { rows: [], sel: -1, nav: false, prs: {} };

export function acRows(q: string) {
  const t = q.trim(), lq = t.toLowerCase(), rows: AcRow[] = [], seen = new Set<string | undefined>();
  const add = (r: AcRow) => { if (!seen.has(r.ref || r.fill)) { seen.add(r.ref || r.fill); rows.push(r); } };
  if (/^https?:\/\//i.test(t)) return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(t) ? [{ ref: t, label: 'Open ' + t.replace(/^https?:\/\/github\.com\//, ''), sub: 'Go to this pull request', ic: 'git-pull-request' }] : [];
  const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);
  const known = [...S.tabs.map((x) => ({ ref: x.ref, title: x.title, state: x.state, ic: x.icon })), ...S.recent.map((x) => ({ ref: x.ref, title: x.title, state: x.state, ic: x.icon }))];
  if (pr) {
    const repo = pr[1], num = pr[2];
    if (num) add({ ref: `${t.split('#')[0]}#${num}`, label: `Open ${t.split('#')[0]}#${num}`, sub: 'Go to this pull request', ic: 'git-pull-request' });
    const fromApi = (AC.prs[repo] || []).map((x) => ({ ref: `${x.base?.repo?.full_name || repo}#${x.number}`, title: x.title, state: x.merged_at ? 'merged' : x.state, ic: 'git-pull-request' }));
    [...known.filter((x) => x.ref.toLowerCase().startsWith(repo + '#')), ...fromApi].filter((x) => x.ref.toLowerCase().split('#')[1].startsWith(num)).slice(0, 8).forEach((x) => add({ ref: x.ref, label: x.title || x.ref, sub: x.ref, ic: x.ic || 'git-pull-request', state: x.state }));
    return rows.slice(0, 9);
  }
  known.filter((x) => !lq || `${x.ref} ${x.title}`.toLowerCase().includes(lq)).slice(0, lq ? 6 : 8).forEach((x) => add({ ref: x.ref, label: x.title || x.ref, sub: x.ref, ic: x.ic || 'git-pull-request', state: x.state }));
  if (lq && S.repos) S.repos.filter((r) => r.full_name.toLowerCase().includes(lq)).sort((a, b) => (b.full_name.toLowerCase().startsWith(lq) ? 1 : 0) - (a.full_name.toLowerCase().startsWith(lq) ? 1 : 0)).slice(0, 6).forEach((r) => add({ fill: r.full_name + '#', label: r.full_name, sub: 'Repository: pick a pull request', ic: r.private ? 'lock' : 'repo' }));
  return rows.slice(0, 12);
}

export function acClose() { document.getElementById('acpop')?.remove(); AC.rows = []; AC.sel = -1; }

export function acDraw() {
  const inp = $<HTMLInputElement>('#addrinput')!; if (!inp || document.activeElement !== inp) return acClose();
  const q = inp.value; AC.rows = acRows(q);
  const m = q.trim().toLowerCase().match(/^([^#\s]+\/[^#\s]+)#\d*$/);
  if (m && AC.prs[m[1]] === undefined && tauri) { AC.prs[m[1]] = null; tauri!.invoke('list_prs', { repo: m[1], state: 'all' }).then((r) => { AC.prs[m[1]] = r; acDraw(); }).catch(() => { AC.prs[m[1]] = []; }); }
  if (!AC.rows.length) return acClose();
  AC.sel = Math.min(AC.sel, AC.rows.length - 1);
  let pop = document.getElementById('acpop');
  if (!pop) { pop = document.createElement('div'); pop.id = 'acpop'; pop.className = 'acpop'; document.body.appendChild(pop); pop.addEventListener('mousedown', (e) => { e.preventDefault(); const r = (e.target as HTMLElement).closest<HTMLElement>('.ac-row'); if (r) acPick(AC.rows[+r.dataset.i!]); }); }
  const b = inp.closest<HTMLElement>('.addr')!.getBoundingClientRect(); pop.style.left = b.left + 'px'; pop.style.top = b.bottom + 6 + 'px'; pop.style.width = b.width + 'px';
  pop.innerHTML = AC.rows.map((r, i) => `<div class="ac-row${i === AC.sel ? ' on' : ''}" data-i="${i}"><span class="ac-i ${r.state || ''}">${icon(r.ic!)}</span><span class="ac-t"><b>${esc(r.label!)}</b><i>${esc(r.sub!)}</i></span></div>`).join('');
  $('.on', pop)?.scrollIntoView({ block: 'nearest' });
}

export function acPick(r: AcRow) {
  const inp = $<HTMLInputElement>('#addrinput')!; if (!r || !inp) return;
  if (r.fill) { inp.value = r.fill; inp.focus(); AC.sel = -1; acDraw(); return; }
  acClose(); inp.blur(); openPr(r.ref!);
}

document.addEventListener('focusin', (e) => { if ((e.target as HTMLElement).id === 'addrinput') { AC.sel = -1; setTimeout(acDraw, 0); } });

document.addEventListener('input', (e) => { if ((e.target as HTMLElement).id === 'addrinput') { AC.sel = -1; acDraw(); } });

document.addEventListener('focusout', (e) => { if ((e.target as HTMLElement).id === 'addrinput') setTimeout(acClose, 120); });

document.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement).id !== 'addrinput' || !document.getElementById('acpop')) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = AC.rows.length; AC.sel = e.key === 'ArrowDown' ? (AC.sel + 1) % n : (AC.sel - 1 + n) % n; acDraw(); }
  else if (e.key === 'Tab' && AC.rows.length) { e.preventDefault(); const r = AC.rows[Math.max(0, AC.sel)]; if (r.fill) acPick(r); else { (e.target as HTMLInputElement).value = r.ref!; AC.sel = -1; acDraw(); } }
  else if (e.key === 'Enter' && AC.sel >= 0) { e.preventDefault(); acPick(AC.rows[AC.sel]); }
  else if (e.key === 'Escape') { acClose(); }
}, true);

// Dragging the window: Tauri's drag attribute only works on the exact element it sits on, so treat every non-interactive spot of the toolbar as a handle.
{
  const win = () => window.__TAURI__?.window?.getCurrentWindow?.();
  const free = (e: MouseEvent) => e.button === 0 && (e.target as HTMLElement).closest<HTMLElement>('.toolbar') && !(e.target as HTMLElement).closest<HTMLElement>('button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop');
  document.addEventListener('mousedown', (e) => { if (!free(e)) return; e.preventDefault(); if (e.detail === 2) win()?.toggleMaximize?.(); else win()?.startDragging?.(); });
}

// Branch picker for the New PR page: search, your branches first, the rest grouped by prefix with last-commit age.
export function bpClose() { document.getElementById('bppop')?.remove(); }

export function bpAge(t: string) { if (!t) return ''; const m = Math.max(1, Math.round((Date.now() - +new Date(t)) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : m < 43200 ? `${Math.round(m / 1440)}d` : `${Math.round(m / 43200)}mo`; }

export function bpGroups(br: BranchInfo, q: string, me: string): BpGroup[] {
  const det = new Map((br.details || []).map((d) => [d.name, d])), rank = new Map(br.branches.map((b, i) => [b, i]));
  const all = br.branches.map((name) => ({ name, at: det.get(name)?.at || '', by: det.get(name)?.by || '' }))
    .sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : rank.get(a.name)! - rank.get(b.name)!));
  if (q) { const t = q.toLowerCase(); return [['', all.filter((x) => x.name.toLowerCase().includes(t))]]; }
  const out: BpGroup[] = [], used = new Set<string>(), take = (f: (x: BpRow) => unknown) => all.filter((x) => !used.has(x.name) && f(x) && used.add(x.name));
  const def = take((x) => x.name === br.default); if (def.length) out.push(['Default', def]);
  const mine = me ? take((x) => x.by && x.by.toLowerCase() === me.toLowerCase()) : []; if (mine.length) out.push(['Your branches', mine]);
  const rest = take(() => true), pre = new Map<string, BpRow[]>();
  rest.forEach((x) => { const k = x.name.includes('/') ? x.name.split('/')[0] + '/' : ''; (pre.get(k) || pre.set(k, []).get(k)!).push(x); });
  const single: BpRow[] = [];
  [...pre.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).forEach(([k, l]) => { if (k && l.length > 1) out.push([k, l]); else single.push(...l); });
  if (single.length) out.push([out.length ? 'Other' : '', single.sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0))]);
  return out;
}

export function rpGroups(repos: RepoSummary[], q: string, me: string): BpGroup[] {
  const all = repos.filter((r) => !r.archived).map((r) => ({ name: r.full_name, at: r.pushed_at || '', by: r.private ? 'private' : '' })).sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));
  if (q) { const t = q.toLowerCase(); return [['', all.filter((x) => x.name.toLowerCase().includes(t))]]; }
  const out: BpGroup[] = [], recent = all.slice(0, 5), used = new Set(recent.map((x) => x.name)); if (recent.length) out.push(['Recently pushed', recent]);
  const by = new Map<string, BpRow[]>(); all.filter((x) => !used.has(x.name)).forEach((x) => { const o = x.name.split('/')[0]; (by.get(o) || by.set(o, []).get(o)!).push(x); });
  [...by.entries()].sort((a, b) => (+(b[0].toLowerCase() === me.toLowerCase())) - (+(a[0].toLowerCase() === me.toLowerCase())) || b[1].length - a[1].length).forEach(([o, l]) => out.push([o, l]));
  return out;
}

export function bpOpen(btn: HTMLElement, side: 'repo' | 'base' | 'head', pick: (v: string) => void, repoMode = false) {
  bpClose();
  const n = S.np, br = repoMode ? null : n!.branches[n!.repo]; if (!repoMode && !br) return;
  const cur = repoMode ? n!.repo : n![side], me = S.profile?.login || '', r = btn.getBoundingClientRect();
  const pop = document.createElement('div'); pop.id = 'bppop'; pop.className = 'bp-pop';
  const w = Math.max(r.width, 340);
  pop.style.cssText = `left:${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px;width:${w}px;`;
  pop.innerHTML = `<input class="bp-q" placeholder="${repoMode ? 'Filter repositories…' : 'Filter branches…'}" spellcheck="false"><div class="bp-list"></div>`;
  document.body.appendChild(pop);
  const below = innerHeight - r.bottom, up = below < 300 && r.top > below;
  pop.style.maxHeight = Math.min(420, (up ? r.top : below) - 16) + 'px'; if (up) pop.style.bottom = innerHeight - r.top + 4 + 'px'; else pop.style.top = r.bottom + 4 + 'px';
  const q = $<HTMLInputElement>('.bp-q', pop), list = $('.bp-list', pop); let act = 0, rows: BpRow[] = [];
  const draw = () => {
    const groups = repoMode ? rpGroups(S.repos || [], q!.value.trim(), me) : bpGroups(br!, q!.value.trim(), me); rows = groups.flatMap(([, l]) => l);
    act = Math.max(0, Math.min(act, rows.length - 1)); let i = 0;
    list!.innerHTML = groups.length && rows.length ? groups.map(([h, l]) => `${h ? `<div class="bp-h">${esc(h)}<span>${l.length}</span></div>` : ''}${l.map((x) => `<div class="bp-r${i++ === act ? ' act' : ''}${x.name === cur ? ' cur' : ''}" data-b="${esc(x.name)}"><span class="bp-ck">${x.name === cur ? '✓' : ''}</span><span class="bp-n">${esc(x.name)}</span>${x.by ? `<span class="bp-by">${esc(x.by)}</span>` : ''}<span class="bp-t">${bpAge(x.at)}</span></div>`).join('')}`).join('') : '<div class="bp-empty">No matches</div>';
    list!.querySelector('.act')?.scrollIntoView({ block: 'nearest' });
  };
  const done = (v?: string) => { bpClose(); document.removeEventListener('mousedown', away, true); if (v && v !== cur) pick(v); };
  const away = (e: Event) => { if (!pop.contains(e.target as Node | null)) done(); };
  list!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-b]'); if (b) done(b.dataset.b); });
  list!.addEventListener('mousemove', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-b]'); if (b && !b.classList.contains('act')) { list!.querySelector('.act')?.classList.remove('act'); b.classList.add('act'); act = [...list!.querySelectorAll('[data-b]')].indexOf(b); } });
  q!.addEventListener('input', () => { act = 0; draw(); });
  q!.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); done(); }
    else if (e.key === 'Enter') { e.preventDefault(); done(rows[act]?.name); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, Math.min(rows.length - 1, act + (e.key === 'ArrowDown' ? 1 : -1))); draw(); }
  });
  document.addEventListener('mousedown', away, true);
  draw(); q!.focus();
}

export function focusAddr() { const i = $<HTMLInputElement>('#addrinput')!; i?.focus(); i?.select(); }

export const avUrl = (u: string, n: number) => `${u}${u.includes('?') ? '&' : '?'}s=${n}`;

export function loadProfile() {
  if (!tauri) return;
  tauri!.invoke('viewer_profile').then((p) => { S.me = p.login; S.profile = p; try { localStorage.setItem('profile', JSON.stringify(p)); } catch { /* storage full */ } render(); }).catch(() => {});
}

export const openExternal = (url: string) => (tauri ? tauri!.invoke('open_external', { url }) : window.open(url, '_blank'));


// Opening a PR that already has a tab goes to that tab instead of making another page.
export function openFromList(ref: string, newTab: boolean) {
  const have = S.tabs.some((t) => t.ref === ref);
  if (have && !S.focus) { if (ref === curRef()) { S.tabMenu = false; return; } return openTab(ref); }
  return newTab ? openTab(ref, { newTab: true }) : openPr(ref);
}

let stuckOn: Element | null = null;
export function bindSticky() {
  const ta = $('.pr-title-area'), tb = $('.pr-tabs');
  if (ta && ta === stuckOn && S.ios?.length) return;
  stuckOn = ta;
  if (ta && tb && !$('.is-split')) { const io = new IntersectionObserver(([en]) => tb.classList.toggle('stuck', !en.isIntersecting && en.boundingClientRect.bottom < 0), { root: $('.main'), threshold: 0 }); io.observe(ta); S.ios!.push(io); }
}
