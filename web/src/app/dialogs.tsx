import { setSlot } from './frame';
import { CmPop, CommitsDialog, ConfirmDialog, CtxPop, DeleteCommentDialog, EditCommentDialog, EditPrDialog, HideCommentDialog, MetaDialog, ReactPop, RepoPickDialog, ReviewDialog, TokenDialog } from '../components/Dialogs';
import { ProfPop } from '../components/Overlays';
import type { CpHandlers } from '../components/Merge';
import { closeDlg, errMsg } from './actions';
import { metaSave } from './meta';
import { isOwnPr, REACTS, S } from './core';
import { commitList, commitsDialogProps, setFr, sinceReview } from './mergebox';
import { pendList } from './diff';
import { repoPickSave } from './repopick';
import { oauthGo, tokenSave } from './token';

// Dialogs and popups are plain state (S.dlg / S.pop) painted by Preact: dialogs into #dlg (repainted with every page render), popups into their own host on <body>.
export const paintDlg = () => setSlot('dlg', <Dialogs />);

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
  const close = () => closeDlg(), ok = () => { d.k !== 'commits' && d.k !== 'token' && d.k !== 'repos' && d.k !== 'meta' && d.ok(); };
  switch (d.k) {
    case 'commits': return <CommitsDialog {...commitsDialogProps()} on={cpOn} />;
    case 'token': return <TokenDialog text={S.tokenText || ''} input={(e) => { S.tokenText = (e.currentTarget as HTMLInputElement).value; }} code={S.oauth?.code || ''} err={S.oauth?.err || ''} go={oauthGo} close={close} save={tokenSave} />;
    case 'repos': { const rp = S.rpick!; return <RepoPickDialog repos={rp.all} on={new Set(rp.on)} q={rp.q} err={rp.err} close={close} save={repoPickSave}
      toggle={(n) => { rp.on = rp.on.includes(n) ? rp.on.filter((x) => x !== n) : [...rp.on, n]; paintDlg(); }}
      all={(on) => { const q = rp.q.toLowerCase(), vis = (rp.all || []).map((r) => r.full_name).filter((n) => n.toLowerCase().includes(q)); rp.on = on ? [...new Set([...rp.on, ...vis])] : rp.on.filter((n) => !vis.includes(n)); paintDlg(); }}
      input={(e) => { rp.q = (e.currentTarget as HTMLInputElement).value; paintDlg(); }} />; }
    case 'meta': { const m = S.meta!; return <MetaDialog field={m.field} items={m.items} on={m.on} q={m.q} err={m.err} busy={m.busy} close={close} save={metaSave}
      pick={(id) => { m.on = m.field === 'milestone' ? (id ? [id] : []) : m.on.includes(id) ? m.on.filter((x) => x !== id) : [...m.on, id]; paintDlg(); }}
      input={(e) => { m.q = (e.currentTarget as HTMLInputElement).value; paintDlg(); }} />; }
    case 'review': { const n = pendList().length; return <ReviewDialog ph={n ? `Leave a review comment (${n} line comment${n === 1 ? '' : 's'} will be included)` : 'Leave a review comment (required unless approving)'} ev={d.ev} own={isOwnPr()} onEv={(v) => { d.ev = v; paintDlg(); }} err={errMsg('review')} close={close} ok={ok} />; }
    case 'editpr': return <EditPrDialog title={d.title} onTitle={(v) => { d.title = v; }} err={errMsg('editpr')} close={close} ok={ok} />;
    case 'confirm': return <ConfirmDialog title={d.title} text={d.text} label={d.label} danger={d.danger} close={close} ok={ok} />;
    case 'editc': return <EditCommentDialog err={errMsg('editc')} close={close} ok={ok} />;
    case 'delc': return <DeleteCommentDialog err={errMsg('delc')} close={close} ok={ok} />;
    case 'hidec': return <HideCommentDialog reasons={d.reasons} reason={S.hideReason || 'OUTDATED'} pick={(e) => { S.hideReason = (e.currentTarget as HTMLSelectElement).value; paintDlg(); }} err={errMsg('hidec')} close={close} ok={ok} />;
  }
}

function Pops() {
  const p = S.pop; if (!p) return null;
  if (p.k === 'cm') return <CmPop {...p} />;
  if (p.k === 'ctx') return <CtxPop {...p} />;
  if (p.k === 'prof') return <ProfPop {...p} />;
  return <ReactPop x={p.x} y={p.y} reacts={REACTS as [string, string][]} pick={p.pick} />;
}

const paintPop = () => setSlot('pop', <Pops />);
export function openPop(p: NonNullable<typeof S.pop>) { S.pop = p; paintPop(); }
export function closePop() { if (!S.pop) return; S.pop = null; paintPop(); }
// Whatever opens a popup stops its own click, so any later click (inside or outside) dismisses it.

// Clicking the dimmed area outside a dialog closes it. Press and release must both land there, so selecting text and letting go outside does not.
let downOn: EventTarget | null = null;
document.addEventListener('mousedown', (e) => { downOn = e.target; }, true);
document.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (S.dlg && t === downOn && t.id === 'dlgbg') closeDlg(); }, true);
