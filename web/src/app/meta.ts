import { S, tauri } from './core';
import { paintDlg } from './dialogs';
import { prRef, refreshPr } from './actions';
import { render } from './pages';

export type MetaField = 'labels' | 'assignees' | 'milestone';

// The gear in the PR side panel: pick labels, assignees or a milestone and save them to GitHub.
export function metaOpen(field: MetaField) {
  const p = S.bundle!.pull;
  const on = field === 'labels' ? p.labels.map((l) => l.name) : field === 'assignees' ? p.assignees.map((u) => u.login) : p.milestone ? [String(p.milestone.number ?? '')] : [];
  S.meta = { field, items: null, on, q: '', err: '', busy: false }; S.dlg = { k: 'meta' }; render();
  tauri?.invoke('pr_meta_options', { repo: prRef().repo, field }).then((l) => { if (S.meta) { S.meta.items = l; paintDlg(); } }).catch((e) => { if (S.meta) { S.meta.err = String(e).replace(/^Error: /, ''); S.meta.items = []; paintDlg(); } });
}

export async function metaSave() {
  const m = S.meta; if (!m || m.busy || !tauri) return;
  m.busy = true; m.err = ''; paintDlg();
  try { await tauri.invoke('pr_meta_set', { ...prRef(), field: m.field, values: m.on }); S.meta = null; S.dlg = null; await refreshPr(); }
  catch (e) { m.busy = false; m.err = String(e).replace(/^Error: /, ''); paintDlg(); }
}
