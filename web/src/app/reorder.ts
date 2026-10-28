import { load, S } from './core';
import { beginDrag, setDragging } from './frame';
import { render } from './pages';

// Lists the user can rearrange by their grip: Inbox sections, repositories, the pull request side panel.
// Each item is an element with data-t=<key>; the saved order is a list of keys kept in localStorage.

const mem = new Map<string, string[]>();

export const savedOrder = (id: string): string[] => {
  if (!mem.has(id)) {
    mem.set(id, load<string[]>(`order:${id}`, []));
  }

  return mem.get(id)!;
};

export const saveOrder = (id: string, o: string[]) => {
  mem.set(id, o);

  try {
    if (o.length) {
      localStorage.setItem(`order:${id}`, JSON.stringify(o));
    } else {
      localStorage.removeItem(`order:${id}`);
    }
  } catch {
    /* storage full */
  }

  render();
};

// Saved keys first, then anything new in its natural place; keys that no longer exist are dropped.
export const arrange = <T>(
  items: T[],
  id: string,
  key: (t: T) => string,
): T[] => {
  const saved = savedOrder(id);

  const rank = (t: T) => {
    const i = saved.indexOf(key(t));

    return i < 0 ? saved.length + items.indexOf(t) : i;
  };

  return [...items].sort((a, b) => rank(a) - rank(b));
};

// Classes that show the item being dragged and the spot it would drop into.
export const roCls = (id: string, key: string) => {
  const r = S.ro;

  if (!r || r.id !== id) {
    return '';
  }

  return (
    (r.key === key ? ' ro-lift' : '') +
    (r.key !== key && r.over?.title === key
      ? r.over.after
        ? ' ro-over-after'
        : ' ro-over-before'
      : '')
  );
};

const tops = (sel: string) =>
  new Map(
    [...document.querySelectorAll<HTMLElement>(sel)].map(e => [
      e.dataset.t!,
      e.getBoundingClientRect().top,
    ]),
  );

// Save a new order; items slide to their new places (FLIP) and the moved one flashes, so it is clear what changed.
export function roMove(sel: string, key: string, save: () => void) {
  const before = tops(sel);
  save();

  const slide = (e: HTMLElement) => {
    const dy = (before.get(e.dataset.t!) ?? 0) - e.getBoundingClientRect().top;

    if (Math.abs(dy) > 1) {
      e.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
        duration: 320,
        easing: 'cubic-bezier(.2,.8,.2,1)',
      });
    }

    if (e.dataset.t === key) {
      e.classList.add('ro-moved');
      setTimeout(() => e.classList.remove('ro-moved'), 1400);
    }
  };

  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      document.querySelectorAll<HTMLElement>(sel).forEach(slide),
    ),
  );
}

// Grab an item by its grip: the others show where it would land, and letting go moves it.
// `order` is the full current order (all keys); `commit` stores the new one.
export function roGrip(
  e: MouseEvent,
  id: string,
  sel: string,
  key: string,
  order: () => string[],
  commit: (o: string[]) => void,
) {
  e.preventDefault();
  e.stopPropagation();
  const y0 = e.clientY;

  let started = false;

  const over = (y: number) => {
    const els = [...document.querySelectorAll<HTMLElement>(sel)].filter(
      x => x.dataset.t !== key,
    );

    const hit =
      els.find(x => {
        const r = x.getBoundingClientRect();

        return y >= r.top && y <= r.bottom;
      }) ||
      els.reduce<HTMLElement | null>(
        (b, x) =>
          !b ||
          Math.abs(x.getBoundingClientRect().top - y) <
            Math.abs(b.getBoundingClientRect().top - y)
            ? x
            : b,
        null,
      );

    if (!hit) {
      return null;
    }

    const r = hit.getBoundingClientRect();

    return {
      title: hit.dataset.t!,
      after: y > r.top + Math.min(r.height / 2, 60),
    };
  };

  beginDrag({
    move: ev => {
      if (!started) {
        if (Math.abs(ev.clientY - y0) < 5) {
          return;
        }

        started = true;
        S.ro = { id, key, over: null };
        setDragging(true);
      }

      const o = over(ev.clientY);
      const cur = S.ro?.over;

      if (o?.title !== cur?.title || o?.after !== cur?.after) {
        S.ro = { id, key, over: o };
        render();
      }
    },
    end: () => {
      const to = S.ro?.over;
      setDragging(false);
      S.ro = null;

      if (!started) {
        return;
      }

      if (!to) {
        return render();
      }

      const o = order().filter(x => x !== key);
      o.splice(o.indexOf(to.title) + (to.after ? 1 : 0), 0, key);
      roMove(sel, key, () => commit(o));
    },
  });
}
