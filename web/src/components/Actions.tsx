import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

import { useOnRequest } from './req';
import { renderIcon } from './ui';

export const ErrLine = ({ m: message }: { m: string }) =>
  message ? <div class="act-err">{message}</div> : null;

// The rich editor is a foreign widget: the component owns its host and builds the editor (lazily, when near the viewport) on mount and destroys it on unmount.
type Preview = { html: string } | { raw: string; err: string } | null;

export const editorMount: {
  fn: ((host: HTMLElement, key: string, ph: string) => () => void) | null;
  preview: ((key: string) => Promise<Preview>) | null;
  focus: ((key: string) => void) | null;
} = { fn: null, preview: null, focus: null };

// `.tt-ed` is the editor's own host (it paints its toolbar and body there); the Write/Preview tabs and the preview pane are Preact.
export function DraftBox({
  k: key,
  ph,
  rows,
  submit,
}: {
  k: string;
  ph: string;
  rows: number;
  submit?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [pv, setPv] = useState<Preview | 'loading'>(null);
  useOnRequest(`draft:submit:${key}`, () => submit?.());

  useOnRequest(`draft:scroll:${key}`, () =>
    ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
  );

  useOnRequest(`draft:focus:${key}`, () => editorMount.focus?.(key));

  useOnRequest(`draft:blur:${key}`, () =>
    ref.current?.querySelector<HTMLElement>('.tt-content')?.blur(),
  );

  const hint = `${ph} — type / for blocks`;

  useEffect(
    () =>
      editorMount.fn ? editorMount.fn(ref.current!, key, hint) : undefined,
    [],
  );

  const show = (otherMode: 'write' | 'preview') => {
    setMode(otherMode);

    if (otherMode === 'write') {
      return;
    }

    setPv('loading');
    editorMount.preview?.(key).then(setPv);
  };

  // Back on the Write tab, the editor takes the caret again.
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;

      return;
    }

    if (mode === 'write') {
      ref.current?.querySelector<HTMLElement>('.tt-content')?.focus();
    }
  }, [mode]);

  const prev = mode === 'preview';

  return (
    <div
      class={`tt${prev ? ' previewing' : ''}`}
      data-draft={key}
      data-ph={hint}
      style={`--rows:${rows}`}
    >
      <div class="tt-tabs">
        <button
          title="Write your comment"
          class={prev ? '' : 'on'}
          onClick={() => show('write')}
        >
          Write
        </button>
        <button
          title="See how your comment will look"
          class={prev ? 'on' : ''}
          onClick={() => show('preview')}
        >
          Preview
        </button>
      </div>
      <div class="tt-ed" ref={ref}></div>
      {prev ? (
        <div class="tt-preview markdown-body">
          {pv === 'loading' ? (
            <span class="empty">Loading preview…</span>
          ) : !pv ? (
            <span class="empty">Nothing to preview</span>
          ) : 'html' in pv ? (
            <div dangerouslySetInnerHTML={{ __html: pv.html }} />
          ) : (
            <>
              <pre class="pv-raw">{pv.raw}</pre>
              <div class="act-err">
                Couldn't render the preview ({pv.err}). Showing the raw
                Markdown.
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export interface ComposerHandlers {
  toggle: () => void;
  key: (event: KeyboardEvent) => void;
  send: () => void;
  close: () => void;
  measure: (meta: { h: number; in: string } | null) => void;
}

export interface ComposerProps {
  open: boolean;
  draft: string;
  err: string;
  merged: boolean;
  closed: boolean;
  busy: boolean;
}

export function Composer(props: ComposerProps & { on?: ComposerHandlers }) {
  const { on } = props;
  const box = useRef<HTMLDivElement>(null);

  // The composer reports its height and which scroller it sits in, so scrolling code can decide when to open or fold it without looking at the page.
  useLayoutEffect(() => {
    const el = box.current!;
    const pane = el.closest('.pane-body');

    on?.measure({
      h: el.offsetHeight,
      in: pane ? (pane.closest('.pane-l') ? 'l' : 'r') : 'main',
    });

    return () => on?.measure(null);
  });

  return (
    <div
      ref={box}
      class={`composer dock${props.open ? '' : ' collapsed'}`}
      id="composer"
    >
      <div
        class="composer-h"
        id="cbar"
        role="button"
        tabindex={0}
        title="Write a comment (C)"
        onClick={on?.toggle}
        onKeyDown={on?.key}
      >
        {renderIcon('comment')}
        <b>Add a comment</b>
        <span class="cbar-ph">
          {props.draft ? `Draft: ${props.draft}` : 'Write a comment…'}
        </span>
        <kbd>C</kbd>
        <span class="cbar-x">{renderIcon('chevron-down')}</span>
      </div>
      {'\n  '}
      <div class="composer-body">
        <DraftBox
          k="comment"
          ph="Write a comment… (Markdown supported)"
          rows={4}
          submit={props.busy ? undefined : on?.send}
        />
        <ErrLine m={props.err} />
        {'\n  '}
        <div class="composer-f">
          <span class="hint">⌘↵ to send · Esc to collapse</span>
          <span style="flex:1"></span>
          {'\n  '}
          {props.merged ? (
            ''
          ) : (
            <button
              title={
                props.closed
                  ? 'Reopen this pull request'
                  : 'Close this pull request without merging'
              }
              class="btn ghost"
              id="doclose"
              onClick={on?.close}
            >
              {props.closed ? 'Reopen pull request' : 'Close pull request'}
            </button>
          )}
          {'\n  '}
          <button
            title="Post your comment on this pull request"
            class="btn primary"
            id="docomment"
            disabled={props.busy}
            onClick={on?.send}
          >
            {props.busy ? 'Sending…' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface MergeActHandlers {
  close: () => void;
  merge: () => void;
  noauto: () => void;
  auto: () => void;
  draft: () => void;
  method: (event: Event) => void;
}

export interface MergeActProps {
  draft: boolean;
  err: string;
  method: string;
  busy: boolean;
  auto: { method: string; busy: boolean } | null;
  canAuto: boolean;
  autoBusy: boolean;
  errAuto: string;
}

const METHODS: [string, string][] = [
  ['merge', 'Create a merge commit'],
  ['squash', 'Squash and merge'],
  ['rebase', 'Rebase and merge'],
];

export function MergeAct(props: MergeActProps & { on?: MergeActHandlers }) {
  const { on } = props;

  if (props.draft) {
    return (
      <div class="merge-act">
        <button
          title="Close this pull request without merging"
          class="btn ghost"
          id="doclose"
          onClick={on?.close}
        >
          Close pull request
        </button>
        <ErrLine m={props.err} />
      </div>
    );
  }

  return (
    <div class="merge-act">
      <select class="sel" id="mmethod" onChange={on?.method}>
        {METHODS.map(([otherValue, text]) => (
          <option value={otherValue} selected={props.method === otherValue}>
            {text}
          </option>
        ))}
      </select>
      <button
        title="Merge this pull request into the base branch"
        class="btn primary"
        id="domerge"
        disabled={props.busy}
        onClick={on?.merge}
      >
        {props.busy ? 'Merging…' : 'Merge pull request'}
      </button>
      {'\n  '}
      {props.auto ? (
        <button
          class="btn"
          id="noauto"
          title={`Auto-merge is on (${props.auto.method})`}
          onClick={on?.noauto}
        >
          {props.auto.busy ? 'Turning off…' : 'Disable auto-merge'}
        </button>
      ) : props.canAuto ? (
        <button
          class="btn"
          id="doauto"
          title="Merge automatically once required checks and reviews pass"
          onClick={on?.auto}
        >
          {props.autoBusy ? 'Enabling…' : 'Enable auto-merge'}
        </button>
      ) : (
        ''
      )}
      {'\n  '}
      <button
        class="btn ghost"
        id="todraft"
        title="Mark as draft again"
        onClick={on?.draft}
      >
        Convert to draft
      </button>
      <ErrLine m={props.err} />
      <ErrLine m={props.errAuto} />
    </div>
  );
}
