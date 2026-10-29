import { appState } from './core';
import { paintDlg } from './dialogs';
import { render } from './pages';

import type { ComponentChild } from 'preact';

// Release notes are the changelog section of a release: ### headings, "- " bullets, **bold**, *italic*, `code`.
const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;

const inline = (text: string): ComponentChild[] =>
  text
    .split(INLINE)
    .filter(Boolean)
    .map(part =>
      part.startsWith('**') ? (
        <b>{part.slice(2, -2)}</b>
      ) : part.startsWith('`') ? (
        <code>{part.slice(1, -1)}</code>
      ) : part.startsWith('*') ? (
        <i>{part.slice(1, -1)}</i>
      ) : (
        part
      ),
    );

export const renderNotes = (body: string): ComponentChild[] => {
  const blocks: ComponentChild[] = [];

  let bullets: ComponentChild[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push(<ul>{bullets}</ul>);
      bullets = [];
    }
  };

  for (const line of body.split('\n')) {
    const text = line.trim();
    const heading = /^#{1,6}\s+(.*)$/.exec(text);

    if (heading) {
      flush();
      blocks.push(<h3>{inline(heading[1])}</h3>);
    } else if (/^[-*]\s+/.test(text)) {
      bullets.push(<li>{inline(text.replace(/^[-*]\s+/, ''))}</li>);
    } else if (text) {
      flush();
      blocks.push(<p>{inline(text)}</p>);
    }
  }

  flush();

  return blocks;
};

const KEY = 'whatsnew';

/** The notes of the version waiting to be installed, shown before the user decides to update. */
export function showUpdateNotes() {
  const item = appState.update;

  if (!item) {
    return;
  }

  appState.dlg = {
    k: 'whatsnew',
    version: item.version,
    body: item.body || '',
    after: false,
  };

  render();
}

export async function installUpdate() {
  const item = appState.update;

  if (!item || item.busy) {
    return;
  }

  item.busy = true;
  appState.dlg = null;
  render();

  // The new version shows these notes once after the restart.
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: item.version, body: item.body || '' }),
    );
  } catch {
    /* storage unavailable */
  }

  try {
    await item.obj.downloadAndInstall();
    await window.__TAURI__!.process.relaunch();
  } catch (error) {
    item.busy = false;
    appState.actErr = { k: 'update', m: `Update failed: ${String(error)}` };
    render();
  }
}

/** After an update: show what changed, once, when the running version is the one that was installed. */
export function showInstalledNotes(running: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      version: string;
      body: string;
    } | null;

    if (!saved) {
      return;
    }

    localStorage.removeItem(KEY);

    if (saved.version === running) {
      appState.dlg = {
        k: 'whatsnew',
        version: saved.version,
        body: saved.body,
        after: true,
      };

      paintDlg();
    }
  } catch {
    /* storage unavailable */
  }
}
