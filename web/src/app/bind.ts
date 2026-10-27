import { drafts, rerender, saveDrafts } from './actions';
import { closePop, openPop } from './dialogs';
import { openFromList } from './addressbar';
import { isFolded } from './comments';
import { $, KEY_RECENT, S } from './core';
import { loadPr, qc } from './data';
import { loadPrs, openPr } from './nav';
import { render, repaintShell, saveNotes, setDragging, shownPage } from './pages';
import type { FoldKey } from './timeline';
import { curRef, saveTabs, tabIdx, tabSnap } from './tabs';

// Browser-style tabs: leaving a PR tab keeps its page (DOM, scroll, open editors) alive; coming back swaps it in with no redraw.
S.alive = new Map();

export const aliveKey = () => [S.diffMode, S.split, JSON.stringify(S.hide), S.sbw].join('|');

export function stashCurrent() { S.openSeq = (S.openSeq || 0) + 1;
  const ref = S.view === 'pr' && S.bundle ? curRef() : '', m = $('.main'), sh = shownPage();
  if (!ref || !m || !sh || sh.ref !== ref || !S.tabs.some((t) => t.ref === ref)) return;
  S.alive.set(ref, { vnode: sh.vnode, bundle: S.bundle!, tab: S.tab, key: aliveKey(), scroll: m.scrollTop });
  while (S.alive.size > 6) { const old = S.alive.keys().next().value!; S.alive.delete(old); }
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
  // The parked page goes back in untouched (same vnode: no diff, scroll and editors as they were).
  S.stash = a; render();
  $('.main')!.scrollTop = a.scroll;
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

// "Collapse all conversations" flips every fold in the timeline; the label says what the next click does.
export function foldAllConv(keys: FoldKey[]) {
  if (!keys.length) return;
  const now = keys.some((x) => !isFolded(x.k, x.def));
  keys.forEach((x) => { S.fold[x.k] = now; });
  try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* storage full */ }
  rerender();
}

// Shell chrome that is not part of any Preact tree: the sidebar grip, the mobile scrim and the scroll memory of the main pane. Delegated once on the document.
document.addEventListener('mousedown', (e) => {
  if (!(e.target as HTMLElement).closest?.('#sbgrip')) return;
  e.preventDefault(); const x0 = e.clientX, w0 = S.sbw;
  const mv = (ev: MouseEvent) => { S.sbw = Math.max(200, Math.min(560, w0 + ev.clientX - x0)); repaintShell({ sbw: S.sbw }); };
  const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); setDragging(false); localStorage.setItem('sbw', String(Math.round(S.sbw))); };
  setDragging(true); addEventListener('mousemove', mv); addEventListener('mouseup', up);
});
document.addEventListener('dblclick', (e) => { if ((e.target as HTMLElement).closest?.('#sbgrip')) { S.sbw = 260; localStorage.setItem('sbw', '260'); S.keepScroll = true; render(); S.keepScroll = false; } });
document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest?.('#scrim')) { S.nav = false; S.keepScroll = true; render(); S.keepScroll = false; } });
let scrollRaf = 0;
document.addEventListener('scroll', (e) => {
  const mn = e.target as HTMLElement; if (!mn.classList?.contains('main') || S.view !== 'pr' || S.restoring || scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; const t = S.tabs[tabIdx()]; if (t) { t.scroll = mn.scrollTop; t.tab = S.tab; } });
}, { capture: true, passive: true });
