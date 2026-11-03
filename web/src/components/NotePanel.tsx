import { NOTE_TYPES } from '../app/noteTypes';
import { renderIcon } from './ui';

import type { NoteType } from '../app/noteTypes';

export interface NoteRow {
  types: NoteType[];
  id: number;
  ref: string;
  target: string;
  read: boolean;
  title: string;
  text: string;
  when: string;
}

export interface NoteHandlers {
  all: () => void;
  check: () => void;
  clear: () => void;
  filter: (type: NoteType | '') => void;
  open: (event: MouseEvent) => void;
  aux: (event: MouseEvent) => void;
  ctx: (event: MouseEvent) => void;
}

export const NotePanel = ({
  open,
  rows,
  type,
  on,
}: {
  open: boolean;
  rows: NoteRow[];
  type: NoteType | '';
  on: NoteHandlers;
}) => {
  const counts = rows.reduce<Partial<Record<NoteType, number>>>(
    (tally, noteRow) => {
      noteRow.types.forEach(noteType => {
        tally[noteType] = (tally[noteType] ?? 0) + 1;
      });

      return tally;
    },
    {},
  );

  const shown = type
    ? rows.filter(noteRow => noteRow.types.includes(type))
    : rows;

  return (
    <div class={`note-panel${open ? ' open' : ''}`}>
      <div class="note-h">
        <b>Notifications</b>
        <span>
          <button
            title="Open the full notifications page"
            id="noteall"
            onClick={on.all}
          >
            View all
          </button>{' '}
          <button
            title="Look for new activity now"
            id="notecheck"
            onClick={on.check}
          >
            Check now
          </button>{' '}
          <button
            title="Remove all notifications"
            id="noteclear"
            onClick={on.clear}
          >
            Clear all
          </button>
        </span>
      </div>
      {rows.length > 0 && (
        <div class="note-types">
          <button
            class={type ? '' : 'sel'}
            title="Show every kind of notification"
            onClick={() => on.filter('')}
          >
            All <span>{rows.length}</span>
          </button>
          {(Object.keys(NOTE_TYPES) as NoteType[])
            .filter(noteType => counts[noteType])
            .map(noteType => (
              <button
                key={noteType}
                class={type === noteType ? 'sel' : ''}
                title={`Show only ${NOTE_TYPES[noteType].label.toLowerCase()}`}
                onClick={() => on.filter(noteType)}
              >
                {NOTE_TYPES[noteType].label} <span>{counts[noteType]}</span>
              </button>
            ))}
        </div>
      )}
      {shown.length ? (
        shown.map(noteRow => (
          <a
            class={`note ${noteRow.read ? '' : 'new'}`}
            data-open={noteRow.ref}
            data-target={noteRow.target}
            data-note={noteRow.id}
            onClick={on.open}
            onAuxClick={on.aux}
            onContextMenu={on.ctx}
          >
            <em class={`note-badge t-${noteRow.types[0]}`}>
              {renderIcon(NOTE_TYPES[noteRow.types[0]].icon, 16)}
            </em>
            <div class="note-body">
              <div class="note-top">
                <b>{noteRow.title}</b>
                <time>{noteRow.when}</time>
              </div>
              <span>{noteRow.text}</span>
              <div class="note-meta">
                {noteRow.types.map(noteType => (
                  <u key={noteType} class={`note-chip t-${noteType}`}>
                    {NOTE_TYPES[noteType].label}
                  </u>
                ))}
                <i>{noteRow.ref}</i>
              </div>
            </div>
          </a>
        ))
      ) : (
        <div class="note-empty">
          {rows.length
            ? 'Nothing of this kind.'
            : 'No notifications yet. New comments, commits and reviews on PRs you opened will show up here.'}
        </div>
      )}
    </div>
  );
};
