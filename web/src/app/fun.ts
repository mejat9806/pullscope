import { S } from './core';
import { repaintShell } from './pages';
import { fxAdd } from './overlay';
// ---- Fun: entrance stagger, ripples, confetti (the effects are state in overlay.tsx) ----
let enterTimer: number | undefined;
export function enterAnim() {
  S.enter = true; repaintShell({ enter: true });
  clearTimeout(enterTimer); enterTimer = setTimeout(() => { S.enter = false; repaintShell({ enter: false }); }, 1800);
}

export function ripple(e: PointerEvent) {
  const b = (e.target as HTMLElement).closest<HTMLElement & { disabled?: boolean }>('.btn, .tb-btn, .split-btn, .who-chip, .att-tog, .reaction, .react-add');
  if (!b || b.disabled) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, cs = getComputedStyle(b);
  fxAdd({ k: 'rip', l: r.left, t: r.top, w: r.width, h: r.height, radius: cs.borderRadius, color: cs.color, x: e.clientX - r.left - d / 2, y: e.clientY - r.top - d / 2, d }, 650);
  if (b.matches('.reaction, .react-add')) burst(e.clientX, e.clientY, b.textContent.trim().slice(0, 2) || '✨', 6);
}

export function burst(x: number, y: number, ch: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.6, v = 40 + Math.random() * 50;
    fxAdd({ k: 'burst', x, y, ch, dx: Math.cos(a) * v, dy: Math.sin(a) * v - 30 }, 900);
  }
}

export const confetti = () => fxAdd({ k: 'conf', w: innerWidth, h: innerHeight });
