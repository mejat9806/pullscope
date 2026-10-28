export interface NoteRow {
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
  open: (event: MouseEvent) => void;
  aux: (event: MouseEvent) => void;
  ctx: (event: MouseEvent) => void;
}

export const NotePanel = ({
  open,
  rows,
  on,
}: {
  open: boolean;
  rows: NoteRow[];
  on: NoteHandlers;
}) => (
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
    {rows.length ? (
      rows.map(noteRow => (
        <a
          class={`note ${noteRow.read ? '' : 'new'}`}
          data-open={noteRow.ref}
          data-target={noteRow.target}
          onClick={on.open}
          onAuxClick={on.aux}
          onContextMenu={on.ctx}
        >
          <b>{noteRow.title}</b>
          <span>{noteRow.text}</span>
          <i>
            {noteRow.ref} · {noteRow.when}
          </i>
        </a>
      ))
    ) : (
      <div class="note-empty">
        No notifications yet. New comments, commits and reviews on PRs you
        opened will show up here.
      </div>
    )}
  </div>
);
