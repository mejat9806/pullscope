import { appState } from './core';
import { fxAdd } from './overlay';
import { repaintShell } from './pages';

// ---- Fun: entrance stagger, ripples, confetti (the effects are state in overlay.tsx) ----
let enterTimer: number | undefined;

export function enterAnim() {
  appState.enter = true;
  repaintShell({ enter: true });
  clearTimeout(enterTimer);

  enterTimer = setTimeout(() => {
    appState.enter = false;
    repaintShell({ enter: false });
  }, 1800);
}

export function ripple(event: PointerEvent) {
  const value = (event.target as HTMLElement).closest<
    HTMLElement & { disabled?: boolean }
  >('.btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add');

  if (!value || value.disabled) {
    return;
  }

  const rect = value.getBoundingClientRect();
  const delta = Math.max(rect.width, rect.height) * 2;
  const cs = getComputedStyle(value);

  fxAdd(
    {
      k: 'rip',
      l: rect.left,
      t: rect.top,
      w: rect.width,
      h: rect.height,
      radius: cs.borderRadius,
      color: cs.color,
      x: event.clientX - rect.left - delta / 2,
      y: event.clientY - rect.top - delta / 2,
      d: delta,
    },
    650,
  );

  if (value.matches('.reaction, .react-add')) {
    burst(
      event.clientX,
      event.clientY,
      value.textContent.trim().slice(0, 2) || '✨',
      6,
    );
  }
}

export function burst(
  leftLeft: number,
  rightOffset: number,
  ch: string,
  count: number,
) {
  for (let index = 0; index < count; index++) {
    const first = (Math.PI * 2 * index) / count + Math.random() * 0.6;
    const value = 40 + Math.random() * 50;

    fxAdd(
      {
        k: 'burst',
        x: leftLeft,
        y: rightOffset,
        ch,
        dx: Math.cos(first) * value,
        dy: Math.sin(first) * value - 30,
      },
      900,
    );
  }
}

export const confetti = () =>
  fxAdd({ k: 'conf', w: innerWidth, h: innerHeight });
