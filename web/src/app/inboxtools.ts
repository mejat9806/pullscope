import { load, S } from './core';
import { openPr } from './nav';
import { inboxProps, render } from './pages';

// Inbox extras: pin, snooze, saved views and keyboard control. All of it is stored locally.
export interface IbView {
  name: string;
  q: string;
  sort: string;
}

const put = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full */
  }
};

export const ibPins = (): string[] =>
  (S.ibPins ||= load<string[]>('ibpins', []));

export const ibSnz = (): Record<string, { until: number; at: string }> =>
  (S.ibSnz ||= load<Record<string, { until: number; at: string }>>(
    'ibsnooze',
    {},
  ));

export const ibViews = (): IbView[] =>
  (S.ibViews ||= load<IbView[]>('ibviews', []));

// Snoozed until a time, or (until 0) until the PR has activity newer than when it was snoozed.
export const isSnoozed = (ref: string, updated: string) => {
  const z = ibSnz()[ref];

  return !!z && (z.until > 0 ? Date.now() < z.until : updated <= z.at);
};

export const snoozeLabel = (ref: string) => {
  const z = ibSnz()[ref];

  return !z
    ? ''
    : z.until > 0
      ? `Until ${new Date(z.until).toLocaleString([], {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })}`
      : 'Until new activity';
};

export function ibPin(ref: string) {
  const p = ibPins();
  S.ibPins = p.includes(ref) ? p.filter(x => x !== ref) : [...p, ref];
  put('ibpins', S.ibPins);
  render();
}

const at = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);

  return d.getTime();
};

export function ibSnooze(
  ref: string,
  kind: 'tomorrow' | 'week' | 'activity' | 'off',
  updated = '',
) {
  const z = { ...ibSnz() };
  S.ibSnzOpen = '';

  if (kind === 'off') {
    delete z[ref];
  } else {
    z[ref] = {
      until:
        kind === 'tomorrow'
          ? at(1, 9)
          : kind === 'week'
            ? at((8 - new Date().getDay()) % 7 || 7, 9)
            : 0,
      at: updated,
    };
  }

  S.ibSnz = z;
  put('ibsnooze', z);
  render();
}

export function viewSave(rawName: string) {
  const name = rawName.trim();
  S.ibNaming = false;

  if (!name) {
    return render();
  }

  S.ibViews = [
    ...ibViews().filter(v => v.name !== name),
    { name, q: S.ibQ || '', sort: S.ibSort || 'updated' },
  ];

  put('ibviews', S.ibViews);
  render();
}

export function viewApply(name: string) {
  const v = ibViews().find(x => x.name === name);

  if (!v) {
    return;
  }

  S.ibQ = v.q;
  S.ibSort = v.sort;
  S.ibView = name;

  try {
    localStorage.setItem('ibsort', v.sort);
  } catch {
    /* ignore */
  }

  render();
}

export function viewDelete(name: string) {
  S.ibViews = ibViews().filter(v => v.name !== name);
  put('ibviews', S.ibViews);

  if (S.ibView === name) {
    S.ibView = '';
  }

  render();
}

// Rows you can see, in screen order, so the keyboard can walk them.
const visible = () =>
  (inboxProps().secs || [])
    .filter(s => !s.closed)
    .flatMap(s =>
      s.rows.map(r => ({ ref: r.ref, sec: s.key, updated: r.updated })),
    );

const keep = () =>
  requestAnimationFrame(() =>
    document.querySelector('.ib-row.sel')?.scrollIntoView({ block: 'nearest' }),
  );

// j/k or arrows move, Enter opens, p pins, s snoozes, e folds the section, / filters. Returns true when the key was used.
export function inboxKey(e: KeyboardEvent): boolean {
  const rows = visible();
  const i = rows.findIndex(r => r.ref === S.ibSel);
  const cur = rows[i];

  const move = (d: number) => {
    if (rows.length) {
      S.ibSel =
        rows[
          Math.max(
            0,
            Math.min(
              rows.length - 1,
              i < 0 ? (d > 0 ? 0 : rows.length - 1) : i + d,
            ),
          )
        ].ref;

      render();
      keep();
    }
  };

  if (e.key === 'j' || e.key === 'ArrowDown') {
    move(1);
  } else if (e.key === 'k' || e.key === 'ArrowUp') {
    move(-1);
  } else if (e.key === 'Enter' && cur) {
    openPr(cur.ref);
  } else if (e.key === 'p' && cur) {
    ibPin(cur.ref);
  } else if (e.key === 's' && cur) {
    S.ibSnzOpen = S.ibSnzOpen === cur.ref ? '' : cur.ref;
    render();
  } else if (e.key === 'e' && cur) {
    S.fold[cur.sec] = !S.fold[cur.sec];

    try {
      localStorage.setItem('fold', JSON.stringify(S.fold));
    } catch {
      /* ignore */
    }

    render();
  } else if (e.key === '/') {
    document.querySelector<HTMLInputElement>('.ib-bar input')?.focus();
  } else {
    return false;
  }

  e.preventDefault();

  return true;
}
