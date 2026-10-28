import { NotePanel } from '../components/NotePanel';
import { openAux, openClick, openCtx } from './bind';
import { appState, whenParts } from './core';
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
      open={appState.bell}
      rows={appState.notes.map(note => ({
        id: note.id,
        ref: note.ref,
        target: note.target || '',
        read: !!note.read,
        title: note.title,
        text: note.text,
        when: whenParts(note.at).text,
      }))}
      on={noteOn}
    />,
  );
}

export function setBell(open: boolean) {
  appState.bell = open;

  if (!open && appState.notes.some(note => !note.read)) {
    appState.notes.forEach(note => {
      note.read = true;
    });

    saveNotes();
    paintTop();
  }

  paintNotes();
}

const keepRender = () => {
  appState.keepScroll = true;
  render();
  appState.keepScroll = false;
};

const row = (event: Event) => event.currentTarget as HTMLElement;

function noteAll() {
  appState.bell = false;
  appState.view = 'notes';
  appState.nav = false;
  render();
}

function noteClear() {
  appState.notes = [];
  localStorage.setItem('notes', '[]');
  keepRender();
}

function noteOpen(event: MouseEvent) {
  openClick(row(event), event);
  appState.bell = false;

  appState.notes.forEach(note => {
    note.read = true;
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
  aux: event => openAux(row(event), event),
  ctx: event => openCtx(row(event), event),
};

// Click outside (or Esc) closes the drawer; closing marks everything read.
export function notesAway(event: MouseEvent) {
  if (
    !appState.bell ||
    (event.target as HTMLElement).closest<HTMLElement>('.note-panel, #bell')
  ) {
    return;
  }

  setBell(false);
}

export const notesKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && appState.bell) {
    setBell(false);
  }
};
