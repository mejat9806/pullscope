import { useEffect, useRef } from 'preact/hooks';

// A comment to highlight: `n` changes on every jump so the same comment can be flashed again; the comment scrolls itself into view.
export interface FlashProps { n: number; block: 'start' | 'center'; smooth?: boolean; pop?: boolean }

export const flashClass = (f?: FlashProps) => (f ? ` flash${f.pop ? ' pop-in' : ''}` : '');

export function useFlash(f?: FlashProps, kb?: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (f) ref.current?.scrollIntoView({ block: f.block, behavior: f.smooth ? 'smooth' : 'auto' }); }, [f?.n]);
  useEffect(() => { if (kb) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [kb]);
  return ref;
}
