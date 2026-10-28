import { appState, tauri } from './core';
import { paintDlg } from './dialogs';
import { loadRepos } from './nav';
import { loadInbox, render } from './pages';

// The checklist needs every repository once; the sidebar, inbox and notifications then fetch only the ticked ones.
export function repoPickOpen() {
  appState.rpick = {
    all: null,
    on: (appState.repoSel || []).map(repoSummary => repoSummary.full_name),
    q: '',
    err: '',
  };

  appState.dlg = { k: 'repos' };
  render();

  tauri
    ?.invoke('list_repos')
    .then(repoSummarys => {
      if (appState.rpick) {
        appState.rpick.all = repoSummarys.filter(
          repoSummary => !repoSummary.archived,
        );

        paintDlg();
      }
    })
    .catch(value => {
      if (appState.rpick) {
        appState.rpick.err = String(value).replace(/^Error: /, '');
        appState.rpick.all = [];
        paintDlg();
      }
    });
}

export function repoPickSave() {
  const props = appState.rpick;

  if (!props?.all) {
    return;
  }

  const keep = new Set(props.on);

  const chosen = [...props.all, ...(appState.repoSel || [])].filter(
    (repoSummary, index, repoSummarys) =>
      keep.has(repoSummary.full_name) &&
      repoSummarys.findIndex(
        otherRepoSummary =>
          otherRepoSummary.full_name === repoSummary.full_name,
      ) === index,
  );

  appState.repoSel =
    chosen.length && chosen.length < props.all.length ? chosen : null;

  try {
    if (appState.repoSel) {
      localStorage.setItem('repoSel', JSON.stringify(appState.repoSel));
    } else {
      localStorage.removeItem('repoSel');
    }
  } catch {
    /* storage full */
  }

  appState.rpick = null;
  appState.dlg = null;
  appState.repo = null;
  appState.sideTab = 'repos';
  appState.inbox = null;
  appState.repos = appState.repoSel;

  if (!appState.repoSel) {
    loadRepos();
  } else {
    render();
  }

  if (appState.view === 'inbox') {
    loadInbox(true);
  }
}
