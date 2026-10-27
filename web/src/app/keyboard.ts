import { rerender } from './actions';
import { $, S, esc } from './core';
import { flipSides } from './mergebox';
import { openPr } from './nav';
import { openNewPr } from './pages';
import { closeTab, openTab, reopenTab, stepTab, tabIdx } from './tabs';

// ---- Keyboard shortcuts: j/k comments, r reply, [ ] unresolved threads, cmd+K quick open, ? help ----
export const typing = (t) => t && (t.closest?.('input, textarea, select, [contenteditable="true"], .ProseMirror') || t.isContentEditable);

export const kbItems = () => [...document.querySelectorAll('.main .tl-comment, .main .tc')].filter((e) => e.offsetParent);

export function kbGo(el) {
  if (!el) return;
  document.querySelectorAll('.kb').forEach((x) => x.classList.remove('kb'));
  el.classList.add('kb'); S.kbId = el.id; el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

export const kbCur = () => (S.kbId && document.getElementById(S.kbId)) || null;

export function kbStep(dir, pick = kbItems) {
  const items = pick(), cur = kbCur(); if (!items.length) return;
  let i = cur ? items.indexOf(cur) : -1;
  if (i === -1 && cur) i = items.findIndex((e) => cur.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) - (dir > 0 ? 1 : 0);
  kbGo(items[Math.min(items.length - 1, Math.max(0, i + dir))]);
}

export const openThreads = () => [...document.querySelectorAll('.main .thread')].filter((t) => !t.querySelector('.thread-head .res') && t.offsetParent).map((t) => t.querySelector('.tc')).filter(Boolean);

export function openPalette() {
  if (document.querySelector('.palette')) return;
  const el = document.createElement('div'); el.className = 'dlg-bg palette';
  el.innerHTML = '<div class="dlg pal"><input class="pal-in" placeholder="Jump to a pull request — owner/repo#123, a URL, or search recent…" autofocus><div class="pal-list"></div></div>';
  document.body.appendChild(el);
  const inp = el.querySelector('input'), list = el.querySelector('.pal-list'); let sel = 0, rows = [];
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    rows = S.recent.filter((r) => !q || `${r.ref} ${r.title}`.toLowerCase().includes(q)).slice(0, 8).map((r) => ({ ref: r.ref, label: r.title, sub: r.ref }));
    if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q)) rows.unshift({ ref: inp.value.trim(), label: `Open ${inp.value.trim()}`, sub: 'Go to this pull request' });
    sel = Math.min(sel, Math.max(0, rows.length - 1));
    list.innerHTML = rows.map((r, i) => `<div class="pal-row${i === sel ? ' on' : ''}" data-i="${i}"><b>${esc(r.label)}</b><i>${esc(r.sub)}</i></div>`).join('') || '<div class="pal-none">No matches</div>';
  };
  const go = (r) => { el.remove(); if (r) { S.nav = false; S.focus = ''; openPr(r.ref); } };
  inp.addEventListener('input', () => { sel = 0; draw(); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') el.remove();
    else if (e.key === 'ArrowDown') { sel = Math.min(rows.length - 1, sel + 1); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
    else if (e.key === 'Enter') go(rows[sel]);
  });
  list.addEventListener('mousedown', (e) => { const r = e.target.closest('.pal-row'); if (r) go(rows[+r.dataset.i]); });
  el.addEventListener('mousedown', (e) => { if (e.target === el) el.remove(); });
  draw(); inp.focus();
}

export function setComposer(open, focus?) {
  const el = document.getElementById('composer'); if (!el) return false;
  S.cOpen = open; el.classList.toggle('collapsed', !open);
  if (open && focus) { let tries = 0; const t = setInterval(() => { const pm = el.querySelector('.ProseMirror'); if (pm) { pm.focus(); clearInterval(t); } else if (++tries > 25) clearInterval(t); }, 60); }
  return true;
}

export function showHelp() {
  if (document.querySelector('.palette')) return;
  const el = document.createElement('div'); el.className = 'dlg-bg palette';
  const k = (a, b) => `<div class="kb-r"><span>${a}</span><kbd>${b}</kbd></div>`;
  el.innerHTML = `<div class="dlg pal"><h2>Keyboard shortcuts</h2>${k('Jump to any pull request', '⌘ K')}${k('Next / previous comment', 'j / k')}${k('Next / previous unresolved thread', '] / [')}${k('Reply to the selected comment', 'r')}${k('Write a comment (docked at the bottom)', 'c')}${k('New pull request', 'n')}${k('New tab / close tab / reopen closed', '⌘T · ⌘W · ⌘⇧T')}${k('Go to tab 1–9 / next tab', '⌘1–9 · ⌃Tab')}${k('Open a PR in a new tab', '⌘-click')}${k('Turn Split view on / off', 's')}${k('Swap the two sides of Split view', 'f')}${k('Diff: unified ⇄ side-by-side', 'd')}${k('Show this help', '?')}${k('Close dialogs and menus', 'Esc')}</div>`;
  document.body.appendChild(el); el.addEventListener('mousedown', () => el.remove());
  const esc2 = (e) => { if (e.key === 'Escape') { el.remove(); removeEventListener('keydown', esc2); } }; addEventListener('keydown', esc2);
}

document.addEventListener('mousedown', (e) => { if (S.tabMenu && !e.target.closest('.pt-menu, #tabadd')) { S.tabMenu = false; rerender(); } });

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
  if (e.key === 'Escape' && !e.defaultPrevented && e.target.closest?.('#composer') && !document.querySelector('.tt-slash')) { e.preventDefault(); e.target.blur?.(); setComposer(false); return; }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('.palette, .dlg-bg')) return;
  if (e.key === 'j') kbStep(1); else if (e.key === 'k') kbStep(-1);
  else if (e.key === ']') kbStep(1, openThreads); else if (e.key === '[') kbStep(-1, openThreads);
  else if (e.key === '?') showHelp();
  else if (e.key === 'n') { e.preventDefault(); openNewPr(); }
  else if (e.key === 'c' && S.view === 'pr' && document.getElementById('composer')) { e.preventDefault(); setComposer(true, true); }
  else if (e.key === 'f' && document.querySelector('.split')) flipSides();
  else if (e.key === 's' && S.bundle) { $('#split')?.click(); }
  else if (e.key === 'd' && S.bundle) { const b = document.querySelector(`[data-dmode="${S.diffMode === 'split' ? 'unified' : 'split'}"]`); if (b) b.click(); else { S.diffMode = S.diffMode === 'split' ? 'unified' : 'split'; localStorage.setItem('diffmode', S.diffMode); } }
  else if (e.key === 'r') {
    const cur = kbCur(), host = cur?.closest('.thread')?.querySelector('.reply .tt');
    if (!host) { if (document.getElementById('composer')) { e.preventDefault(); setComposer(true, true); } return; } e.preventDefault(); host.scrollIntoView({ block: 'center', behavior: 'smooth' });
    let tries = 0; const t = setInterval(() => { const pm = host.querySelector('.ProseMirror'); if (pm) { pm.focus(); clearInterval(t); } else if (++tries > 20) clearInterval(t); }, 80);
  }
});
