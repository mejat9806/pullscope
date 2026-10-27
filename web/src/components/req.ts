import { useEffect, useRef } from 'preact/hooks';

// Elements that other code may need to scroll, focus or reveal register themselves here under a name; callers ask by name and never hold the element.
const scrollers = new Map<string, (top: number, smooth: boolean) => void>();
export function useScroller(id: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollers.set(id, (top, smooth) => ref.current?.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })); return () => { scrollers.delete(id); }; }, [id]);
  return ref;
}
export const scrollPane = (id: string, top: number, smooth: boolean) => scrollers.get(id)?.(top, smooth);

const focusers = new Map<string, (a: 'focus' | 'select' | 'blur') => void>();
export function useFocusTarget(id: string) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    focusers.set(id, (a) => { const el = ref.current; if (!el) return; if (a === 'blur') el.blur(); else { el.focus(); if (a === 'select') el.select(); } });
    return () => { focusers.delete(id); };
  }, [id]);
  return ref;
}
export const focusTarget = (id: string, a: 'focus' | 'select' | 'blur') => focusers.get(id)?.(a);

// A block that was just opened asks to be brought on screen when part of it is cut off (`reveal(key)`); the block listens by its fold key.
const revealers = new Set<(key: string) => void>();
export const reveal = (key: string) => revealers.forEach((f) => f(key));
export function useReveal<T extends HTMLElement>(key: string | null | undefined) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!key) return;
    const f = (k: string) => {
      const box = ref.current, main = box?.closest('.main'); if (k !== key || !box || !main) return;
      const r = box.getBoundingClientRect(), m = main.getBoundingClientRect();
      if (r.bottom > m.bottom - 8 || r.top < m.top) box.scrollIntoView({ block: r.height > m.height * 0.85 ? 'start' : 'center', behavior: 'smooth' });
    };
    revealers.add(f); return () => { revealers.delete(f); };
  }, [key]);
  return ref;
}
