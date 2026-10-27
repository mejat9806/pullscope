import { render as paint } from 'preact';
import { TabStrip } from '../components/TabStrip';
import type { TabHandlers } from '../components/TabStrip';
import { Toolbar } from '../components/Toolbar';
import type { ToolbarHandlers } from '../components/Toolbar';
import { rerender, setBusy } from './actions';
import { setBell } from './notes';
import { avUrl, openExternal, openFromList } from './addressbar';
import { $, S, applyMode, esc, icon, isDark, isOff, tauri } from './core';
import { openPr, reload } from './nav';
import { fastTab, stashCurrent } from './bind';
import { tokenDialog } from './token';
import { openInbox, openNewPr, render } from './pages';
import { go } from './render';
import { closeTab, curRef, reopenTab, saveTabs, tabSnap } from './tabs';

const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };

const mode = (e: MouseEvent) => {
    const btn = e.currentTarget as HTMLElement, r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    S.mode = isDark() ? 'light' : 'dark'; localStorage.setItem('mode', S.mode);
    const swap = () => { applyMode(); btn!.classList.toggle('dark', isDark()); btn!.setAttribute('aria-checked', String(isDark())); btn!.title = `Switch to ${isDark() ? 'light' : 'dark'} mode`; };
    btn!.classList.remove('pop'); void btn!.offsetWidth; btn!.classList.add('pop');
    if (!document.startViewTransition) { swap(); return; }
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('vt');
    document.startViewTransition(swap).ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }).finished.finally(() => document.documentElement.classList.remove('vt')));
};

const prof = (e: MouseEvent) => {
    e.stopPropagation(); const had = $('.prof-pop')!; $('.react-pop')?.remove(); if (had) return;
    const pr = S.profile, pop = document.createElement('div'); pop.className = 'react-pop cm-pop prof-pop';
    pop.innerHTML = `<div class="pp-h"><img src="${esc(avUrl(pr!.avatar_url!, 80))}" alt=""><div><b>${esc(pr!.name || pr!.login)}</b><i>@${esc(pr!.login)}</i></div></div><button data-h="profile">${icon('link-external')} Your GitHub profile</button><button data-h="token">${icon('key')} Access token…</button><button data-h="out" class="danger">Sign out</button>`;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); pop.style.right = Math.max(8, innerWidth - r.right) + 'px'; pop.style.top = r.bottom + 6 + 'px';
    pop.onclick = async (ev) => {
      const h = (ev.target as HTMLElement).closest<HTMLElement>('[data-h]')?.dataset.h; if (!h) return; pop.remove();
      if (h === 'profile') openExternal(pr!.html_url!); else if (h === 'token') tokenDialog();
      else { try { await tauri?.invoke('set_token', { token: '' }); } catch { /* ignore */ } S.hasToken = false; S.profile = null; S.me = ''; S.repos = null; try { localStorage.removeItem('profile'); } catch { /* ignore */ } render(); }
    };
    document.body.appendChild(pop); setTimeout(() => document.addEventListener('click', () => pop.remove(), { once: true }));
};

const tb: ToolbarHandlers = {
  nav: (e) => {
    e.stopPropagation();
    if (matchMedia('(min-width: 901px)').matches) { S.hide.nav = !S.hide.nav; try { localStorage.setItem('hide', JSON.stringify(S.hide)); } catch { /* storage full */ } $('.shell')?.classList.toggle('nav-hidden', S.hide.nav); return; }
    keep(() => { S.nav = !S.nav; });
  },
  back: () => go(-1), fwd: () => go(1), reload, external: () => openExternal(S.bundle!.pull.html_url), mode,
  addr: (e) => { e.preventDefault(); openPr($<HTMLInputElement>('#addrinput')!.value); $<HTMLInputElement>('#addrinput')!.blur(); },
  upd: async () => {
    const u = S.update; if (!u || u.busy) return; u.busy = true; render();
    try { await u.obj.downloadAndInstall(); await window.__TAURI__!.process.relaunch(); }
    catch (e) { u.busy = false; S.actErr = { k: 'update', m: 'Update failed: ' + String(e) }; render(); }
  },
  retry: (ev) => { setBusy(ev.currentTarget as HTMLElement, true); S.offline = navigator.onLine === false; reload(); },
  newPr: () => openNewPr(), inbox: openInbox, bell: (e) => { e.stopPropagation(); setBell(!S.bell); }, signin: tokenDialog, prof,
};

