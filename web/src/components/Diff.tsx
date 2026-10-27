import { html, Raw } from './html';
import { Av, I, SP, When } from './ui';
import type { Person } from '../types';

export interface TcProps { user: Person | null | undefined; login: string; at: string; id: number | string; root: number | string; withMenu: boolean; body: string; reactions: string; sug: string; anchorId: boolean }
export function Tc(p: TcProps) {
  return <div class="tc" id={p.anchorId ? `c-${p.id}` : undefined}><a href={p.user?.html_url || '#'}>{Av(p.user, 24)}</a><div style="flex:1;min-width:0"><div><span class="who">{p.login}</span>{SP}<span>{When(p.at)}</span>{p.withMenu ? <button class="cm-btn" data-cm={p.id} data-root={p.root} title="Comment actions">⋯</button> : ''}</div><div class="markdown-body" style="margin-top:8px">{Raw(p.body)}</div>{Raw(p.sug)}{Raw(p.reactions)}</div></div>;
}
export const tcHtml = (p: TcProps) => html(<Tc {...p} />);

export interface ThreadRowProps { cols: number; folded: string; foldBtn: string; side: string; line: number; outdated: boolean; resolved: boolean; cards: string[]; reply: string; act: { tid: string; res: boolean } | null }
export function ThreadRow(p: ThreadRowProps) {
  return <tr class="lc-row th-row"><td colspan={p.cols}><div class={`thread inl${p.folded}`}><div class="thread-head">{Raw(p.foldBtn)}<span class="th-t">Comment on line <b>{p.side}{p.line}</b></span>{p.outdated ? <span class="res out">Outdated</span> : ''}{p.resolved ? <span class="res">Resolved</span> : ''}</div>{p.cards.map((c) => Raw(c))}{Raw(p.reply)}{p.act ? <div class="th-foot"><button class="thread-act" data-thread={p.act.tid} data-res={p.act.res ? 'unresolve' : 'resolve'}>{p.act.res ? 'Unresolve conversation' : 'Resolve conversation'}</button></div> : ''}</div></td></tr>;
}
export const threadRowHtml = (p: ThreadRowProps) => html(<ThreadRow {...p} />);

export const replyBoxHtml = (draftBox: string, err: string, rid: number | string) => html(<div class="reply">{Raw(draftBox)}{Raw(err)}<button class="btn small" data-sendreply={rid}>Reply</button></div>);

export const lcCardsHtml = (cards: { id: number | string; body: string }[]) => html(<>{cards.map((c) => <div class="lc-card"><span class="lc-tag">Pending</span><div class="lc-body">{Raw(c.body)}</div><button class="lc-x" data-lcdel={c.id} title="Delete draft comment">{I('x')}</button></div>)}</>);
export const lcEditHtml = (draftBox: string, code: string | null) => html(<div class="lc-edit">{Raw(draftBox)}<div class="lc-btns">{code !== null ? <button class="btn small" id="lcsuggest" data-code={code} title="Insert a suggested change for this line">± Suggest change</button> : ''}<span class="sp"></span><button class="btn small" id="lccancel">Cancel</button><button class="btn small primary" id="lcadd">Add to review</button></div></div>);

export const sugNoteHtml = (t: string) => html(<div class="sug-row"><span class="sug-note">{t}</span></div>);
export const sugBtnHtml = (id: number | string, disabled: boolean, ref: string, mine: boolean) => html(<div class="sug-row"><button class="btn small primary" data-sug={id} disabled={disabled}>Apply suggestion</button><span class="sug-note">Commits to <code>{ref}</code>{mine ? '' : ' (fork — needs push access)'}</span></div>);

export interface RvThread { folded: string; foldBtn: string; path: string; resolved: boolean; tid: string | null; hunk: string; cards: string[]; reply: string }
export interface ReviewBlockProps { folded: string; kind: string; ic: string; avatar: string; foldBtn: string; who: string; verb: string; url: string; at: string; sum: { ok: boolean; text: string; allRes: boolean } | null; bodyHtml: string; threads: RvThread[] }
export function ReviewBlock(p: ReviewBlockProps) {
  return <div class={`TLI rev${p.folded}`}><div class={`TLI-badge ${p.kind}`}>{I(p.ic)}</div><div class="TLI-avatar">{Raw(p.avatar)}</div><div class="TLI-body"><div class="row">{Raw(p.foldBtn)}{Raw(p.who)} <span>{p.verb}</span> <a class="time" href={p.url}>{p.at}</a>{p.sum ? <span class={`rev-sum${p.sum.ok ? ' ok' : ''}`}>{p.sum.allRes ? <>{I('check')} All resolved</> : p.sum.text}</span> : ''}</div>{'\n  '}
    {p.bodyHtml ? <div class="cbox nocaret" style="margin-top:8px;color:var(--fgColor-default)"><div class="cbody"><div class="markdown-body">{Raw(p.bodyHtml)}</div></div></div> : ''}{p.threads.length ? <div>{p.threads.map((t) => <div class={`thread${t.folded}`}><div class="thread-head">{Raw(t.foldBtn)}{t.path}{t.resolved ? <span class="res">Resolved</span> : ''}{t.tid ? <button class="thread-act" data-thread={t.tid} data-res={t.resolved ? 'unresolve' : 'resolve'}>{t.resolved ? 'Unresolve' : 'Resolve conversation'}</button> : ''}</div><div class="diffhunk">{Raw(t.hunk)}</div>{t.cards.map((c) => Raw(c))}{Raw(t.reply)}</div>)}</div> : ''}</div></div>;
}
export const reviewBlockHtml = (p: ReviewBlockProps) => html(<ReviewBlock {...p} />);
