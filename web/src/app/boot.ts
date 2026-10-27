import { loadProfile } from './addressbar';
import { S, icon, tauri } from './core';
import { pollNotes, qc } from './data';
import { setComposer } from './keyboard';
import { loadRepos, openPr } from './nav';
import { render } from './pages';

export const q = new URLSearchParams(location.search);

if (q.get('mode')) S.mode = q.get('mode');

if (q.get('tab')) S.tab = q.get('tab');

if (q.get('split')) S.split = q.get('split') === '1';

if (tauri) tauri.invoke('has_token').then((v) => { S.hasToken = v; S.authChecked = true; render(); if (v) { loadRepos(); loadProfile(); } }).catch(() => { S.authChecked = true; S.hasToken = false; render(); });

render();

if (q.get('fixture')) openPr(q.get('fixture')).then(() => { if (q.get('tab')) { S.tab = q.get('tab'); render(); } });
else if (tauri) tauri.invoke('initial_arg').then((arg) => { if (arg) openPr(arg); else { S.view = 'home'; render(); } });


setInterval(pollNotes, 60000);
 setTimeout(pollNotes, 4000);

// refetchOnWindowFocus: coming back to the app tops up a PR that has gone stale.
addEventListener('focus', () => { const b = S.bundle; if (!tauri || !b || S.view !== 'pr' || S.loading || S.refreshing) return; const k = `${b.pull.base.repo.full_name}#${b.pull.number}`; if (!qc.fresh(k, 60000)) openPr(k, { nav: true, keepTab: true }); });

setTimeout(pollNotes, 8000);

if (new URLSearchParams(location.search).get('demonote')) { S.notes = [{ id: 1, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: '3 new commits, 2 new comments', at: new Date().toISOString(), read: false }, { id: 2, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: 'now merged', at: new Date(Date.now() - 36e5).toISOString(), read: true }]; S.bell = true; render(); }


// Check GitHub Releases for a newer signed build a few seconds after launch, then again every 6 hours.
export async function checkUpdate() {
  const up = window.__TAURI__?.updater; if (!up || S.update?.busy) return;
  try { const u = await up.check(); if (u) { S.update = { version: u.version, obj: u }; render(); } } catch {}
}

if (tauri) { setTimeout(checkUpdate, 6000); setInterval(checkUpdate, 6 * 3600 * 1000); }


// Scroll-to-top: a round button appears once you are well down the page (or a split-view pane) and takes you back up.
(() => {
  let target = null, btn = null, lastTop = 0, atEnd = false, auto = false;
  const ensure = () => { if (btn) return btn; btn = document.createElement('button'); btn.id = 'totop'; btn.title = 'Back to top'; btn.setAttribute('aria-label', 'Back to top'); btn.innerHTML = icon('chevron-up'); btn.hidden = true; btn.onclick = () => { (target && document.contains(target) ? target : document.querySelector('.main'))?.scrollTo({ top: 0, behavior: 'smooth' }); }; document.body.appendChild(btn); return btn; };
  document.addEventListener('scroll', (e) => {
    const el = e.target; if (!(el instanceof Element) || !el.matches('.main, .pane-body')) return;
    target = el; ensure().hidden = el.scrollTop < 600;
    // The comment bar opens by itself when you reach the end of the thread, and folds away again when you scroll back up.
    const c = document.getElementById('composer'); if (!c || !el.contains(c)) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight, up = el.scrollTop < lastTop; lastTop = el.scrollTop;
    if (dist < 24 && !atEnd) { atEnd = true; if (c.classList.contains('collapsed')) { setComposer(true, false); auto = true; } }
    if (dist > c.offsetHeight + 60) { atEnd = false; if (up && !c.classList.contains('collapsed') && !(S.draft.comment || '').trim()) { c.contains(document.activeElement) && document.activeElement.blur(); setComposer(false); } }
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Home' && !e.target.closest?.('input, textarea, select, [contenteditable]') && target) { e.preventDefault(); target.scrollTo({ top: 0, behavior: 'smooth' }); } });
})();
