import { HelpDialog, Palette } from '../components/Dialogs';
import { appState } from './core';
import { setSlot } from './frame';
import { openPr } from './nav';

import type { PalRow } from '../types';

// The quick-open palette and the shortcuts sheet are plain state (S.pal), painted into their own host on <body>.

const rowsFor = (raw: string): PalRow[] => {
  const query = raw.trim().toLowerCase();

  const rows = appState.recent
    .filter(
      recentEntry =>
        !query ||
        `${recentEntry.ref} ${recentEntry.title}`.toLowerCase().includes(query),
    )
    .slice(0, 8)
    .map(recentEntry => ({
      ref: recentEntry.ref,
      label: recentEntry.title,
      sub: recentEntry.ref,
    }));

  if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(query)) {
    rows.unshift({
      ref: raw.trim(),
      label: `Open ${raw.trim()}`,
      sub: 'Go to this pull request',
    });
  }

  return rows;
};

export function closePal() {
  appState.pal = null;
  paintPal();
}

function go(row: { ref: string } | undefined) {
  closePal();

  if (row) {
    appState.nav = false;
    appState.focus = '';
    openPr(row.ref);
  }
}

function paintPal() {
  const value = appState.pal;

  if (!value) {
    setSlot('pal', null);

    return;
  }

  if (value.k === 'help') {
    setSlot('pal', <HelpDialog close={closePal} />);

    return;
  }

  const rows = rowsFor(value.q);
  const sel = Math.min(value.sel, Math.max(0, rows.length - 1));

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePal();
    } else if (event.key === 'ArrowDown') {
      value.sel = Math.min(rows.length - 1, sel + 1);
      paintPal();
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      value.sel = Math.max(0, sel - 1);
      paintPal();
      event.preventDefault();
    } else if (event.key === 'Enter') {
      go(rows[sel]);
    }
  };

  setSlot(
    'pal',
    <Palette
      q={value.q}
      rows={rows}
      sel={sel}
      onQ={otherValue => {
        value.q = otherValue;
        value.sel = 0;
        paintPal();
      }}
      onKey={onKey}
      pick={index => go(rows[index])}
      close={closePal}
    />,
  );
}

export function openPalette() {
  if (appState.pal) {
    return;
  }

  appState.pal = { k: 'pal', q: '', sel: 0 };
  paintPal();
}

export function showHelp() {
  if (appState.pal) {
    return;
  }

  appState.pal = { k: 'help' };
  paintPal();
}

export const helpKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && appState.pal?.k === 'help') {
    closePal();
  }
};
