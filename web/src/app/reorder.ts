import { appState, load } from './core';
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

export const saveOrder = (id: string, options: string[]) => {
  mem.set(id, options);

  try {
    if (options.length) {
      localStorage.setItem(`order:${id}`, JSON.stringify(options));
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
  key: (item: T) => string,
): T[] => {
  const saved = savedOrder(id);

  const rank = (item: T) => {
    const index = saved.indexOf(key(item));

    return index < 0 ? saved.length + items.indexOf(item) : index;
  };

  return [...items].sort(
    (firstItem, secondItem) => rank(firstItem) - rank(secondItem),
  );
};

// Classes that show the item being dragged and the spot it would drop into.
export const roCls = (id: string, key: string) => {
  const row = appState.ro;

  if (!row || row.id !== id) {
    return '';
  }

  return (
    (row.key === key ? ' ro-lift' : '') +
    (row.key !== key && row.over?.title === key
      ? row.over.after
        ? ' ro-over-after'
        : ' ro-over-before'
      : '')
  );
};

const tops = (sel: string) =>
  new Map(
    [...document.querySelectorAll<HTMLElement>(sel)].map(element => [
      element.dataset.t!,
      element.getBoundingClientRect().top,
    ]),
  );

// Save a new order; items slide to their new places (FLIP) and the moved one flashes, so it is clear what changed.
export function roMove(sel: string, key: string, save: () => void) {
  const before = tops(sel);
  save();

  const slide = (element: HTMLElement) => {
    const dy =
      (before.get(element.dataset.t!) ?? 0) -
      element.getBoundingClientRect().top;

    if (Math.abs(dy) > 1) {
      element.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
        {
          duration: 320,
          easing: 'cubic-bezier(.2,.8,.2,1)',
        },
      );
    }

    if (element.dataset.t === key) {
      element.classList.add('ro-moved');
      setTimeout(() => element.classList.remove('ro-moved'), 1400);
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
  event: MouseEvent,
  id: string,
  sel: string,
  key: string,
  order: () => string[],
  commit: (options: string[]) => void,
) {
  event.preventDefault();
  event.stopPropagation();
  const y0 = event.clientY;

  let started = false;

  const over = (offset: number) => {
    const els = [...document.querySelectorAll<HTMLElement>(sel)].filter(
      element => element.dataset.t !== key,
    );

    const hit =
      els.find(element => {
        const rect = element.getBoundingClientRect();

        return offset >= rect.top && offset <= rect.bottom;
      }) ||
      els.reduce<HTMLElement | null>(
        (element, otherElement) =>
          !element ||
          Math.abs(otherElement.getBoundingClientRect().top - offset) <
            Math.abs(element.getBoundingClientRect().top - offset)
            ? otherElement
            : element,
        null,
      );

    if (!hit) {
      return null;
    }

    const otherRect = hit.getBoundingClientRect();

    return {
      title: hit.dataset.t!,
      after: offset > otherRect.top + Math.min(otherRect.height / 2, 60),
    };
  };

  beginDrag({
    move: ev => {
      if (!started) {
        if (Math.abs(ev.clientY - y0) < 5) {
          return;
        }

        started = true;
        appState.ro = { id, key, over: null };
        setDragging(true);
      }

      const options = over(ev.clientY);
      const cur = appState.ro?.over;

      if (options?.title !== cur?.title || options?.after !== cur?.after) {
        appState.ro = { id, key, over: options };
        render();
      }
    },
    end: () => {
      const to = appState.ro?.over;
      setDragging(false);
      appState.ro = null;

      if (!started) {
        return;
      }

      if (!to) {
        return render();
      }

      const options = order().filter(text => text !== key);
      options.splice(options.indexOf(to.title) + (to.after ? 1 : 0), 0, key);
      roMove(sel, key, () => commit(options));
    },
  });
}
