import { render as paint } from 'preact';
import { CmPop, CommitsDialog, ConfirmDialog, CtxPop, DeleteCommentDialog, EditCommentDialog, EditPrDialog, HideCommentDialog, ReactPop, ReviewDialog, TokenDialog } from '../components/Dialogs';
import type { CpHandlers } from '../components/Merge';
import { closeDlg, errMsg } from './actions';
import { $, REACTS, S } from './core';
import { commitList, commitsDialogProps, setFr, sinceReview } from './mergebox';
import { pendList } from './diff';
import { oauthGo, tokenSave } from './token';

// Dialogs and popups are plain state (S.dlg / S.pop) painted by Preact: dialogs into #dlg (repainted with every page render), popups into their own host on <body>.
export const paintDlg = () => { const h = $('#dlg'); if (h) paint(<Dialogs />, h); };

const cpOn: CpHandlers = {
  close: () => closeDlg(),
  all: () => setFr(null),
  since: () => { const sr = sinceReview(S.bundle!); if (sr?.n) setFr({ a: sr.at + 1, b: commitList(S.bundle!).length - 1 }); },
  save: () => { if (S.cpick) setFr({ ...S.cpick }); },
  filter: (e) => { S.cfilter = (e.target as HTMLInputElement).value; paintDlg(); },
  pick: (e, i) => { e.preventDefault(); const p = S.cpick; S.cpick = !p || (p.a !== p.b) ? { a: i, b: i } : { a: Math.min(p.a, i), b: Math.max(p.b, i) }; paintDlg(); },
};

export function Dialogs() {
  const d = S.dlg; if (!d) return null;
  const close = () => closeDlg(), ok = () => { d.k !== 'commits' && d.k !== 'token' && d.ok(); };
  switch (d.k) {
    case 'commits': return <CommitsDialog {...commitsDialogProps()} on={cpOn} />;
    case 'token': return <TokenDialog code={S.oauth?.code || ''} err={S.oauth?.err || ''} go={oauthGo} close={close} save={tokenSave} />;
    case 'review': { const n = pendList().length; return <ReviewDialog ph={n ? `Leave a review comment (${n} line comment${n === 1 ? '' : 's'} will be included)` : 'Leave a review comment (required unless approving)'} ev={d.ev} onEv={(v) => { d.ev = v; paintDlg(); }} err={errMsg('review')} close={close} ok={ok} />; }
    case 'editpr': return <EditPrDialog title={d.title} onTitle={(v) => { d.title = v; }} err={errMsg('editpr')} close={close} ok={ok} />;
    case 'confirm': return <ConfirmDialog title={d.title} text={d.text} label={d.label} danger={d.danger} close={close} ok={ok} />;
    case 'editc': return <EditCommentDialog err={errMsg('editc')} close={close} ok={ok} />;
    case 'delc': return <DeleteCommentDialog err={errMsg('delc')} close={close} ok={ok} />;
    case 'hidec': return <HideCommentDialog reasons={d.reasons} err={errMsg('hidec')} close={close} ok={ok} />;
  }
}

function Pops() {
  const p = S.pop; if (!p) return null;
  if (p.k === 'cm') return <CmPop {...p} />;
  if (p.k === 'ctx') return <CtxPop {...p} />;
  return <ReactPop x={p.x} y={p.y} reacts={REACTS as [string, string][]} pick={p.pick} />;
}

let popHost: HTMLElement | null = null;
const paintPop = () => { if (!popHost) { popHost = document.createElement('div'); popHost.id = 'pop'; popHost.style.display = 'contents'; document.body.appendChild(popHost); } paint(<Pops />, popHost); };
export function openPop(p: NonNullable<typeof S.pop>) { S.pop = p; paintPop(); }
export function closePop() { if (!S.pop) return; S.pop = null; paintPop(); }
// Whatever opens a popup stops its own click, so any later click (inside or outside) dismisses it.
document.addEventListener('click', closePop);
