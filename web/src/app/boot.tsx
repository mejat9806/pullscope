import { paintToTop } from './scrolling';
import { bpAway, loadProfile } from './addressbar';
import { S, tauri } from './core';
import { pollNotes, qc } from './data';
import { loadRepos, openPr } from './nav';
import { render } from './pages';
import { setGlobals } from './frame';
import { noteClick } from './actions';
import { closePop } from './dialogs';
import { ripple } from './fun';
import { restoreZoom, zoomKey, zoomWheel } from './zoom';
import { menuAway, shortcut } from './keyboard';
import { goOffline, goOnline } from './listeners';
import { notesAway, notesKey } from './notes';
import { helpKey } from './palette';
import { homeKey } from './scrolling';

export const q = new URLSearchParams(location.search);

if (q.get('mode')) S.mode = q.get('mode')!;

if (q.get('tab')) S.tab = q.get('tab')!;

if (q.get('split')) S.split = q.get('split') === '1';

if (tauri) tauri!.invoke('has_token').then((v) => { S.hasToken = v; S.authChecked = true; render(); if (v) { loadRepos(); loadProfile(); } }).catch(() => { S.authChecked = true; S.hasToken = false; render(); });

restoreZoom(); window.__TAURI__?.app?.getVersion?.().then((v) => { S.ver = v; }).catch(() => {});
setGlobals({
  pointerDown: (e) => ripple(e), clickCapture: (e) => noteClick(e), click: () => closePop(), mouseDown: (e) => { menuAway(e); notesAway(e); bpAway(e); },
  key: (e) => { zoomKey(e); shortcut(e); notesKey(e); helpKey(e); homeKey(e); }, wheel: (e) => zoomWheel(e), focus: () => refocus(), online: () => goOnline(), offline: () => goOffline(),
});

render();

if (q.get('fixture')) openPr(q.get('fixture')!).then(() => { if (q.get('tab')) { S.tab = q.get('tab')!; render(); } });
else if (tauri) tauri!.invoke('initial_arg').then((arg) => { if (arg) openPr(arg); else { S.view = 'home'; render(); } });


setInterval(pollNotes, 60000);
 setTimeout(pollNotes, 4000);

// refetchOnWindowFocus: coming back to the app tops up a PR that has gone stale.
export const refocus = () => { const b = S.bundle; if (!tauri || !b || S.view !== 'pr' || S.loading || S.refreshing) return; const k = `${b.pull.base.repo.full_name}#${b.pull.number}`; if (!qc.fresh(k, 60000)) openPr(k, { nav: true, keepTab: true }); };

setTimeout(pollNotes, 8000);

if (new URLSearchParams(location.search).get('demonote')) { S.notes = [{ id: 1, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: '3 new commits, 2 new comments', at: new Date().toISOString(), read: false }, { id: 2, ref: 'octocat/Hello-World#6', title: 'New line at end of file.', text: 'now merged', at: new Date(Date.now() - 36e5).toISOString(), read: true }]; S.bell = true; render(); }


// Check GitHub Releases for a newer signed build a few seconds after launch, then again every 6 hours.
export async function checkUpdate() {
  const up = window.__TAURI__?.updater; if (!up || S.update?.busy) return;
  try { const u = await up.check(); if (u) { S.update = { version: u.version, obj: u }; render(); } } catch {}
}

if (tauri) { setTimeout(checkUpdate, 6000); setInterval(checkUpdate, 6 * 3600 * 1000); }


paintToTop();
