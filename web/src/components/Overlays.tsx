import { useEffect, useRef, useState } from 'preact/hooks';
import type { AcRow, BpGroup } from '../types';
import { I } from './ui';

export interface ProfPopProps { right: number; top: number; name: string; login: string; avatar: string; ver?: string; dense?: boolean; pick: (h: string) => void }
export const ProfPop = (p: ProfPopProps) => <div class="react-pop cm-pop prof-pop" style={`right:${p.right}px;top:${p.top}px`}>
  <div class="pp-h"><img src={p.avatar} alt="" /><div><b>{p.name}</b><i>@{p.login}</i></div></div>
  <button data-h="profile" onClick={() => p.pick('profile')}>{I('link-external')} Your GitHub profile</button>
  <button data-h="repos" onClick={() => p.pick('repos')}>{I('repo')} Choose repositories…</button>
  <button data-h="dense" onClick={() => p.pick('dense')}>{I('checklist')} {p.dense ? 'Comfortable lists' : 'Compact lists'}</button>
  <button data-h="token" onClick={() => p.pick('token')}>{I('key')} Access token…</button>
  <button data-h="out" class="danger" onClick={() => p.pick('out')}>Sign out</button>
  <div class="pp-ver">Signed in with token{p.ver ? ` · Pullscope v${p.ver}` : ''}</div></div>;

export interface AcPopProps { rows: AcRow[]; sel: number; left: number; top: number; width: number; pick: (r: AcRow) => void }
export function AcPop(p: AcPopProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' }); });
  return <div id="acpop" class="acpop" ref={ref} style={`left:${p.left}px;top:${p.top}px;width:${p.width}px`}
    onMouseDown={(e) => { e.preventDefault(); const r = (e.target as HTMLElement).closest<HTMLElement>('.ac-row'); if (r) p.pick(p.rows[+r.dataset.i!]); }}>
    {p.rows.map((r, i) => <div class={`ac-row${i === p.sel ? ' on' : ''}`} data-i={i}><span class={`ac-i ${r.state || ''}`}>{I(r.ic!)}</span><span class="ac-t"><b>{r.label}</b><i>{r.sub}</i></span></div>)}
  </div>;
}

export interface BpPopProps { repoMode: boolean; style: string; cur: string; groupsFor: (q: string) => BpGroup[]; age: (t: string) => string; done: (v?: string) => void }
// Branch / repository picker: the query and the highlighted row are its own state; the caller only learns the final choice.
export function BpPop(p: BpPopProps) {
  const [q, setQ] = useState(''), [act, setAct] = useState(0);
  const ref = useRef<HTMLDivElement>(null), inp = useRef<HTMLInputElement>(null);
  const groups = p.groupsFor(q.trim()), rows = groups.flatMap(([, l]) => l), a = Math.max(0, Math.min(act, rows.length - 1));
  useEffect(() => { inp.current?.focus(); }, []);
  useEffect(() => { ref.current?.querySelector('.act')?.scrollIntoView({ block: 'nearest' }); });
  let i = 0;
  return <div id="bppop" class="bp-pop" ref={ref} style={p.style}>
    <input class="bp-q" ref={inp} placeholder={p.repoMode ? 'Filter repositories…' : 'Filter branches…'} spellcheck={false} value={q}
      onInput={(e) => { setQ((e.target as HTMLInputElement).value); setAct(0); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.preventDefault(); p.done(); }
        else if (e.key === 'Enter') { e.preventDefault(); p.done(rows[a]?.name); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setAct(Math.max(0, Math.min(rows.length - 1, a + (e.key === 'ArrowDown' ? 1 : -1)))); }
      }} />
    <div class="bp-list">{groups.length && rows.length ? groups.map(([h, l]) => <>
      {h ? <div class="bp-h">{h}<span>{l.length}</span></div> : ''}
      {l.map((x) => { const idx = i++; return <div class={`bp-r${idx === a ? ' act' : ''}${x.name === p.cur ? ' cur' : ''}`} data-b={x.name} onClick={() => p.done(x.name)} onMouseMove={() => { if (idx !== a) setAct(idx); }}>
        <span class="bp-ck">{x.name === p.cur ? '✓' : ''}</span><span class="bp-n">{x.name}</span>{x.by ? <span class="bp-by">{x.by}</span> : ''}<span class="bp-t">{p.age(x.at)}</span></div>; })}</>) : <div class="bp-empty">No matches</div>}</div>
  </div>;
}

// Click and reaction effects: plain state, so they can be drawn (and removed) like any other view.
export type Fx =
  | { id: number; k: 'rip'; l: number; t: number; w: number; h: number; radius: string; color: string; x: number; y: number; d: number }
  | { id: number; k: 'burst'; x: number; y: number; ch: string; dx: number; dy: number }
  | { id: number; k: 'conf'; w: number; h: number };

function Confetti({ w, h, done }: { w: number; h: number; done: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, cols = ['#0969da', '#1f883d', '#8250df', '#f2cc60', '#cf222e', '#ff8fb1'];
    const ps = Array.from({ length: 160 }, () => ({ x: w / 2, y: h * 0.6, vx: (Math.random() - 0.5) * 18, vy: -8 - Math.random() * 14, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: cols[(Math.random() * cols.length) | 0] }));
    let t = 0, raf = 0;
    const f = () => {
      g.clearRect(0, 0, c.width, c.height); t++;
      ps.forEach((p) => { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - t / 130); g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); });
      if (t < 130) raf = requestAnimationFrame(f); else done();
    };
    f();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas class="confetti" ref={ref} width={w} height={h}></canvas>;
}

export const FxLayer = ({ items, drop }: { items: Fx[]; drop: (id: number) => void }) => <>{items.map((f) =>
  f.k === 'rip'
    ? <div key={f.id} style={`position:fixed;z-index:999;overflow:hidden;pointer-events:none;left:${f.l}px;top:${f.t}px;width:${f.w}px;height:${f.h}px;border-radius:${f.radius};color:${f.color}`}><span class="ripple" style={`width:${f.d}px;height:${f.d}px;left:${f.x}px;top:${f.y}px`}></span></div>
    : f.k === 'burst'
      ? <span key={f.id} class="burst" style={`left:${f.x}px;top:${f.y}px;--dx:${f.dx}px;--dy:${f.dy}px`}>{f.ch}</span>
      : <Confetti key={f.id} w={f.w} h={f.h} done={() => drop(f.id)} />)}</>;
