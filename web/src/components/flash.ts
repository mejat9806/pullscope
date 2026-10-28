import { useEffect, useRef } from 'preact/hooks';

// A comment to highlight: `n` changes on every jump so the same comment can be flashed again; the comment scrolls itself into view.
export interface FlashProps { n: number; block: 'start' | 'center'; smooth?: boolean; pop?: boolean }

export const flashClass = (f?: FlashProps) => (f ? ` flash${f.pop ? ' pop-in' : ''}` : '');

export function useFlash(f?: FlashProps, kb?: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // The page keeps growing for a moment after a jump (highlighting, lazy content above the comment), so the comment is brought back into view until that settles or the reader scrolls.
  useEffect(() => {
    const el = ref.current; if (!f || !el) return;
    el.scrollIntoView({ block: f.block, behavior: f.smooth ? 'smooth' : 'auto' });
    const main = el.closest('.main'); if (!main) return;
    const end = Date.now() + 1500; let moved = false, h = main.scrollHeight;
    const stop = () => { moved = true; };
    const timer = setInterval(() => { if (moved || Date.now() > end) return clearInterval(timer); if (main.scrollHeight !== h) { h = main.scrollHeight; el.scrollIntoView({ block: f.block }); } }, 50);
    addEventListener('wheel', stop, { passive: true }); addEventListener('touchmove', stop, { passive: true }); addEventListener('keydown', stop);
    return () => { clearInterval(timer); removeEventListener('wheel', stop); removeEventListener('touchmove', stop); removeEventListener('keydown', stop); };
  }, [f?.n]);
  useEffect(() => { if (kb) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [kb]);
  return ref;
}
