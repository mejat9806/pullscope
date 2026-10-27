import { bindWrite, closeDlg, drafts, rerender, saveDrafts } from './actions';
import { closePop, openPop } from './dialogs';
import { tokenDialog } from './token';
import { bindSticky, focusAddr, openExternal, openFromList } from './addressbar';
import { isFolded } from './comments';
import { $, KEY_RECENT, S, icon, qa as qaAll, scoped } from './core';
import { loadPr, pollNotes, pushDis, qc } from './data';
import { commitList, flipSides, openCommits, selectCommit, setFr } from './mergebox';
import { loadPrs, loadRepos, openPr, openRepo, reload } from './nav';
import { openNewPr, render, saveNotes } from './pages';
import { repaintSide } from './side';
import { go } from './render';
import { curRef, saveTabs, tabIdx, tabSnap } from './tabs';
import { jumpUnresolved } from './timeline';

// Browser-style tabs: leaving a PR tab keeps its page (DOM, scroll, open editors) alive; coming back swaps it in with no redraw.
S.alive = new Map();

export const aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join('|');

export function stashCurrent() { S.openSeq = (S.openSeq || 0) + 1;
  const ref = S.view === 'pr' && S.bundle ? curRef() : '', m = $('.main');
  if (!ref || !m || !m.querySelector('#page > *') || !S.tabs.some((t) => t.ref === ref)) return;
  S.alive.set(ref, { el: m, eds: S.eds || [], bundle: S.bundle!, tab: S.tab, key: aliveKey(), scroll: m.scrollTop });
  S.eds = [];
  while (S.alive.size > 6) S.alive.delete(S.alive.keys().next().value!);
}

export function fastTab(ref: string) { S.openSeq = (S.openSeq || 0) + 1;
  const a = S.alive.get(ref); if (!a) return false;
  const mem = qc.peek(ref);
  if (!mem || mem.data !== a.bundle || a.key !== aliveKey()) { S.alive.delete(ref); return false; }
  tabSnap(); stashCurrent(); S.alive.delete(ref);
  const p = a.bundle.pull;
  S.view = 'pr'; S.bundle = a.bundle; S.tab = a.tab; S.sel = null; S.fr = null; S.error = ''; S.loading = false; S.refreshing = false; S.tabPending = ''; S.tabMenu = false;
  localStorage.setItem('last', ref);
  const ti = S.tabs.find((t) => t.ref === ref); if (ti) { ti.dot = false; saveTabs(); }
  if (S.repo !== p.base.repo.full_name) { S.repo = p.base.repo.full_name; S.sideTab = 'prs'; setTimeout(loadPrs, 0); }
  if (S.draftRef !== ref) { saveDrafts(); S.draftRef = ref; S.draft = { ...(drafts[ref] || {}) }; }
  S.mainStub = true; render(); S.mainStub = false;
  $('.main')!.replaceWith(a.el);
  a.el.scrollTop = a.scroll; S.eds = a.eds;
  bindSticky();
  // Quietly check for newer data; only redraw if something actually changed.
  if (!qc.fresh(ref)) qc.fetch(ref, () => loadPr(ref))!.then((d) => {
    if (JSON.stringify(d) === JSON.stringify(a.bundle)) { qc.m.set(ref, { data: a.bundle, at: Date.now() }); return; }
    if (curRef() === ref) openPr(ref, { keepTab: true, nav: true });
  }).catch(() => {});
  return true;
}

export function openClick(el: HTMLElement, e: MouseEvent) { if ((e.target as HTMLElement).closest<HTMLElement>('[data-rm], .np-act, .np-dot')) return; S.nav = false; S.focus = el.dataset.target || ''; const nn = el.dataset.note && S.notes.find((x) => String(x.id) === el.dataset.note); if (nn) { nn.read = true; saveNotes(); } if (e.metaKey || e.ctrlKey) { e.preventDefault(); openFromList(el.dataset.open!, true); } else openFromList(el.dataset.open!, false); }

export function openAux(el: HTMLElement, e: MouseEvent) { if (e.button === 1) { e.preventDefault(); openFromList(el.dataset.open!, true); } }