// Drag a tab sideways to reorder (pointer based, so it also works where the webview swallows HTML5 drag and drop).
const tabDown = (e: MouseEvent, from: number) => {
  const el = e.currentTarget as HTMLElement;
  if (e.button !== 0 || (e.target as HTMLElement).closest<HTMLElement>('.pt-x')) return;
  const x0 = e.clientX; let moved = false, to = from;
  const strip = el.parentElement, tabs = [...strip!.querySelectorAll<HTMLElement>('.ptab')];
  const mv = (ev: MouseEvent) => {
    if (!moved && Math.abs(ev.clientX - x0) < 6) return;
    if (!moved) { moved = true; el.classList.add('drag'); document.body.classList.add('dragging'); }
    el.style.transform = `translateX(${ev.clientX - x0}px)`;
    to = tabs.reduce((best, t, i) => { const r = t.getBoundingClientRect(); return ev.clientX > r.left + r.width / 2 ? i : best; }, 0);
    tabs.forEach((t, i) => { if (t !== el) t.style.transform = from < to && i > from && i <= to ? `translateX(-${el.offsetWidth}px)` : from > to && i < from && i >= to ? `translateX(${el.offsetWidth}px)` : ''; });
  };
  const up = () => {
    removeEventListener('mousemove', mv); removeEventListener('mouseup', up); document.body.classList.remove('dragging');
    if (!moved) return;
    el.addEventListener('click', (c) => c.stopImmediatePropagation(), { capture: true, once: true });
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
  add: (e) => { e.stopPropagation(); S.tabMenu = !S.tabMenu; rerender(); },
  fresh: (ref) => openFromList(ref, true),
  home: () => { S.tabMenu = false; S.view = 'home'; render(); },
  reopen: () => { S.tabMenu = false; reopenTab(); },
  menu: (m) => { const a = $('#tabadd'); if (m && a) { const r = a.getBoundingClientRect(); m.style.top = r.bottom + 4 + 'px'; m.style.left = Math.min(r.left, innerWidth - 350) + 'px'; m.style.marginTop = '0'; } },
};

export function Top() {
  const b = S.bundle, pr = S.profile, open = new Set(S.tabs.map((t) => t.ref));
  return (
    <>
      {S.refreshing && <div class="refreshing-bar"></div>}
      <Toolbar
        prRef={b ? `${b.pull.base.repo.full_name}#${b.pull.number}` : ''} hasBundle={!!b} canBack={!(S.hist.length < 2 || S.hi < 1)} canFwd={!(S.hi >= S.hist.length - 1)}
        update={S.update ? { busy: S.update.busy, version: S.update.version } : null} offline={isOff()} unread={S.notes.filter((n) => !n.read).length}
        dark={isDark()} profile={pr} hasToken={S.hasToken} avatar={S.hasToken && pr ? avUrl(pr.avatar_url!, 56) : ''} on={tb} />
      <TabStrip tabs={S.tabs} cur={S.tabPending || curRef()} recents={S.recent.filter((r) => !open.has(r.ref)).slice(0, 8)} menu={S.tabMenu} closedFirst={S.closed.length ? S.closed[0].ref : null} on={ts} />
    </>
  );
}

export const paintTop = (host: HTMLElement) => paint(<Top />, host);
export const clearTop = (host: HTMLElement) => paint(null, host);
