import { setSlot } from './frame';
import { TabStrip } from '../components/TabStrip';
import type { TabHandlers } from '../components/TabStrip';
import { Toolbar } from '../components/Toolbar';
import type { ToolbarHandlers } from '../components/Toolbar';
import { btnSel, rerender, setBusy } from './actions';
import { setBell } from './notes';
import { closePop, openPop } from './dialogs';
import { avUrl, openExternal, openFromList } from './addressbar';
import { $, S, isDark, isOff, tauri } from './core';
import { openPr, reload } from './nav';
import { fastTab, stashCurrent } from './bind';
import { tokenDialog } from './token';
import { openInbox, openNewPr, render, setDragging } from './pages';
import { go } from './render';
import { closeTab, curRef, reopenTab, saveTabs, tabSnap } from './tabs';

const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };

const mode = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    S.mode = isDark() ? 'light' : 'dark'; localStorage.setItem('mode', S.mode);
    // The switch, its label and the page colours all come from S.mode; the view transition just wraps the repaint.
    const swap = () => { S.themePop = (S.themePop || 0) + 1; keep(() => {}); };
    if (!document.startViewTransition) { swap(); return; }
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }).finished);
};

const prof = (e: MouseEvent) => {
  e.stopPropagation(); if (S.pop?.k === 'prof') { closePop(); return; }
  const pr = S.profile!, r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  openPop({ k: 'prof', right: Math.max(8, innerWidth - r.right), top: r.bottom + 6, name: pr.name || pr.login, login: pr.login, avatar: avUrl(pr.avatar_url!, 80), pick: async (h) => {
    closePop();
    if (h === 'profile') openExternal(pr.html_url!); else if (h === 'token') tokenDialog();
    else { try { await tauri?.invoke('set_token', { token: '' }); } catch { /* ignore */ } S.hasToken = false; S.profile = null; S.me = ''; S.repos = null; try { localStorage.removeItem('profile'); } catch { /* ignore */ } render(); }
  } });
};

const tb: ToolbarHandlers = {
  nav: (e) => {
    e.stopPropagation();
    if (matchMedia('(min-width: 901px)').matches) { S.hide.nav = !S.hide.nav; try { localStorage.setItem('hide', JSON.stringify(S.hide)); } catch { /* storage full */ } keep(() => {}); return; }
    keep(() => { S.nav = !S.nav; });
  },
  back: () => go(-1), fwd: () => go(1), reload, external: () => openExternal(S.bundle!.pull.html_url), mode,
  addr: (e) => { e.preventDefault(); openPr($<HTMLInputElement>('#addrinput')!.value); $<HTMLInputElement>('#addrinput')!.blur(); },
  upd: async () => {
    const u = S.update; if (!u || u.busy) return; u.busy = true; render();
    try { await u.obj.downloadAndInstall(); await window.__TAURI__!.process.relaunch(); }
    catch (e) { u.busy = false; S.actErr = { k: 'update', m: 'Update failed: ' + String(e) }; render(); }
  },
  retry: (ev) => { const sel = btnSel(ev.currentTarget as HTMLElement); setBusy(sel, true); S.offline = navigator.onLine === false; Promise.resolve(reload()).finally(() => setBusy(sel, false)); },
  newPr: () => openNewPr(), inbox: openInbox, bell: (e) => { e.stopPropagation(); setBell(!S.bell); }, signin: tokenDialog, prof,
};

// Drag a tab sideways to reorder (pointer based, so it also works where the webview swallows HTML5 drag and drop). The drag is state (S.drag) that the tab strip draws.
const tabDown = (e: MouseEvent, from: number) => {
  const el = e.currentTarget as HTMLElement;
  if (e.button !== 0 || (e.target as HTMLElement).closest<HTMLElement>('.pt-x')) return;
  const x0 = e.clientX, w = el.offsetWidth; let moved = false, to = from;
  const mids = [...el.parentElement!.querySelectorAll<HTMLElement>('.ptab')].map((t) => { const r = t.getBoundingClientRect(); return r.left + r.width / 2; });
  const mv = (ev: MouseEvent) => {
    if (!moved && Math.abs(ev.clientX - x0) < 6) return;
    if (!moved) { moved = true; setDragging(true); }
    to = mids.reduce((best, m, i) => (ev.clientX > m ? i : best), 0);
    S.drag = { from, to, dx: ev.clientX - x0, w }; paintTop();
  };
  const up = () => {
    removeEventListener('mousemove', mv); removeEventListener('mouseup', up); setDragging(false);
    if (!moved) return;
    el.addEventListener('click', (c) => c.stopImmediatePropagation(), { capture: true, once: true });
    S.drag = null;
    if (to !== from) { const [t] = S.tabs.splice(from, 1); S.tabs.splice(to, 0, t); saveTabs(); }
    render();
  };
  addEventListener('mousemove', mv); addEventListener('mouseup', up);
};

const ts: TabHandlers = {
  open: (i) => { const t = S.tabs[i]; if (t.ref !== curRef()) { if (fastTab(t.ref)) return; stashCurrent(); tabSnap(); S.fadeMain = true; S.tabMenu = false; openPr(t.ref, { nav: true, restore: t.tab }); } },
  aux: (e, i) => { if (e.button === 1) { e.preventDefault(); closeTab(i); } },
  down: tabDown,
  close: (e, i) => { e.stopPropagation(); closeTab(i); },
  add: (e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); S.tabMenuAt = { top: r.bottom + 4, left: Math.min(r.left, innerWidth - 350) }; S.tabMenu = !S.tabMenu; rerender(); },
  fresh: (ref) => openFromList(ref, true),
  home: () => { S.tabMenu = false; S.view = 'home'; render(); },
  reopen: () => { S.tabMenu = false; reopenTab(); },
};

export function Top() {
  const b = S.bundle, pr = S.profile, open = new Set(S.tabs.map((t) => t.ref));
  return (
    <>
      {S.refreshing && <div class="refreshing-bar"></div>}
      <Toolbar
        prRef={b ? `${b.pull.base.repo.full_name}#${b.pull.number}` : ''} hasBundle={!!b} canBack={!(S.hist.length < 2 || S.hi < 1)} canFwd={!(S.hi >= S.hist.length - 1)}
        update={S.update ? { busy: S.update.busy, version: S.update.version } : null} offline={isOff()} unread={S.notes.filter((n) => !n.read).length}
        dark={isDark()} pop={S.themePop || 0} profile={pr} hasToken={S.hasToken} avatar={S.hasToken && pr ? avUrl(pr.avatar_url!, 56) : ''} on={tb} />
      <TabStrip tabs={S.tabs} cur={S.tabPending || curRef()} recents={S.recent.filter((r) => !open.has(r.ref)).slice(0, 8)} menu={S.tabMenu} menuAt={S.tabMenuAt || null} drag={S.drag || null} closedFirst={S.closed.length ? S.closed[0].ref : null} on={ts} />
    </>
  );
}

export const paintTop = () => setSlot('top', <Top />);
export const clearTop = () => setSlot('top', null);
