import { useEffect, useRef, useState } from 'preact/hooks';
import { I } from './ui';


export const ErrLine = ({ m }: { m: string }) => (m ? <div class="act-err">{m}</div> : null);
// The rich editor is a foreign widget: the component owns its host and builds the editor (lazily, when near the viewport) on mount and destroys it on unmount.
type Preview = { html: string } | { raw: string; err: string } | null;
export const editorMount: { fn: ((host: HTMLElement, key: string, ph: string) => () => void) | null; preview: ((key: string) => Promise<Preview>) | null } = { fn: null, preview: null };
// `.tt-ed` is the editor's own host (it paints its toolbar and body there); the Write/Preview tabs and the preview pane are Preact.
export function DraftBox({ k, ph, rows }: { k: string; ph: string; rows: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write'), [pv, setPv] = useState<Preview | 'loading'>(null);
  const hint = `${ph} — type / for blocks`;
  useEffect(() => editorMount.fn ? editorMount.fn(ref.current!, k, hint) : undefined, []);
  const show = (m: 'write' | 'preview') => {
    setMode(m);
    if (m === 'write') { setTimeout(() => ref.current?.querySelector<HTMLElement>('.tt-content')?.focus(), 0); return; }
    setPv('loading'); editorMount.preview?.(k).then(setPv);
  };
  const prev = mode === 'preview';
  return <div class={`tt${prev ? ' previewing' : ''}`} data-draft={k} data-ph={hint} style={`--rows:${rows}`}>
    <div class="tt-tabs"><button class={prev ? '' : 'on'} onClick={() => show('write')}>Write</button><button class={prev ? 'on' : ''} onClick={() => show('preview')}>Preview</button></div>
    <div class="tt-ed" ref={ref}></div>
    {prev ? <div class="tt-preview markdown-body">{pv === 'loading' ? <span class="empty">Loading preview…</span> : !pv ? <span class="empty">Nothing to preview</span> : 'html' in pv ? <div dangerouslySetInnerHTML={{ __html: pv.html }} /> : <><pre class="pv-raw">{pv.raw}</pre><div class="act-err">Couldn't render the preview ({pv.err}). Showing the raw Markdown.</div></>}</div> : null}
  </div>;
}

export interface ComposerHandlers { toggle: () => void; key: (e: KeyboardEvent) => void; send: () => void; close: () => void }
export interface ComposerProps { open: boolean; draft: string; err: string; merged: boolean; closed: boolean; busy: boolean }
export function Composer(p: ComposerProps & { on?: ComposerHandlers }) {
  const { on } = p;
  return <div class={`composer dock${p.open ? '' : ' collapsed'}`} id="composer"><div class="composer-h" id="cbar" role="button" tabindex={0} title="Write a comment (C)" onClick={on?.toggle} onKeyDown={on?.key}>{I('comment')}<b>Add a comment</b><span class="cbar-ph">{p.draft ? `Draft: ${p.draft}` : 'Write a comment…'}</span><kbd>C</kbd><span class="cbar-x">{I('chevron-down')}</span></div>{'\n  '}
    <div class="composer-body"><DraftBox k="comment" ph="Write a comment… (Markdown supported)" rows={4} /><ErrLine m={p.err} />{'\n  '}
      <div class="composer-f"><span class="hint">⌘↵ to send · Esc to collapse</span><span style="flex:1"></span>{'\n  '}
        {p.merged ? '' : <button class="btn ghost" id="doclose" onClick={on?.close}>{p.closed ? 'Reopen pull request' : 'Close pull request'}</button>}{'\n  '}
        <button class="btn primary" id="docomment" disabled={p.busy} onClick={on?.send}>{p.busy ? 'Sending…' : 'Comment'}</button></div></div></div>;
}

export interface MergeActHandlers { close: () => void; merge: () => void; noauto: () => void; auto: () => void; draft: () => void }
export interface MergeActProps { draft: boolean; err: string; method: string; busy: boolean; auto: { method: string; busy: boolean } | null; canAuto: boolean; autoBusy: boolean; errAuto: string }
const METHODS: [string, string][] = [['merge', 'Create a merge commit'], ['squash', 'Squash and merge'], ['rebase', 'Rebase and merge']];
export function MergeAct(p: MergeActProps & { on?: MergeActHandlers }) {
  const { on } = p;
  if (p.draft) return <div class="merge-act"><button class="btn ghost" id="doclose" onClick={on?.close}>Close pull request</button><ErrLine m={p.err} /></div>;
  return <div class="merge-act"><select class="sel" id="mmethod">{METHODS.map(([v, t]) => <option value={v} selected={p.method === v}>{t}</option>)}</select><button class="btn primary" id="domerge" disabled={p.busy} onClick={on?.merge}>{p.busy ? 'Merging…' : 'Merge pull request'}</button>{'\n  '}
    {p.auto ? <button class="btn" id="noauto" title={`Auto-merge is on (${p.auto.method})`} onClick={on?.noauto}>{p.auto.busy ? 'Turning off…' : 'Disable auto-merge'}</button> : p.canAuto ? <button class="btn" id="doauto" title="Merge automatically once required checks and reviews pass" onClick={on?.auto}>{p.autoBusy ? 'Enabling…' : 'Enable auto-merge'}</button> : ''}{'\n  '}
    <button class="btn ghost" id="todraft" title="Mark as draft again" onClick={on?.draft}>Convert to draft</button><ErrLine m={p.err} /><ErrLine m={p.errAuto} /></div>;
}







