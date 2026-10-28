import { render as paint } from 'preact';
import { useEffect, useLayoutEffect } from 'preact/hooks';

import { Shell } from '../components/Shell';
import { applyMode, appState } from './core';

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
  pointerDown: (event: PointerEvent) => void;
  clickCapture: (event: MouseEvent) => void;
  click: (event: MouseEvent) => void;
  mouseDown: (event: MouseEvent) => void;
  key: (event: KeyboardEvent) => void;
  wheel: (event: WheelEvent) => void;
  focus: () => void;
  online: () => void;
  offline: () => void;
}

export interface DragFns {
  move: (event: MouseEvent) => void;
  end: () => void;
}

let globals: Globals | null = null;
let drag: DragFns | null = null;

export const setGlobals = (otherGlobals: Globals) => {
  globals = otherGlobals;
};

// A drag is state: Frame listens to the window's pointer moves for as long as one is active.
export const beginDrag = (dragFns: DragFns) => {
  drag = dragFns;
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
    const otherGlobals = globals;

    if (!otherGlobals) {
      return;
    }

    addEventListener('keydown', otherGlobals.key);
    addEventListener('wheel', otherGlobals.wheel, { passive: false });
    addEventListener('focus', otherGlobals.focus);
    addEventListener('online', otherGlobals.online);
    addEventListener('offline', otherGlobals.offline);

    return () => {
      removeEventListener('keydown', otherGlobals.key);
      removeEventListener('wheel', otherGlobals.wheel);
      removeEventListener('focus', otherGlobals.focus);
      removeEventListener('online', otherGlobals.online);
      removeEventListener('offline', otherGlobals.offline);
    };
  }, []);

  const dragFns = drag;

  useLayoutEffect(() => {
    if (!dragFns) {
      return;
    }

    const up = () => {
      removeEventListener('mousemove', dragFns.move);
      removeEventListener('mouseup', up);
      drag = null;
      dragFns.end();
    };

    addEventListener('mousemove', dragFns.move);
    addEventListener('mouseup', up);

    return () => {
      removeEventListener('mousemove', dragFns.move);
      removeEventListener('mouseup', up);
    };
  }, [dragFns]);

  const innerGlobals = globals;

  return (
    <div
      id="frame"
      class={appState.dragging ? 'dragging' : ''}
      style="display:contents"
      onPointerDown={innerGlobals?.pointerDown}
      onClickCapture={innerGlobals?.clickCapture}
      onClick={innerGlobals?.click}
      onMouseDown={innerGlobals?.mouseDown}
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

export const setSlot = (name: Slot, node: VNode | null) => {
  slots[name] = node;
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

export const setGate = (node: VNode | null) => {
  gate = node;
  shell = node ? null : shell;
  repaint();
};

export const setShell = (props: ShellProps) => {
  shell = props;
  gate = null;
  repaint();
};

export const shellProps = () => shell;

export function setDragging(on: boolean) {
  appState.dragging = on;
  repaint();
}
