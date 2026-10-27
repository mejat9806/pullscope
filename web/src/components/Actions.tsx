import { html, Raw } from './html';
import { I, SP } from './ui';

export const draftBoxHtml = (key: string, ph: string, rows: number) => html(<div class="tt" data-draft={key} data-ph={`${ph} — type / for blocks`} style={`--rows:${rows}`}></div>);
export const errLineHtml = (m: string) => html(<div class="act-err">{m}</div>);

export const ErrLine = ({ m }: { m: string }) => (m ? <div class="act-err">{m}</div> : null);
export const DraftBox = ({ k, ph, rows }: { k: string; ph: string; rows: number }) => <div class="tt" data-draft={k} data-ph={`${ph} — type / for blocks`} style={`--rows:${rows}`}></div>;

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
export const composerHtml = (p: ComposerProps) => html(<Composer {...p} />);

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
export const mergeActHtml = (p: MergeActProps) => html(<MergeAct {...p} />);

export const reviewDialogHtml = (draftBox: string) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Finish your review</h2>{Raw(draftBox)}{'\n  '}
  <div class="radios"><label><input type="radio" name="rev" value="COMMENT" checked /> <b>Comment</b> <span>Submit general feedback without explicit approval.</span></label>{'\n  '}
  <label><input type="radio" name="rev" value="APPROVE" /> <b>Approve</b> <span>Submit feedback and approve merging these changes.</span></label>{'\n  '}
  <label><input type="radio" name="rev" value="REQUEST_CHANGES" /> <b>Request changes</b> <span>Submit feedback that must be addressed before merging.</span></label></div>{'\n  '}
  <div id="reverr"></div><div class="btns"><button class="btn" id="revcancel">Cancel</button><button class="btn primary" id="revsubmit">Submit review</button></div></div></div>);

export const editPrDialogHtml = (title: string, draftBox: string, err: string) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit pull request</h2><label class="np-l">Title</label><input class="input" id="eptitle" value={title} style="width:100%;box-sizing:border-box;height:34px" /><label class="np-l">Description</label>{Raw(draftBox)}<div id="reverr">{Raw(err)}</div><div class="btns"><button class="btn" id="epcancel">Cancel</button><button class="btn primary" id="epsave">Save</button></div></div></div>);

export const confirmDlgHtml = (title: string, text: string, label: string, danger: boolean) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>{title}</h2><p>{text}</p><div class="btns"><button class="btn" id="cfcancel">Cancel</button><button class={`btn ${danger ? 'danger' : 'primary'}`} id="cfok">{label}</button></div></div></div>);

export const editCommentDialogHtml = (draftBox: string, err: string) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg wide"><h2>Edit comment</h2>{Raw(draftBox)}<div id="reverr">{Raw(err)}</div><div class="btns"><button class="btn" id="eccancel">Cancel</button><button class="btn primary" id="ecsave">Save</button></div></div></div>);

export const deleteCommentDialogHtml = (err: string) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Delete this comment?</h2><p style="color:var(--fgColor-muted)">This can't be undone.</p><div id="reverr">{Raw(err)}</div><div class="btns"><button class="btn" id="dccancel">Cancel</button><button class="btn danger" id="dcdo">Delete</button></div></div></div>);

export const hideCommentDialogHtml = (reasons: [string, string][], err: string) => html(<div class="dlg-bg" id="dlgbg"><div class="dlg"><h2>Hide this comment</h2><label class="np-l">Reason</label><select class="sel" id="hcreason" style="width:100%;height:34px">{reasons.map(([v, l]) => <option value={v} selected={v === 'OUTDATED'}>{l}</option>)}</select><div id="reverr">{Raw(err)}</div><div class="btns"><button class="btn" id="hccancel">Cancel</button><button class="btn primary" id="hcdo">Hide comment</button></div></div></div>);

export const cmPopHtml = (hr: boolean, edit: boolean, hide: boolean, del: boolean) => html(<><button data-h="link">Copy link</button><button data-h="md">Copy Markdown</button><button data-h="quote">Quote reply</button><button data-h="issue">Reference in new issue</button>{hr ? <hr /> : ''}{edit ? <button data-h="edit">Edit</button> : ''}{hide ? <button data-h="hide">Hide</button> : ''}{del ? <button data-h="del" class="danger">Delete</button> : ''}</>);
export const reactPopHtml = (reacts: [string, string][]) => html(<>{reacts.map(([k, em]) => <button data-c={k}>{em}</button>)}</>);