export function openCtx(el: HTMLElement, e: MouseEvent) {
  e.preventDefault(); e.stopPropagation();
  const ref = el.dataset.open!;
  openPop({ k: 'ctx', x: Math.min(e.clientX, innerWidth - 180), y: Math.min(e.clientY, innerHeight - 120), pick: (h) => { closePop(); if (h === 'new') openFromList(ref, true); else if (h === 'here') openFromList(ref, false); else { const m = ref.match(/^(.+)#(\d+)$/); navigator.clipboard?.writeText(m ? `https://github.com/${m[1]}/pull/${m[2]}` : ref).catch(() => {}); } } });
}

export function rmRecent(e: MouseEvent, ref: string) { e.stopPropagation(); S.recent = S.recent.filter((r) => r.ref !== ref); localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent)); S.keepScroll = true; render(); S.keepScroll = false; }

const wired = new WeakMap<Element, ChildNode | null>();
export function bindIslands() {
  qaAll('.island').forEach((el) => { if (wired.get(el) === el.firstChild) return; wired.set(el, el.firstChild); bind(el); });
}

// "Collapse all conversations" flips every fold in the timeline; the label says what the next click does.
export function syncFoldAll() { const els = [...qaAll('.TL [data-fold]')], l = document.querySelector('#foldallconv span'); if (l && els.length) l.textContent = els.every((x) => isFolded(x.dataset.fold!, x.dataset.def === '1')) ? 'Expand all conversations' : 'Collapse all conversations'; }
export function foldAllConv() {
  const els = [...qaAll('.TL [data-fold]')]; if (!els.length) return;
  const now = els.some((x) => !isFolded(x.dataset.fold!, x.dataset.def === '1'));
  els.forEach((x) => { S.fold[x.dataset.fold!] = now; });
  try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* storage full */ }
  rerender();
}

export function bind(scope?: HTMLElement) {
  const { qa, $ } = scoped(scope);
  bindWrite(scope);
  $('#fcbtn')?.addEventListener('click', openCommits);
  $('#fcall')?.addEventListener('click', () => setFr(null));
  qa('[data-fstep]').forEach((el) => el.addEventListener('click', () => { const cs = commitList(S.bundle!), i = (S.fr?.a ?? 0) + Number(el.dataset.fstep); if (cs[i]) setFr({ a: i, b: i }); }));
  $<HTMLSelectElement>('#fsort')?.addEventListener('change', (e) => { S.fileSort = (e.target as HTMLInputElement).value; rerender(); });
  qa('[data-repo]').forEach((el) => el.addEventListener('click', () => openRepo(el.dataset.repo!)));
  qa('[data-home]').forEach((el) => el.addEventListener('click', () => { S.view = 'home'; S.homeOwner = ''; S.nav = false; render(); }));
  qa('[data-owner]').forEach((el) => el.addEventListener('click', () => { S.view = 'home'; S.homeOwner = el.dataset.owner; S.homeTab = 'repos'; S.nav = false; render(); if (S.hasToken && !S.repos) loadRepos(); }));
  qa('[data-open]').forEach((el) => { el.addEventListener('click', (e) => openClick(el, e)); el.addEventListener('auxclick', (e) => openAux(el, e)); el.addEventListener('contextmenu', (e) => openCtx(el, e)); });
  qa('[data-rm]').forEach((el) => el.addEventListener('click', (e) => rmRecent(e, el.dataset.rm!)));
  qa('[data-tab]:not(.ptab)').forEach((a) => a.addEventListener('click', () => { S.tab = a.dataset.tab!; render(); $('.main')!.scrollTop = 0; }));
  qa('[data-compare]').forEach((b) => b.addEventListener('click', () => { const [repo, br] = b.dataset.compare!.split('@'); openNewPr(repo, br); }));
  qa('[data-pdismiss]').forEach((b) => b.addEventListener('click', () => { pushDis[b.dataset.pdismiss!] = 1; localStorage.setItem('pushdismiss', JSON.stringify(pushDis)); rerender(); }));
  $('#noteall')?.addEventListener('click', () => { S.bell = false; S.view = 'notes'; S.nav = false; render(); });
  qa('[data-nf]').forEach((b) => b.addEventListener('click', () => { S.nf = b.dataset.nf; S.keepScroll = true; render(); S.keepScroll = false; }));
  qa('[data-nread]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const n = S.notes.find((x) => String(x.id) === b.dataset.nread); if (n) { n.read = !n.read; saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; } }));
  qa('[data-ndel]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); S.notes = S.notes.filter((x) => String(x.id) !== b.dataset.ndel); saveNotes(); S.keepScroll = true; render(); S.keepScroll = false; }));
  $('#notecheck')?.addEventListener('click', () => pollNotes());
  $('#noteclear')?.addEventListener('click', () => { S.notes = []; localStorage.setItem('notes', '[]'); S.keepScroll = true; render(); S.keepScroll = false; });
  qa('.note-panel [data-open]').forEach((el) => el.addEventListener('click', () => { S.bell = false; S.notes.forEach((n) => (n.read = true)); localStorage.setItem('notes', JSON.stringify(S.notes)); }));
  const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };
  // Folding only flips a class and the chevron: no redraw, so the scroll position and images stay put.
  syncFoldAll();
  $('#foldallconv')?.addEventListener('click', foldAllConv);
  qa('[data-fold]').forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation(); if ((e.target as HTMLElement).closest<HTMLElement>('a')) return;
    const k = el.dataset.fold, now = !isFolded(k!, el.dataset.def === '1'); S.fold[k!] = now; localStorage.setItem('fold', JSON.stringify(S.fold));
    qa('[data-fold]').forEach((x) => {
      if (x.dataset.fold !== k) return;
      const box = x.closest<HTMLElement>('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'); if (box) box.classList.toggle('folded', now);
      const svg = $('svg', x); if (svg) svg.outerHTML = icon(now ? 'chevron-right' : 'chevron-down');
    });
    repaintSide();
    if (!now && k!.startsWith('f:')) { const fb = el.closest<HTMLElement>('.file'); if (fb && !$('table.diff, .diff-empty', fb)) { rerender(); return; } }
    if (now) return;
    // Opened: make sure the block is on screen (only scroll when part of it is cut off).
    const box = el.closest<HTMLElement>('.fold-sec, .thread, .TLI, .tl-comment, .file, .pg, .sb-item, .pane'), main = $('.main'); if (!box || !main || !main.contains(box)) return;
    const r = box.getBoundingClientRect(), m = main.getBoundingClientRect();
    if (r.bottom > m.bottom - 8 || r.top < m.top) box.scrollIntoView({ block: r.height > m.height * 0.85 ? 'start' : 'center', behavior: 'smooth' });
  }));
  qa('[data-foldall]').forEach((el) => el.addEventListener('click', () => keep(() => { el.dataset.files!.split('\n').forEach((n) => { S.fold['f:' + n] = el.dataset.foldall === 'close'; }); localStorage.setItem('fold', JSON.stringify(S.fold)); })));
  qa('[data-hide]').forEach((el) => el.addEventListener('click', () => keep(() => { S.hide[el.dataset.hide!] = true; localStorage.setItem('hide', JSON.stringify(S.hide)); })));
  qa('[data-show]').forEach((el) => el.addEventListener('click', () => keep(() => { S.hide[el.dataset.show!] = false; localStorage.setItem('hide', JSON.stringify(S.hide)); })));
  qa('[data-who]').forEach((el) => el.addEventListener('click', () => keep(() => { const w = el.dataset.who!; S.who = S.who.includes(w) ? S.who.filter((x) => x !== w) : [...S.who, w]; })));
  qa('[data-whoclear]').forEach((el) => el.addEventListener('click', () => keep(() => { S.who = []; })));
  $('#scrim')?.addEventListener('click', () => keep(() => { S.nav = false; }));
  $('#nextun')?.addEventListener('click', jumpUnresolved);
  $<HTMLSelectElement>('#crange')?.addEventListener('change', (e) => keep(() => { S.range = (e.target as HTMLInputElement).value; if (S.range === 'custom' && !S.rFrom && !S.rTo) { const d = (t: number) => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); S.rTo = d(Date.now()); S.rFrom = d(Date.now() - 7 * 864e5); } }));
  $<HTMLInputElement>('#cfrom')?.addEventListener('change', (e) => keep(() => { S.rFrom = (e.target as HTMLInputElement).value; }));
  $<HTMLInputElement>('#cto')?.addEventListener('change', (e) => keep(() => { S.rTo = (e.target as HTMLInputElement).value; }));
  $('#csort')?.addEventListener('click', () => keep(() => { S.sort = S.sort === 'desc' ? 'asc' : 'desc'; localStorage.setItem('csort', S.sort); }));
  $('#unres')?.addEventListener('click', () => keep(() => { S.unres = !S.unres; }));
  if (!scope) { (S.ios || []).forEach((o) => o.disconnect()); S.ios = []; }
  if (!scope) { const mn = $('.main')!; if (mn && S.view === 'pr') { let raf = 0; mn.addEventListener('scroll', () => { if (S.restoring || raf) return; raf = requestAnimationFrame(() => { raf = 0; const t = S.tabs[tabIdx()]; if (t) { t.scroll = mn.scrollTop; t.tab = S.tab; } }); }, { passive: true }); } }
  if (!scope) bindSticky();
  $('#sidetoggle')?.addEventListener('click', () => keep(() => { S.hide.side = !S.hide.side; localStorage.setItem('hide', JSON.stringify(S.hide)); }));
  qa('[data-flip]').forEach((b) => b.addEventListener('click', flipSides));
  $('#split')?.addEventListener('click', () => keep(() => { S.split = !S.split; localStorage.setItem('split', S.split ? '1' : '0'); }));
  qa('[data-sha]').forEach((el) => el.addEventListener('click', () => selectCommit(el.dataset.sha!)));
  $('#sbgrip')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); const sh = $('.shell'), x0 = e.clientX, w0 = S.sbw;
    const mv = (ev: MouseEvent) => { S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0)); sh!.style.setProperty('--sbw', S.sbw + 'px'); };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging'); localStorage.setItem('sbw', String(Math.round(S.sbw))); };
    document.body.classList.add('dragging'); addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
  $('#sbgrip')?.addEventListener('dblclick', () => { S.sbw = 260; localStorage.setItem('sbw', '260'); S.keepScroll = true; render(); S.keepScroll = false; });
  $('#gutter')?.addEventListener('mousedown', (e) => {
    e.preventDefault(); const sp = $('.split'), r = sp!.getBoundingClientRect();
    const mv = (ev: MouseEvent) => { S.lw = Math.max(25, Math.min(75, ((S.flip ? r.right - ev.clientX : ev.clientX - r.left) / r.width) * 100)); sp!.style.setProperty('--lw', S.lw + '%'); };
    const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging'); localStorage.setItem('lw', String(Math.round(S.lw))); };
    document.body.classList.add('dragging'); addEventListener('mousemove', mv); addEventListener('mouseup', up);
  });
  $('#rvtoggle')?.addEventListener('click', () => { S.showAllReviewers = !S.showAllReviewers; S.keepScroll = true; render(); S.keepScroll = false; });
  $('#copybranch')?.addEventListener('click', () => navigator.clipboard?.writeText(S.bundle!.pull.head.ref));
  if (!scope) qa('a[href]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); const h = a.getAttribute('href');
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(h!)) openPr(h!); else if (/^https?:\/\//.test(h!)) openExternal(h!);
  }));
}


document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey)) { if (e.key === 'Escape' && S.dlg) closeDlg(); return; }
  if (e.key === 'l') { e.preventDefault(); focusAddr(); }
  else if (e.key === 'r') { e.preventDefault(); reload(); }
  else if (e.key === '[') { e.preventDefault(); go(-1); }
  else if (e.key === ']') { e.preventDefault(); go(1); }
  else if (e.key === ',') { e.preventDefault(); tokenDialog(); }
});
