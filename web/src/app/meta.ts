import { prRef, refreshPr } from './actions';
import { appState, tauri } from './core';
import { paintDlg } from './dialogs';
import { render } from './pages';

export type MetaField = 'labels' | 'assignees' | 'milestone';

// The gear in the PR side panel: pick labels, assignees or a milestone and save them to GitHub.
export function metaOpen(field: MetaField) {
  const pull = appState.bundle!.pull;

  const on =
    field === 'labels'
      ? pull.labels.map(label => label.name)
      : field === 'assignees'
        ? pull.assignees.map(user => user.login)
        : pull.milestone
          ? [String(pull.milestone.number ?? '')]
          : [];

  appState.meta = { field, items: null, on, q: '', err: '', busy: false };
  appState.dlg = { k: 'meta' };
  render();

  tauri
    ?.invoke('pr_meta_options', { repo: prRef().repo, field })
    .then(metaItems => {
      if (appState.meta) {
        appState.meta.items = metaItems;
        paintDlg();
      }
    })
    .catch(value => {
      if (appState.meta) {
        appState.meta.err = String(value).replace(/^Error: /, '');
        appState.meta.items = [];
        paintDlg();
      }
    });
}

export async function metaSave() {
  const meta = appState.meta;

  if (!meta || meta.busy || !tauri) {
    return;
  }

  meta.busy = true;
  meta.err = '';
  paintDlg();

  try {
    await tauri.invoke('pr_meta_set', {
      ...prRef(),
      field: meta.field,
      values: meta.on,
    });

    appState.meta = null;
    appState.dlg = null;
    await refreshPr();
  } catch (error) {
    meta.busy = false;
    meta.err = String(error).replace(/^Error: /, '');
    paintDlg();
  }
}
