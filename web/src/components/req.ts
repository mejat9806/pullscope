import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

// Requests are state: one numbered entry per target name. Anything may set one with `request`; the component that owns the target reads it
// (`useOnRequest`) and acts in an effect. Nobody holds an element and nobody calls into a component.
export interface Req { n: number; a?: string; top?: number; smooth?: boolean }
const reqs = new Map<string, Req>();
const subs = new Map<string, Set<() => void>>();
export function request(id: string, r: Omit<Req, 'n'> = {}) { reqs.set(id, { ...r, n: (reqs.get(id)?.n || 0) + 1 }); subs.get(id)?.forEach((f) => f()); }

export function useOnRequest(id: string, apply: (r: Req) => void, layout = false) {
  const [, tick] = useState(0), r = reqs.get(id), seen = useRef(r?.n), act = useRef(apply); act.current = apply;
  useEffect(() => {
    const f = () => tick((t) => t + 1);
    let s = subs.get(id); if (!s) subs.set(id, s = new Set()); s.add(f);
    if (reqs.get(id)?.n !== seen.current && reqs.get(id)?.n !== r?.n) f(); // asked between our render and this effect
    return () => { s!.delete(f); };
  }, [id]);
  (layout ? useLayoutEffect : useEffect)(() => { if (r && r.n !== seen.current) { seen.current = r.n; act.current(r); } }, [r?.n]);
}

// The page and each split-view pane scroll when asked (`scroll:<id>`).
export function useScroller(id: string, layout = false) {
  const ref = useRef<HTMLDivElement>(null);
  useOnRequest('scroll:' + id, (r) => ref.current?.scrollTo({ top: r.top || 0, behavior: r.smooth ? 'smooth' : 'auto' }), layout);
  return ref;
}
export const scrollTarget = (id: string, top: number, smooth: boolean) => request('scroll:' + id, { top, smooth });

// An input takes the caret, selects its text or lets go when asked (`focus:<id>`).
export function useFocusTarget(id: string) {
  const ref = useRef<HTMLInputElement>(null);
  useOnRequest('focus:' + id, (r) => { const el = ref.current; if (!el) return; if (r.a === 'blur') el.blur(); else { el.focus(); if (r.a === 'select') el.select(); } });
  return ref;
}
export const focusTarget = (id: string, a: 'focus' | 'select' | 'blur') => request('focus:' + id, { a });

// A block that was just opened is brought on screen when part of it is cut off (`reveal:<fold key>`).
export const reveal = (key: string) => request('reveal:' + key);
export function useReveal<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  useOnRequest('reveal:' + key, () => {
    const box = ref.current, main = box?.closest('.main'); if (!box || !main) return;
    const r = box.getBoundingClientRect(), m = main.getBoundingClientRect();
    if (r.bottom > m.bottom - 8 || r.top < m.top) box.scrollIntoView({ block: r.height > m.height * 0.85 ? 'start' : 'center', behavior: 'smooth' });
  });
  return ref;
}
