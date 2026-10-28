import { focusTarget } from '../components/req';
import { appState, queryElement, tauri } from './core';
import { openPr } from './nav';
import { OV, paintOv } from './overlay';
import { render, repaintShell } from './pages';
import { curRef, openTab } from './tabs';
import { paintTop } from './top';

import type {
  AcRow,
  BpGroup,
  BpRow,
  BranchInfo,
  PrListItem,
  RepoSummary,
} from '../types';

// ---- Address bar autocomplete: open tabs and recent PRs, then repositories, then that repo's PR numbers ----
export const AC: {
  rows: AcRow[];
  sel: number;
  nav: boolean;
  prs: Record<string, PrListItem[] | null>;
  rect: DOMRect | null;
} = { rows: [], sel: -1, nav: false, prs: {}, rect: null };

export function acRows(query: string) {
  const text = query.trim();
  const lq = text.toLowerCase();
  const rows: AcRow[] = [];
  const seen = new Set<string | undefined>();

  const add = (acRow: AcRow) => {
    if (!seen.has(acRow.ref || acRow.fill)) {
      seen.add(acRow.ref || acRow.fill);
      rows.push(acRow);
    }
  };

  if (/^https?:\/\//i.test(text)) {
    return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(text)
      ? [
          {
            ref: text,
            label: `Open ${text.replace(/^https?:\/\/github\.com\//, '')}`,
            sub: 'Go to this pull request',
            ic: 'git-pull-request',
          },
        ]
      : [];
  }

  const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);

  const known = [
    ...appState.tabs.map(tab => ({
      ref: tab.ref,
      title: tab.title,
      state: tab.state,
      ic: tab.icon,
    })),
    ...appState.recent.map(recentEntry => ({
      ref: recentEntry.ref,
      title: recentEntry.title,
      state: recentEntry.state,
      ic: recentEntry.icon,
    })),
  ];

  if (pr) {
    const repo = pr[1];
    const num = pr[2];

    if (num) {
      add({
        ref: `${text.split('#')[0]}#${num}`,
        label: `Open ${text.split('#')[0]}#${num}`,
        sub: 'Go to this pull request',
        ic: 'git-pull-request',
      });
    }

    const fromApi = (AC.prs[repo] || []).map(prListItem => ({
      ref: `${prListItem.base?.repo?.full_name || repo}#${prListItem.number}`,
      title: prListItem.title,
      state: prListItem.merged_at ? 'merged' : prListItem.state,
      ic: 'git-pull-request',
    }));

    [
      ...known.filter(item => item.ref.toLowerCase().startsWith(`${repo}#`)),
      ...fromApi,
    ]
      .filter(item => item.ref.toLowerCase().split('#')[1].startsWith(num))
      .slice(0, 8)
      .forEach(item =>
        add({
          ref: item.ref,
          label: item.title || item.ref,
          sub: item.ref,
          ic: item.ic || 'git-pull-request',
          state: item.state,
        }),
      );

    return rows.slice(0, 9);
  }

  known
    .filter(
      item => !lq || `${item.ref} ${item.title}`.toLowerCase().includes(lq),
    )
    .slice(0, lq ? 6 : 8)
    .forEach(item =>
      add({
        ref: item.ref,
        label: item.title || item.ref,
        sub: item.ref,
        ic: item.ic || 'git-pull-request',
        state: item.state,
      }),
    );

  if (lq && appState.repos) {
    appState.repos
      .filter(repoSummary => repoSummary.full_name.toLowerCase().includes(lq))
      .sort(
        (firstRepoSummary, secondRepoSummary) =>
          (secondRepoSummary.full_name.toLowerCase().startsWith(lq) ? 1 : 0) -
          (firstRepoSummary.full_name.toLowerCase().startsWith(lq) ? 1 : 0),
      )
      .slice(0, 6)
      .forEach(repoSummary =>
        add({
          fill: `${repoSummary.full_name}#`,
          label: repoSummary.full_name,
          sub: 'Repository: pick a pull request',
          ic: repoSummary.private ? 'lock' : 'repo',
        }),
      );
  }

  return rows.slice(0, 12);
}

