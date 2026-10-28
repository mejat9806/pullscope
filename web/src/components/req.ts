import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';

// Requests are state: one numbered entry per target name. Anything may set one with `request`; the component that owns the target reads it
// (`useOnRequest`) and acts in an effect. Nobody holds an element and nobody calls into a component.
export interface Req {
  n: number;
  a?: string;
  top?: number;
  smooth?: boolean;
}

const reqs = new Map<string, Req>();
const subs = new Map<string, Set<() => void>>();

export function request(id: string, req: Omit<Req, 'n'> = {}) {
  reqs.set(id, { ...req, n: (reqs.get(id)?.n || 0) + 1 });
  subs.get(id)?.forEach(handler => handler());
}

export function useOnRequest(
  id: string,
  apply: (otherRequest: Req) => void,
  layout = false,
) {
  const [, tick] = useState(0);
  const otherRequest = reqs.get(id);
  const seen = useRef(otherRequest?.n);
  const act = useRef(apply);
  act.current = apply;

  useEffect(() => {
    const handler = () => tick(time => time + 1);

    let names = subs.get(id);

    if (!names) {
      subs.set(id, (names = new Set()));
    }

    names.add(handler);

    if (
      reqs.get(id)?.n !== seen.current &&
      reqs.get(id)?.n !== otherRequest?.n
    ) {
      handler();
    } // asked between our render and this effect

    return () => {
      names!.delete(handler);
    };
  }, [id]);

  (layout ? useLayoutEffect : useEffect)(() => {
    if (otherRequest && otherRequest.n !== seen.current) {
      seen.current = otherRequest.n;
      act.current(otherRequest);
    }
  }, [otherRequest?.n]);
}

// The page and each split-view pane scroll when asked (`scroll:<id>`).
export function useScroller(id: string, layout = false) {
  const ref = useRef<HTMLDivElement>(null);

  useOnRequest(
    `scroll:${id}`,
    otherRequest =>
      ref.current?.scrollTo({
        top: otherRequest.top || 0,
        behavior: otherRequest.smooth ? 'smooth' : 'auto',
      }),
    layout,
  );

  return ref;
}

export const scrollTarget = (id: string, top: number, smooth: boolean) =>
  request(`scroll:${id}`, { top, smooth });

// An input takes the caret, selects its text or lets go when asked (`focus:<id>`).
export function useFocusTarget(id: string) {
  const ref = useRef<HTMLInputElement>(null);

  useOnRequest(`focus:${id}`, otherRequest => {
    const el = ref.current;

    if (!el) {
      return;
    }

    if (otherRequest.a === 'blur') {
      el.blur();
    } else {
      el.focus();

      if (otherRequest.a === 'select') {
        el.select();
      }
    }
  });

  return ref;
}

export const focusTarget = (id: string, action: 'focus' | 'select' | 'blur') =>
  request(`focus:${id}`, { a: action });

// A block that was just opened is brought on screen when part of it is cut off (`reveal:<fold key>`).
export const reveal = (key: string) => request(`reveal:${key}`);

export function useReveal<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);

  useOnRequest(`reveal:${key}`, () => {
    const box = ref.current;
    const main = box?.closest('.main');

    if (!box || !main) {
      return;
    }

    const rect = box.getBoundingClientRect();
    const otherRect = main.getBoundingClientRect();

    if (rect.bottom > otherRect.bottom - 8 || rect.top < otherRect.top) {
      box.scrollIntoView({
        block: rect.height > otherRect.height * 0.85 ? 'start' : 'center',
        behavior: 'smooth',
      });
    }
  });

  return ref;
}
