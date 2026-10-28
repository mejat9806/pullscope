import { S, tauri } from './core';
import { loadRepos } from './nav';
import { loadInbox, render } from './pages';
import { paintDlg } from './dialogs';

// The checklist needs every repository once; the sidebar, inbox and notifications then fetch only the ticked ones.
export function repoPickOpen() {
  S.rpick = { all: null, on: (S.repoSel || []).map((r) => r.full_name), q: '', err: '' };
  S.dlg = { k: 'repos' }; render();
  tauri?.invoke('list_repos').then((l) => { if (S.rpick) { S.rpick.all = l.filter((r) => !r.archived); paintDlg(); } }).catch((e) => { if (S.rpick) { S.rpick.err = String(e).replace(/^Error: /, ''); S.rpick.all = []; paintDlg(); } });
}

export function repoPickSave() {
  const p = S.rpick; if (!p?.all) return;
  const keep = new Set(p.on), chosen = [...p.all, ...(S.repoSel || [])].filter((r, i, a) => keep.has(r.full_name) && a.findIndex((x) => x.full_name === r.full_name) === i);
  S.repoSel = chosen.length && chosen.length < p.all.length ? chosen : null;
  try { if (S.repoSel) localStorage.setItem('repoSel', JSON.stringify(S.repoSel)); else localStorage.removeItem('repoSel'); } catch { /* storage full */ }
  S.rpick = null; S.dlg = null; S.repo = null; S.sideTab = 'repos'; S.inbox = null;
  S.repos = S.repoSel; if (!S.repoSel) loadRepos(); else render();
  if (S.view === 'inbox') loadInbox(true);
}
