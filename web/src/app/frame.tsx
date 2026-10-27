import { render as paint } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import type { VNode } from 'preact';
import { Shell } from '../components/Shell';
import type { ShellProps } from '../components/Shell';
import { S, applyMode } from './core';

// The one Preact tree of the app. Every floating or sub-view layer (toolbar, sidebar, dialogs, popups, palette, notifications, overlays) is a slot of it:
// a layer repaints by setting its slot to a fresh vnode, the others keep their vnode and Preact skips them.
type Slot = 'top' | 'side' | 'dlg' | 'notes' | 'pop' | 'pal' | 'ovl' | 'totop';
const slots: Record<Slot, VNode | null> = { top: null, side: null, dlg: null, notes: null, pop: null, pal: null, ovl: null, totop: null };
let gate: VNode | null = null, shell: ShellProps | null = null, held = 0, started = false;

// The theme attributes on <html> follow S.mode on every paint; a layout effect keeps them in step with the DOM the view transition snapshots.
const Frame = () => {
  useLayoutEffect(() => { applyMode(); });
  return <div id="frame" class={S.dragging ? 'dragging' : ''} style="display:contents">
    <div id="top" style="display:contents">{slots.top}</div>
    <div id="rest" style="display:contents">
      {gate ? <>{gate}<div id="dlg" style="display:contents">{slots.dlg}</div></> : shell ? <Shell {...shell} side={slots.side} dlg={slots.dlg} notes={slots.notes} /> : null}
    </div>
    <div id="pop" style="display:contents">{slots.pop}</div>
    <div id="pal" style="display:contents">{slots.pal}</div>
    <div id="ovl" style="display:contents">{slots.ovl}</div>
    <div style="display:contents">{slots.totop}</div>
  </div>;
};

export function repaint() {
  if (held) return;
  const app = document.getElementById('app')!;
  if (!started) { app.innerHTML = ''; started = true; }
  paint(<Frame />, app);
}
export const setSlot = (name: Slot, v: VNode | null) => { slots[name] = v; repaint(); };
// Several slots change in one go (a page render): one paint at the end.
export function batch(fn: () => void) { held++; try { fn(); } finally { held--; repaint(); } }
export const setGate = (v: VNode | null) => { gate = v; shell = v ? null : shell; repaint(); };
export const setShell = (p: ShellProps) => { shell = p; gate = null; repaint(); };
export const shellProps = () => shell;
export function setDragging(on: boolean) { S.dragging = on; repaint(); }
