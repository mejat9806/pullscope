import { appState, load } from './core';
import { openPr } from './nav';
import { inboxProps, render } from './pages';

// Inbox extras: pin, snooze, saved views and keyboard control. All of it is stored locally.
export interface IbView {
  name: string;
  q: string;
  sort: string;
}

const put = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full */
  }
};

export const ibPins = (): string[] =>
  (appState.ibPins ||= load<string[]>('ibpins', []));

export const ibSnz = (): Record<string, { until: number; at: string }> =>
  (appState.ibSnz ||= load<Record<string, { until: number; at: string }>>(
    'ibsnooze',
    {},
  ));

export const ibViews = (): IbView[] =>
  (appState.ibViews ||= load<IbView[]>('ibviews', []));

// Snoozed until a time, or (until 0) until the PR has activity newer than when it was snoozed.
export const isSnoozed = (ref: string, updated: string) => {
  const entry = ibSnz()[ref];

  return (
    !!entry &&
    (entry.until > 0 ? Date.now() < entry.until : updated <= entry.at)
  );
};

export const snoozeLabel = (ref: string) => {
  const entry = ibSnz()[ref];

  return !entry
    ? ''
    : entry.until > 0
      ? `Until ${new Date(entry.until).toLocaleString([], {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })}`
      : 'Until new activity';
};

export function ibPin(ref: string) {
  const paths = ibPins();

  appState.ibPins = paths.includes(ref)
    ? paths.filter(text => text !== ref)
    : [...paths, ref];

  put('ibpins', appState.ibPins);
  render();
}

const at = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);

  return date.getTime();
};

export function ibSnooze(
  ref: string,
  kind: 'tomorrow' | 'week' | 'activity' | 'off',
  updated = '',
) {
  const entry = { ...ibSnz() };
  appState.ibSnzOpen = '';

  if (kind === 'off') {
    delete entry[ref];
  } else {
    entry[ref] = {
      until:
        kind === 'tomorrow'
          ? at(1, 9)
          : kind === 'week'
            ? at((8 - new Date().getDay()) % 7 || 7, 9)
            : 0,
      at: updated,
    };
  }

  appState.ibSnz = entry;
  put('ibsnooze', entry);
  render();
}

export function viewSave(rawName: string) {
  const name = rawName.trim();
  appState.ibNaming = false;

  if (!name) {
    return render();
  }

  appState.ibViews = [
    ...ibViews().filter(ibView => ibView.name !== name),
    { name, q: appState.ibQ || '', sort: appState.ibSort || 'updated' },
  ];

  put('ibviews', appState.ibViews);
  render();
}

export function viewApply(name: string) {
  const ibView = ibViews().find(otherIbView => otherIbView.name === name);

  if (!ibView) {
    return;
  }

  appState.ibQ = ibView.q;
  appState.ibSort = ibView.sort;
  appState.ibView = name;

  try {
    localStorage.setItem('ibsort', ibView.sort);
  } catch {
    /* ignore */
  }

  render();
}

export function viewDelete(name: string) {
  appState.ibViews = ibViews().filter(ibView => ibView.name !== name);
  put('ibviews', appState.ibViews);

  if (appState.ibView === name) {
    appState.ibView = '';
  }

  render();
}

// Rows you can see, in screen order, so the keyboard can walk them.
const visible = () =>
  (inboxProps().secs || [])
    .filter(inboxSec => !inboxSec.closed)
    .flatMap(inboxSec =>
      inboxSec.rows.map(ibRow => ({
        ref: ibRow.ref,
        sec: inboxSec.key,
        updated: ibRow.updated,
      })),
    );

const keep = () =>
  requestAnimationFrame(() =>
    document.querySelector('.ib-row.sel')?.scrollIntoView({ block: 'nearest' }),
  );

// j/k or arrows move, Enter opens, p pins, s snoozes, e folds the section, / filters. Returns true when the key was used.
export function inboxKey(event: KeyboardEvent): boolean {
  const rows = visible();
  const index = rows.findIndex(row => row.ref === appState.ibSel);
  const cur = rows[index];

  const move = (delta: number) => {
    if (rows.length) {
      appState.ibSel =
        rows[
          Math.max(
            0,
            Math.min(
              rows.length - 1,
              index < 0 ? (delta > 0 ? 0 : rows.length - 1) : index + delta,
            ),
          )
        ].ref;

      render();
      keep();
    }
  };

  if (event.key === 'j' || event.key === 'ArrowDown') {
    move(1);
  } else if (event.key === 'k' || event.key === 'ArrowUp') {
    move(-1);
  } else if (event.key === 'Enter' && cur) {
    openPr(cur.ref);
  } else if (event.key === 'p' && cur) {
    ibPin(cur.ref);
  } else if (event.key === 's' && cur) {
    appState.ibSnzOpen = appState.ibSnzOpen === cur.ref ? '' : cur.ref;
    render();
  } else if (event.key === 'e' && cur) {
    appState.fold[cur.sec] = !appState.fold[cur.sec];

    try {
      localStorage.setItem('fold', JSON.stringify(appState.fold));
    } catch {
      /* ignore */
    }

    render();
  } else if (event.key === '/') {
    document.querySelector<HTMLInputElement>('.ib-bar input')?.focus();
  } else {
    return false;
  }

  event.preventDefault();

  return true;
}