export function acClose() {
  AC.rows = [];
  AC.sel = -1;

  if (OV.ac) {
    OV.ac = null;
    paintOv();
  }
}

// The input is controlled: S.addrText is what the user typed (null = show the open PR's ref) and S.addrFocus says whether suggestions may show.
export function acDraw() {
  if (!appState.addrFocus || !AC.rect) {
    return acClose();
  }

  const query = appState.addrText ?? '';
  AC.rows = acRows(query);

  const match = query
    .trim()
    .toLowerCase()
    .match(/^([^#\s]+\/[^#\s]+)#\d*$/);

  if (match && AC.prs[match[1]] === undefined && tauri) {
    AC.prs[match[1]] = null;

    tauri!
      .invoke('list_prs', { repo: match[1], state: 'all' })
      .then(prListItems => {
        AC.prs[match[1]] = prListItems;
        acDraw();
      })
      .catch(() => {
        AC.prs[match[1]] = [];
      });
  }

  if (!AC.rows.length) {
    return acClose();
  }

  AC.sel = Math.min(AC.sel, AC.rows.length - 1);
  const rect = AC.rect;

  OV.ac = {
    rows: AC.rows,
    sel: AC.sel,
    left: rect.left,
    top: rect.bottom + 6,
    width: rect.width,
    pick: acPick,
  };

  paintOv();
}

const setText = (text: string | null) => {
  appState.addrText = text;
  paintTop();
};

export function acPick(acRow: AcRow) {
  if (!acRow) {
    return;
  }

  if (acRow.fill) {
    setText(acRow.fill);
    focusTarget('addr', 'focus');
    AC.sel = -1;
    acDraw();

    return;
  }

  acClose();
  appState.addrText = null;
  paintTop();
  focusTarget('addr', 'blur');
  openPr(acRow.ref!);
}

export const addrSubmit = (event: Event) => {
  event.preventDefault();
  const text = appState.addrText ?? curText();
  appState.addrText = null;
  acClose();
  focusTarget('addr', 'blur');
  openPr(text);
};

const curText = () =>
  appState.bundle
    ? `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`
    : '';

export const addrInput = (event: Event) => {
  const el = event.currentTarget as HTMLInputElement;
  AC.rect = el.closest('.addr')!.getBoundingClientRect();
  AC.sel = -1;
  setText(el.value);
  acDraw();
};

export const addrFocus = (event: Event) => {
  const el = event.currentTarget as HTMLInputElement;
  AC.rect = el.closest('.addr')!.getBoundingClientRect();
  appState.addrFocus = true;
  AC.sel = -1;
  setTimeout(acDraw, 0);
};

export const addrBlur = () => {
  appState.addrFocus = false;

  setTimeout(() => {
    if (!appState.addrFocus) {
      appState.addrText = null;
      paintTop();
      acClose();
    }
  }, 120);
};

export function addrKey(event: KeyboardEvent) {
  if (!OV.ac) {
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const count = AC.rows.length;

    AC.sel =
      event.key === 'ArrowDown'
        ? (AC.sel + 1) % count
        : (AC.sel - 1 + count) % count;

    acDraw();
  } else if (event.key === 'Tab' && AC.rows.length) {
    event.preventDefault();
    const acRow = AC.rows[Math.max(0, AC.sel)];

    if (acRow.fill) {
      acPick(acRow);
    } else {
      setText(acRow.ref!);
      AC.sel = -1;
      acDraw();
    }
  } else if (event.key === 'Enter' && AC.sel >= 0) {
    event.preventDefault();
    acPick(AC.rows[AC.sel]);
  } else if (event.key === 'Escape') {
    acClose();
  }
}

// Dragging the window: Tauri's drag attribute only works on the exact element it sits on, so treat every non-interactive spot of the toolbar as a handle.
export function winDrag(event: MouseEvent) {
  const element = event.target as HTMLElement;
  const win = window.__TAURI__?.window?.getCurrentWindow?.();

  if (
    event.button !== 0 ||
    element.closest(
      'button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop',
    )
  ) {
    return;
  }

  event.preventDefault();

  if (event.detail === 2) {
    win?.toggleMaximize?.();
  } else {
    win?.startDragging?.();
  }
}

// Branch picker for the New PR page: search, your branches first, the rest grouped by prefix with last-commit age.
export function bpAway(event: MouseEvent) {
  if (OV.bp && !(event.target as HTMLElement).closest('#bppop')) {
    bpClose();
  }
}

export function bpClose() {
  if (OV.bp) {
    OV.bp = null;
    paintOv();
  }
}

export function bpAge(text: string) {
  if (!text) {
    return '';
  }

  const minutes = Math.max(
    1,
    Math.round((Date.now() - +new Date(text)) / 60000),
  );

  return minutes < 60
    ? `${minutes}m`
    : minutes < 1440
      ? `${Math.round(minutes / 60)}h`
      : minutes < 43200
        ? `${Math.round(minutes / 1440)}d`
        : `${Math.round(minutes / 43200)}mo`;
}

export function bpGroups(br: BranchInfo, query: string, me: string): BpGroup[] {
  const det = new Map((br.details || []).map(item => [item.name, item]));
  const rank = new Map(br.branches.map((text, index) => [text, index]));

  const all = br.branches
    .map(name => ({
      name,
      at: det.get(name)?.at || '',
      by: det.get(name)?.by || '',
    }))
    .sort((firstItem, secondItem) =>
      secondItem.at > firstItem.at
        ? 1
        : secondItem.at < firstItem.at
          ? -1
          : rank.get(firstItem.name)! - rank.get(secondItem.name)!,
    );

  if (query) {
    const text = query.toLowerCase();

    return [['', all.filter(item => item.name.toLowerCase().includes(text))]];
  }

  const out: BpGroup[] = [];
  const used = new Set<string>();

  const take = (handler: (bpRow: BpRow) => unknown) =>
    all.filter(
      item => !used.has(item.name) && handler(item) && used.add(item.name),
    );

  const def = take(bpRow => bpRow.name === br.default);

  if (def.length) {
    out.push(['Default', def]);
  }

  const mine = me
    ? take(bpRow => bpRow.by && bpRow.by.toLowerCase() === me.toLowerCase())
    : [];

  if (mine.length) {
    out.push(['Your branches', mine]);
  }

  const rest = take(() => true);
  const pre = new Map<string, BpRow[]>();

  rest.forEach(item => {
    const key = item.name.includes('/') ? `${item.name.split('/')[0]}/` : '';
    (pre.get(key) || pre.set(key, []).get(key)!).push(item);
  });

  const single: BpRow[] = [];

  [...pre.entries()]
    .sort(
      (firstItem, secondItem) =>
        secondItem[1].length - firstItem[1].length ||
        firstItem[0].localeCompare(secondItem[0]),
    )
    .forEach(([key, bpRows]) => {
      if (key && bpRows.length > 1) {
        out.push([key, bpRows]);
      } else {
        single.push(...bpRows);
      }
    });

  if (single.length) {
    out.push([
      out.length ? 'Other' : '',
      single.sort((firstBpRow, secondBpRow) =>
        secondBpRow.at > firstBpRow.at
          ? 1
          : secondBpRow.at < firstBpRow.at
            ? -1
            : 0,
      ),
    ]);
  }

  return out;
}

export function rpGroups(
  repos: RepoSummary[],
  query: string,
  me: string,
): BpGroup[] {
  const all = repos
    .filter(repoSummary => !repoSummary.archived)
    .map(repoSummary => ({
      name: repoSummary.full_name,
      at: repoSummary.pushed_at || '',
      by: repoSummary.private ? 'private' : '',
    }))
    .sort((firstItem, secondItem) =>
      secondItem.at > firstItem.at ? 1 : secondItem.at < firstItem.at ? -1 : 0,
    );

  if (query) {
    const text = query.toLowerCase();

    return [['', all.filter(item => item.name.toLowerCase().includes(text))]];
  }

  const out: BpGroup[] = [];
  const recent = all.slice(0, 5);
  const used = new Set(recent.map(item => item.name));

  if (recent.length) {
    out.push(['Recently pushed', recent]);
  }

  const by = new Map<string, BpRow[]>();

  all
    .filter(item => !used.has(item.name))
    .forEach(item => {
      const option = item.name.split('/')[0];
      (by.get(option) || by.set(option, []).get(option)!).push(item);
    });

  [...by.entries()]
    .sort(
      (firstItem, secondItem) =>
        +(secondItem[0].toLowerCase() === me.toLowerCase()) -
          +(firstItem[0].toLowerCase() === me.toLowerCase()) ||
        secondItem[1].length - firstItem[1].length,
    )
    .forEach(([option, bpRows]) => out.push([option, bpRows]));

  return out;
}

export function bpOpen(
  btn: HTMLElement,
  side: 'repo' | 'base' | 'head',
  pick: (value: string) => void,
  repoMode = false,
) {
  bpClose();

  const newPr = appState.np;
  const br = repoMode ? null : newPr!.branches[newPr!.repo];

  if (!repoMode && !br) {
    return;
  }

  const cur = repoMode ? newPr!.repo : newPr![side];
  const me = appState.profile?.login || '';
  const rect = btn.getBoundingClientRect();
  const width = Math.max(rect.width, 340);
  const below = innerHeight - rect.bottom;
  const up = below < 300 && rect.top > below;
  const style = `left:${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px;width:${width}px;max-height:${Math.min(420, (up ? rect.top : below) - 16)}px;${up ? `bottom:${innerHeight - rect.top + 4}px` : `top:${rect.bottom + 4}px`}`;

  const done = (value?: string) => {
    bpClose();

    if (value && value !== cur) {
      pick(value);
    }
  };

  OV.bp = {
    repoMode,
    style,
    cur,
    age: bpAge,
    done,
    groupsFor: query =>
      repoMode
        ? rpGroups(appState.repos || [], query, me)
        : bpGroups(br!, query, me),
  };

  paintOv();
}

export const focusAddr = () => focusTarget('addr', 'select');

export const avUrl = (url: string, count: number) =>
  `${url}${url.includes('?') ? '&' : '?'}s=${count}`;

export function loadProfile() {
  if (!tauri) {
    return;
  }

  tauri!
    .invoke('viewer_profile')
    .then(profile => {
      appState.me = profile.login;
      appState.profile = profile;

      try {
        localStorage.setItem('profile', JSON.stringify(profile));
      } catch {
        /* storage full */
      }

      render();
    })
    .catch(() => {});
}

export const openExternal = (url: string) =>
  tauri ? tauri!.invoke('open_external', { url }) : window.open(url, '_blank');

// Opening a PR that already has a tab goes to that tab instead of making another page.
export function openFromList(ref: string, newTab: boolean) {
  const have = appState.tabs.some(tab => tab.ref === ref);

  if (have && !appState.focus) {
    if (ref === curRef()) {
      appState.tabMenu = false;

      return;
    }

    return openTab(ref);
  }

  return newTab ? openTab(ref, { newTab: true }) : openPr(ref);
}

let stuckOn: Element | null = null;

export function bindSticky() {
  const ta = queryElement('.pr-title-area');
  const tb = queryElement('.pr-tabs');

  if (ta && ta === stuckOn && appState.ios?.length) {
    return;
  }

  stuckOn = ta;

  if (ta && tb && !queryElement('.is-split')) {
    const io = new IntersectionObserver(
      ([en]) => {
        const flag = !en.isIntersecting && en.boundingClientRect.bottom < 0;

        if (!!appState.stuck !== flag) {
          appState.stuck = flag;
          repaintShell({ stuck: flag });
        }
      },
      { root: queryElement('.main'), threshold: 0 },
    );

    io.observe(ta);
    appState.ios!.push(io);
  }
}
