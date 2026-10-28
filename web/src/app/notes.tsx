import { NotePanel } from '../components/NotePanel';
import { openAux, openClick, openCtx } from './bind';
import { S, whenParts } from './core';
import { pollNotes } from './data';
import { setSlot } from './frame';
import { render, saveNotes } from './pages';
import { paintTop } from './top';

import type { NoteHandlers } from '../components/NotePanel';

// The notifications drawer is state (S.bell, S.notes) painted into its own host; opening or closing never redraws the page underneath.
export function paintNotes() {
  setSlot(
    'notes',
    <NotePanel
      open={S.bell}
      rows={S.notes.map(n => ({
        id: n.id,
        ref: n.ref,
        target: n.target || '',
        read: !!n.read,
        title: n.title,
        text: n.text,
        when: whenParts(n.at).text,
      }))}
      on={noteOn}
    />,
  );
}

export function setBell(open: boolean) {
  S.bell = open;

  if (!open && S.notes.some(n => !n.read)) {
    S.notes.forEach(n => {
      n.read = true;
    });

    saveNotes();
    paintTop();
  }

  paintNotes();
}

const keepRender = () => {
  S.keepScroll = true;
  render();
  S.keepScroll = false;
};

const row = (e: Event) => e.currentTarget as HTMLElement;

function noteAll() {
  S.bell = false;
  S.view = 'notes';
  S.nav = false;
  render();
}

function noteClear() {
  S.notes = [];
  localStorage.setItem('notes', '[]');
  keepRender();
}

function noteOpen(e: MouseEvent) {
  openClick(row(e), e);
  S.bell = false;

  S.notes.forEach(n => {
    n.read = true;
  });

  saveNotes();
}

const noteOn: NoteHandlers = {
  all: noteAll,
  check: () => {
    pollNotes();
  },
  clear: noteClear,
  open: noteOpen,
  aux: e => openAux(row(e), e),
  ctx: e => openCtx(row(e), e),
};

// Click outside (or Esc) closes the drawer; closing marks everything read.
export function notesAway(e: MouseEvent) {
  if (
    !S.bell ||
    (e.target as HTMLElement).closest<HTMLElement>('.note-panel, #bell')
  ) {
    return;
  }

  setBell(false);
}

export const notesKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && S.bell) {
    setBell(false);
  }
};
