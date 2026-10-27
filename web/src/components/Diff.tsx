import { DiffHunkTable, FoldBtn, ReactionsBar } from './Comments';
import { flashClass, useFlash } from './flash';
import type { FlashProps } from './flash';
import type { ConvHandlers, HunkRow, ReactionsProps } from './Comments';
import { DraftBox, ErrLine } from './Actions';
import { Av, I, SP, When } from './ui';
import { whenParts } from '../app/core';
import type { Person } from '../types';

export type SugProps = { kind: 'note'; text: string } | { kind: 'btn'; id: number | string; disabled: boolean; ref: string; mine: boolean };
export function Sug({ s, on }: { s: SugProps; on?: ConvHandlers }) {
  return s.kind === 'note'
    ? <div class="sug-row"><span class="sug-note">{s.text}</span></div>
    : <div class="sug-row"><button class="btn small primary" data-sug={s.id} disabled={s.disabled} onClick={on && ((e) => on.sug(e, String(s.id)))}>Apply suggestion</button><span class="sug-note">Commits to <code>{s.ref}</code>{s.mine ? '' : ' (fork — needs push access)'}</span></div>;
}
export interface TcProps { user: Person | null | undefined; login: string; at: string; id: number | string; root: number | string; withMenu: boolean; bodyHtml: string; reactions: ReactionsProps; sug: SugProps | null; anchorId: boolean; kb?: boolean; flash?: FlashProps }
export function Tc(p: TcProps & { on?: ConvHandlers }) {
  const { on } = p, ref = useFlash(p.flash, p.kb);
  return <div ref={ref} class={`tc${p.kb ? ' kb' : ''}${flashClass(p.flash)}`} id={p.anchorId ? `c-${p.id}` : undefined}><a href={p.user?.html_url || '#'}>{Av(p.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">{p.login}</span>{SP}<span>{When(p.at)}</span>{p.withMenu ? <button class="cm-btn" data-cm={p.id} data-root={p.root} title="Comment actions" onClick={on && ((e) => on.menu(e, e.currentTarget as HTMLElement))}>⋯</button> : ''}</div><div class="markdown-body" style="margin-top:8px" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />{p.sug ? <Sug s={p.sug} on={on} /> : ''}<ReactionsBar {...p.reactions} on={on?.react} /></div></div>;
}

export interface ThreadRowProps { cols: number; k: string; def: boolean; folded: boolean; side: string; line: number; outdated: boolean; resolved: boolean; cards: TcProps[]; reply: ReplyProps | null; act: { tid: string; res: boolean } | null }
export function ThreadRow(p: ThreadRowProps & { on?: ConvHandlers }) {
  const { on } = p;
  return <tr class="lc-row th-row"><td colspan={p.cols}><div class={`thread inl${p.folded ? ' folded' : ''}`}><div class="thread-head"><FoldBtn k={p.k} title="Hide this thread" def={p.def} folded={p.folded} onFold={on?.fold} /><span class="th-t">Comment on line <b>{p.side}{p.line}</b></span>{p.outdated ? <span class="res out">Outdated</span> : ''}{p.resolved ? <span class="res">Resolved</span> : ''}</div>{p.cards.map((c) => <Tc {...c} on={on} />)}{p.reply ? <ReplyBox {...p.reply} on={on} /> : ''}{p.act ? <div class="th-foot"><button class="thread-act" data-thread={p.act.tid} data-res={p.act.res ? 'unresolve' : 'resolve'} onClick={on && ((e) => on.thread(e, p.act!.tid, p.act!.res ? 'unresolve' : 'resolve'))}>{p.act.res ? 'Unresolve conversation' : 'Resolve conversation'}</button></div> : ''}</div></td></tr>;
}

export interface ReplyProps { rid: number | string; ph: string; err: string }
export function ReplyBox({ rid, ph, err, on }: ReplyProps & { on?: ConvHandlers }) {
  return <div class="reply"><DraftBox k={`reply-${rid}`} ph={ph} rows={2} /><ErrLine m={err} /><button class="btn small" data-sendreply={rid} onClick={on && (() => on.reply(String(rid)))}>Reply</button></div>;
}

export interface LcHandlers { del: (id: string) => void; cancel: () => void; suggest: (e: Event) => void; add: () => void }
export const LcCards = ({ cards, on }: { cards: { id: number | string; body: string }[]; on?: LcHandlers }) => <>{cards.map((c) => <div class="lc-card"><span class="lc-tag">Pending</span><div class="lc-body" dangerouslySetInnerHTML={{ __html: c.body }} /><button class="lc-x" data-lcdel={c.id} title="Delete draft comment" onClick={on && (() => on.del(String(c.id)))}>{I('x')}</button></div>)}</>;
export const LcEdit = ({ code, on }: { code: string | null; on?: LcHandlers }) => <div class="lc-edit"><DraftBox k="lc" ph="Leave a comment on this line" rows={3} /><div class="lc-btns">{code !== null ? <button class="btn small" id="lcsuggest" data-code={code} title="Insert a suggested change for this line" onClick={on?.suggest}>± Suggest change</button> : ''}<span class="sp"></span><button class="btn small" id="lccancel" onClick={on?.cancel}>Cancel</button><button class="btn small primary" id="lcadd" onClick={on?.add}>Add to review</button></div></div>;

export interface RvThread { folded: boolean; k: string; def: boolean; path: string; resolved: boolean; tid: string | null; hunk: HunkRow[]; cards: TcProps[]; reply: ReplyProps }
export interface ReviewBlockProps { folded: boolean; k: string; kind: string; ic: string; user: Person | null | undefined; verb: string; url: string; at: string; sum: { ok: boolean; text: string; allRes: boolean } | null; bodyHtml: string; threads: RvThread[]; allRes: boolean }
const Actor = ({ u }: { u?: Person | null }) => (u ? <a class="actor" href={u.html_url}>{u.login}</a> : <span class="actor">ghost</span>);
export function ReviewBlock(p: ReviewBlockProps & { on?: ConvHandlers }) {
  const { on } = p;
  return <div class={`TLI rev${p.folded ? ' folded' : ''}`}><div class={`TLI-badge ${p.kind}`}>{I(p.ic)}</div><div class="TLI-avatar">{Av(p.user, 20)}</div><div class="TLI-body"><div class="row"><FoldBtn k={p.k} title="Collapse / expand this review" def={p.allRes} folded={p.folded} onFold={on?.fold} /><Actor u={p.user} /> <span>{p.verb}</span> <a class="time" href={p.url}>{p.at}</a>{p.sum ? <span class={`rev-sum${p.sum.ok ? ' ok' : ''}`}>{p.sum.allRes ? <>{I('check')} All resolved</> : p.sum.text}</span> : ''}</div>{'\n  '}
    {p.bodyHtml ? <div class="cbox nocaret" style="margin-top:8px;color:var(--fgColor-default)"><div class="cbody"><div class="markdown-body" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} /></div></div> : ''}{p.threads.length ? <div>{p.threads.map((t) => <div class={`thread${t.folded ? ' folded' : ''}`}><div class="thread-head"><FoldBtn k={t.k} title="Hide this thread" def={t.def} folded={t.folded} onFold={on?.fold} />{t.path}{t.resolved ? <span class="res">Resolved</span> : ''}{t.tid ? <button class="thread-act" data-thread={t.tid} data-res={t.resolved ? 'unresolve' : 'resolve'} onClick={on && ((e) => on.thread(e, t.tid!, t.resolved ? 'unresolve' : 'resolve'))}>{t.resolved ? 'Unresolve' : 'Resolve conversation'}</button> : ''}</div><div class="diffhunk"><DiffHunkTable rows={t.hunk} /></div>{t.cards.map((c) => <Tc {...c} on={on} />)}<ReplyBox {...t.reply} on={on} /></div>)}</div> : ''}</div></div>;
}
void whenParts;
