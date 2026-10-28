import { render as paint } from 'preact';
import { useEffect, useLayoutEffect } from 'preact/hooks';

import { Shell } from '../components/Shell';
import { applyMode, S } from './core';

import type { VNode } from 'preact';
import type { ShellProps } from '../components/Shell';

// The one Preact tree of the app. Every floating or sub-view layer (toolbar, sidebar, dialogs, popups, palette, notifications, overlays) is a slot of it:
// a layer repaints by setting its slot to a fresh vnode, the others keep their vnode and Preact skips them.
type Slot = 'top' | 'side' | 'dlg' | 'notes' | 'pop' | 'pal' | 'ovl' | 'totop';

const slots: Record<Slot, VNode | null> = {
  top: null,
  side: null,
  dlg: null,
  notes: null,
  pop: null,
  pal: null,
  ovl: null,
  totop: null,
};

// Everything that used to be a document/window listener: element-level handlers on the frame root, window events for shortcuts and focus, and the pointer drags.
export interface Globals {
  pointerDown: (e: PointerEvent) => void;
  clickCapture: (e: MouseEvent) => void;
  click: (e: MouseEvent) => void;
  mouseDown: (e: MouseEvent) => void;
  key: (e: KeyboardEvent) => void;
  wheel: (e: WheelEvent) => void;
  focus: () => void;
  online: () => void;
  offline: () => void;
}

export interface DragFns {
  move: (e: MouseEvent) => void;
  end: () => void;
}

let globals: Globals | null = null;
let drag: DragFns | null = null;

export const setGlobals = (g: Globals) => {
  globals = g;
};

// A drag is state: Frame listens to the window's pointer moves for as long as one is active.
export const beginDrag = (d: DragFns) => {
  drag = d;
  repaint();
};

let gate: VNode | null = null;
let shell: ShellProps | null = null;
let held = 0;

// The theme attributes on <html> follow S.mode on every paint; a layout effect keeps them in step with the DOM the view transition snapshots.
const Frame = () => {
  useLayoutEffect(() => {
    applyMode();
  });

  useEffect(() => {
    const g = globals;

    if (!g) {
      return;
    }

    addEventListener('keydown', g.key);
    addEventListener('wheel', g.wheel, { passive: false });
    addEventListener('focus', g.focus);
    addEventListener('online', g.online);
    addEventListener('offline', g.offline);

    return () => {
      removeEventListener('keydown', g.key);
      removeEventListener('wheel', g.wheel);
      removeEventListener('focus', g.focus);
      removeEventListener('online', g.online);
      removeEventListener('offline', g.offline);
    };
  }, []);

  const d = drag;

  useLayoutEffect(() => {
    if (!d) {
      return;
    }

    const up = () => {
      removeEventListener('mousemove', d.move);
      removeEventListener('mouseup', up);
      drag = null;
      d.end();
    };

    addEventListener('mousemove', d.move);
    addEventListener('mouseup', up);

    return () => {
      removeEventListener('mousemove', d.move);
      removeEventListener('mouseup', up);
    };
  }, [d]);

  const g = globals;

  return (
    <div
      id="frame"
      class={S.dragging ? 'dragging' : ''}
      style="display:contents"
      onPointerDown={g?.pointerDown}
      onClickCapture={g?.clickCapture}
      onClick={g?.click}
      onMouseDown={g?.mouseDown}
    >
      <div id="top" style="display:contents">
        {slots.top}
      </div>
      <div id="rest" style="display:contents">
        {gate ? (
          <>
            {gate}
            <div id="dlg" style="display:contents">
              {slots.dlg}
            </div>
          </>
        ) : shell ? (
          <Shell
            {...shell}
            side={slots.side}
            dlg={slots.dlg}
            notes={slots.notes}
          />
        ) : null}
      </div>
      <div id="pop" style="display:contents">
        {slots.pop}
      </div>
      <div id="pal" style="display:contents">
        {slots.pal}
      </div>
      <div id="ovl" style="display:contents">
        {slots.ovl}
      </div>
      <div style="display:contents">{slots.totop}</div>
    </div>
  );
};

export function repaint() {
  if (held) {
    return;
  }

  const app = document.getElementById('app')!;
  paint(<Frame />, app);
}

export const setSlot = (name: Slot, v: VNode | null) => {
  slots[name] = v;
  repaint();
};

// Several slots change in one go (a page render): one paint at the end.
export function batch(fn: () => void) {
  held++;

  try {
    fn();
  } finally {
    held--;
    repaint();
  }
}

export const setGate = (v: VNode | null) => {
  gate = v;
  shell = v ? null : shell;
  repaint();
};

export const setShell = (p: ShellProps) => {
  shell = p;
  gate = null;
  repaint();
};

export const shellProps = () => shell;

export function setDragging(on: boolean) {
  S.dragging = on;
  repaint();
}
