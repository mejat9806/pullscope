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
  open: (e: MouseEvent) => void;
  aux: (e: MouseEvent) => void;
  ctx: (e: MouseEvent) => void;
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
        <button id="noteall" onClick={on.all}>
          View all
        </button>{' '}
        <button id="notecheck" onClick={on.check}>
          Check now
        </button>{' '}
        <button id="noteclear" onClick={on.clear}>
          Clear all
        </button>
      </span>
    </div>
    {rows.length ? (
      rows.map(n => (
        <a
          class={`note ${n.read ? '' : 'new'}`}
          data-open={n.ref}
          data-target={n.target}
          onClick={on.open}
          onAuxClick={on.aux}
          onContextMenu={on.ctx}
        >
          <b>{n.title}</b>
          <span>{n.text}</span>
          <i>
            {n.ref} · {n.when}
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
