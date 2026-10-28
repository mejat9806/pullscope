import { HelpDialog, Palette } from '../components/Dialogs';
import { S } from './core';
import { setSlot } from './frame';
import { openPr } from './nav';

import type { PalRow } from '../types';

// The quick-open palette and the shortcuts sheet are plain state (S.pal), painted into their own host on <body>.

const rowsFor = (raw: string): PalRow[] => {
  const q = raw.trim().toLowerCase();

  const rows = S.recent
    .filter(r => !q || `${r.ref} ${r.title}`.toLowerCase().includes(q))
    .slice(0, 8)
    .map(r => ({ ref: r.ref, label: r.title, sub: r.ref }));

  if (/^(https?:\/\/github\.com\/|[\w.-]+\/[\w.-]+#\d+)/.test(q)) {
    rows.unshift({
      ref: raw.trim(),
      label: `Open ${raw.trim()}`,
      sub: 'Go to this pull request',
    });
  }

  return rows;
};

export function closePal() {
  S.pal = null;
  paintPal();
}

function go(r: { ref: string } | undefined) {
  closePal();

  if (r) {
    S.nav = false;
    S.focus = '';
    openPr(r.ref);
  }
}

function paintPal() {
  const p = S.pal;

  if (!p) {
    setSlot('pal', null);

    return;
  }

  if (p.k === 'help') {
    setSlot('pal', <HelpDialog close={closePal} />);

    return;
  }

  const rows = rowsFor(p.q);
  const sel = Math.min(p.sel, Math.max(0, rows.length - 1));

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePal();
    } else if (e.key === 'ArrowDown') {
      p.sel = Math.min(rows.length - 1, sel + 1);
      paintPal();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      p.sel = Math.max(0, sel - 1);
      paintPal();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      go(rows[sel]);
    }
  };

  setSlot(
    'pal',
    <Palette
      q={p.q}
      rows={rows}
      sel={sel}
      onQ={v => {
        p.q = v;
        p.sel = 0;
        paintPal();
      }}
      onKey={onKey}
      pick={i => go(rows[i])}
      close={closePal}
    />,
  );
}

export function openPalette() {
  if (S.pal) {
    return;
  }

  S.pal = { k: 'pal', q: '', sel: 0 };
  paintPal();
}

export function showHelp() {
  if (S.pal) {
    return;
  }

  S.pal = { k: 'help' };
  paintPal();
}

export const helpKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && S.pal?.k === 'help') {
    closePal();
  }
};
