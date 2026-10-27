import { rerender } from './actions';
import { $, S, qa } from './core';
import { flipSides } from './mergebox';
import { openNewPr } from './pages';
import { openPalette, showHelp } from './palette';
import { closeTab, openTab, reopenTab, stepTab, tabIdx } from './tabs';

// ---- Keyboard shortcuts: j/k comments, r reply, [ ] unresolved threads, cmd+K quick open, ? help ----
export const typing = (t: EventTarget | null) => t && ((t as HTMLElement).closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || (t as HTMLElement).isContentEditable);

export const kbItems = () => [...qa('.main .tl-comment, .main .tc')].filter((e) => e.offsetParent);

// The focused comment is state (S.kbId): the views draw the `kb` class from it.
export function kbGo(el: HTMLElement) {
  if (!el) return;
  S.kbId = el.id; rerender();
  document.getElementById(el.id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

export const kbCur = () => (S.kbId && document.getElementById(S.kbId)) || null;

export function kbStep(dir: number, pick = kbItems) {
  const items = pick(), cur = kbCur(); if (!items.length) return;
  let i = cur ? items.indexOf(cur) : -1;
  if (i === -1 && cur) i = items.findIndex((e) => cur.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
  kbGo(items[Math.min(items.length - 1, Math.max(0, i + dir))]);
}

export const openThreads = () => [...qa<HTMLElement>('.main .thread')].filter((t) => !$('.thread-head .res', t) && t.offsetParent).map((t) => $<HTMLElement>('.tc', t)!).filter(Boolean);

export function setComposer(open: boolean, focus?: boolean) {
  const el = document.getElementById('composer'); if (!el) return false;
  S.cOpen = open; rerender();
  if (open && focus) { let tries = 0; const t = setInterval(() => { const pm = $('.ProseMirror', document.getElementById('composer') || el); if (pm) { pm.focus(); clearInterval(t); } else if (++tries > 25) clearInterval(t); }, 60); }
  return true;
}

document.addEventListener('mousedown', (e) => { if (S.tabMenu && !(e.target as HTMLElement).closest<HTMLElement>('.pt-menu, #tabadd')) { S.tabMenu = false; rerender(); } });

document.addEventListener('keydown', (e) => {
  if (S.tabMenu && e.key === 'Escape') { S.tabMenu = false; rerender(); return; }
  if ((e.metaKey || e.ctrlKey) && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 't' && !e.shiftKey) { e.preventDefault(); S.tabMenu = !S.tabMenu; if (!S.tabs.length) S.tabMenu = true; rerender(); return; }
    if (k === 't' && e.shiftKey) { e.preventDefault(); reopenTab(); return; }
    if (k === 'w' && S.tabs.length && tabIdx() >= 0) { e.preventDefault(); closeTab(tabIdx()); return; }
    if (/^[1-9]$/.test(k) && S.tabs[+k - 1]) { e.preventDefault(); openTab(S.tabs[+k - 1].ref); return; }
    if (e.key === 'Tab' && e.ctrlKey) { e.preventDefault(); stepTab(e.shiftKey ? -1 : 1); return; }
  }
  if (e.key === 'Escape' && !e.defaultPrevented && (e.target as HTMLElement).closest?.('#composer') && !$('.tt-slash')) { e.preventDefault(); (e.target as HTMLElement).blur?.(); setComposer(false); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || $('.palette, .dlg-bg')) return;
  if (e.key === 'j') kbStep(1); else if (e.key === 'k') kbStep(-1);
  else if (e.key === ']') kbStep(1, openThreads!); else if (e.key === '[') kbStep(-1, openThreads!);
  else if (e.key === '?') showHelp();
  else if (e.key === 'n') { e.preventDefault(); openNewPr(); }
  else if (e.key === 'c' && S.view === 'pr' && document.getElementById('composer')) { e.preventDefault(); setComposer(true, true); }
  else if (e.key === 'f' && $('.split')) flipSides();
  else if (e.key === 's' && S.bundle) { $('#split')?.click(); }
  else if (e.key === 'd' && S.bundle) { const b = $(`[data-dmode="${S.diffMode === 'split' ? 'unified' : 'split'}"]`)!; if (b) b.click(); else { S.diffMode = S.diffMode === 'split' ? 'unified' : 'split'; localStorage.setItem('diffmode', S.diffMode); } }
  else if (e.key === 'r') {
    const cur = kbCur(), host = cur?.closest<HTMLElement>('.thread')?.querySelector('.reply .tt');
    if (!host) { if (document.getElementById('composer')) { e.preventDefault(); setComposer(true, true); } return; } e.preventDefault(); host.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let tries = 0; const t = setInterval(() => { const pm = $('.ProseMirror', host); if (pm) { pm.focus(); clearInterval(t); } else if (++tries > 20) clearInterval(t); }, 80);
  }
});
