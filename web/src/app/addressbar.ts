import { focusTarget } from '../components/req';
import { $, S, tauri } from './core';
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

export function acRows(q: string) {
  const t = q.trim();
  const lq = t.toLowerCase();
  const rows: AcRow[] = [];
  const seen = new Set<string | undefined>();

  const add = (r: AcRow) => {
    if (!seen.has(r.ref || r.fill)) {
      seen.add(r.ref || r.fill);
      rows.push(r);
    }
  };

  if (/^https?:\/\//i.test(t)) {
    return /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(t)
      ? [
          {
            ref: t,
            label: `Open ${t.replace(/^https?:\/\/github\.com\//, '')}`,
            sub: 'Go to this pull request',
            ic: 'git-pull-request',
          },
        ]
      : [];
  }

  const pr = lq.match(/^([^#\s]+\/[^#\s]+)#(\d*)$/);

  const known = [
    ...S.tabs.map(x => ({
      ref: x.ref,
      title: x.title,
      state: x.state,
      ic: x.icon,
    })),
    ...S.recent.map(x => ({
      ref: x.ref,
      title: x.title,
      state: x.state,
      ic: x.icon,
    })),
  ];

  if (pr) {
    const repo = pr[1];
    const num = pr[2];

    if (num) {
      add({
        ref: `${t.split('#')[0]}#${num}`,
        label: `Open ${t.split('#')[0]}#${num}`,
        sub: 'Go to this pull request',
        ic: 'git-pull-request',
      });
    }

    const fromApi = (AC.prs[repo] || []).map(x => ({
      ref: `${x.base?.repo?.full_name || repo}#${x.number}`,
      title: x.title,
      state: x.merged_at ? 'merged' : x.state,
      ic: 'git-pull-request',
    }));

    [
      ...known.filter(x => x.ref.toLowerCase().startsWith(`${repo}#`)),
      ...fromApi,
    ]
      .filter(x => x.ref.toLowerCase().split('#')[1].startsWith(num))
      .slice(0, 8)
      .forEach(x =>
        add({
          ref: x.ref,
          label: x.title || x.ref,
          sub: x.ref,
          ic: x.ic || 'git-pull-request',
          state: x.state,
        }),
      );

    return rows.slice(0, 9);
  }

  known
    .filter(x => !lq || `${x.ref} ${x.title}`.toLowerCase().includes(lq))
    .slice(0, lq ? 6 : 8)
    .forEach(x =>
      add({
        ref: x.ref,
        label: x.title || x.ref,
        sub: x.ref,
        ic: x.ic || 'git-pull-request',
        state: x.state,
      }),
    );

  if (lq && S.repos) {
    S.repos
      .filter(r => r.full_name.toLowerCase().includes(lq))
      .sort(
        (a, b) =>
          (b.full_name.toLowerCase().startsWith(lq) ? 1 : 0) -
          (a.full_name.toLowerCase().startsWith(lq) ? 1 : 0),
      )
      .slice(0, 6)
      .forEach(r =>
        add({
          fill: `${r.full_name}#`,
          label: r.full_name,
          sub: 'Repository: pick a pull request',
          ic: r.private ? 'lock' : 'repo',
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
  if (!S.addrFocus || !AC.rect) {
    return acClose();
  }

  const q = S.addrText ?? '';
  AC.rows = acRows(q);

  const m = q
    .trim()
    .toLowerCase()
    .match(/^([^#\s]+\/[^#\s]+)#\d*$/);

  if (m && AC.prs[m[1]] === undefined && tauri) {
    AC.prs[m[1]] = null;

    tauri!
      .invoke('list_prs', { repo: m[1], state: 'all' })
      .then(r => {
        AC.prs[m[1]] = r;
        acDraw();
      })
      .catch(() => {
        AC.prs[m[1]] = [];
      });
  }

  if (!AC.rows.length) {
    return acClose();
  }

  AC.sel = Math.min(AC.sel, AC.rows.length - 1);
  const b = AC.rect;

  OV.ac = {
    rows: AC.rows,
    sel: AC.sel,
    left: b.left,
    top: b.bottom + 6,
    width: b.width,
    pick: acPick,
  };

  paintOv();
}

const setText = (t: string | null) => {
  S.addrText = t;
  paintTop();
};

export function acPick(r: AcRow) {
  if (!r) {
    return;
  }

  if (r.fill) {
    setText(r.fill);
    focusTarget('addr', 'focus');
    AC.sel = -1;
    acDraw();

    return;
  }

  acClose();
  S.addrText = null;
  paintTop();
  focusTarget('addr', 'blur');
  openPr(r.ref!);
}

export const addrSubmit = (e: Event) => {
  e.preventDefault();
  const t = S.addrText ?? curText();
  S.addrText = null;
  acClose();
  focusTarget('addr', 'blur');
  openPr(t);
};

const curText = () =>
  S.bundle
    ? `${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`
    : '';

export const addrInput = (e: Event) => {
  const el = e.currentTarget as HTMLInputElement;
  AC.rect = el.closest('.addr')!.getBoundingClientRect();
  AC.sel = -1;
  setText(el.value);
  acDraw();
};

export const addrFocus = (e: Event) => {
  const el = e.currentTarget as HTMLInputElement;
  AC.rect = el.closest('.addr')!.getBoundingClientRect();
  S.addrFocus = true;
  AC.sel = -1;
  setTimeout(acDraw, 0);
};

export const addrBlur = () => {
  S.addrFocus = false;

  setTimeout(() => {
    if (!S.addrFocus) {
      S.addrText = null;
      paintTop();
      acClose();
    }
  }, 120);
};

export function addrKey(e: KeyboardEvent) {
  if (!OV.ac) {
    return;
  }

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const n = AC.rows.length;
    AC.sel = e.key === 'ArrowDown' ? (AC.sel + 1) % n : (AC.sel - 1 + n) % n;
    acDraw();
  } else if (e.key === 'Tab' && AC.rows.length) {
    e.preventDefault();
    const r = AC.rows[Math.max(0, AC.sel)];

    if (r.fill) {
      acPick(r);
    } else {
      setText(r.ref!);
      AC.sel = -1;
      acDraw();
    }
  } else if (e.key === 'Enter' && AC.sel >= 0) {
    e.preventDefault();
    acPick(AC.rows[AC.sel]);
  } else if (e.key === 'Escape') {
    acClose();
  }
}

// Dragging the window: Tauri's drag attribute only works on the exact element it sits on, so treat every non-interactive spot of the toolbar as a handle.
export function winDrag(e: MouseEvent) {
  const t = e.target as HTMLElement;
  const win = window.__TAURI__?.window?.getCurrentWindow?.();

  if (
    e.button !== 0 ||
    t.closest(
      'button, a, input, select, textarea, form, label, [contenteditable], .tb-pop, .prof-pop',
    )
  ) {
    return;
  }

  e.preventDefault();

  if (e.detail === 2) {
    win?.toggleMaximize?.();
  } else {
    win?.startDragging?.();
  }
}

// Branch picker for the New PR page: search, your branches first, the rest grouped by prefix with last-commit age.
export function bpAway(e: MouseEvent) {
  if (OV.bp && !(e.target as HTMLElement).closest('#bppop')) {
    bpClose();
  }
}

export function bpClose() {
  if (OV.bp) {
    OV.bp = null;
    paintOv();
  }
}

export function bpAge(t: string) {
  if (!t) {
    return '';
  }

  const m = Math.max(1, Math.round((Date.now() - +new Date(t)) / 60000));

  return m < 60
    ? `${m}m`
    : m < 1440
      ? `${Math.round(m / 60)}h`
      : m < 43200
        ? `${Math.round(m / 1440)}d`
        : `${Math.round(m / 43200)}mo`;
}

export function bpGroups(br: BranchInfo, q: string, me: string): BpGroup[] {
  const det = new Map((br.details || []).map(d => [d.name, d]));
  const rank = new Map(br.branches.map((b, i) => [b, i]));

  const all = br.branches
    .map(name => ({
      name,
      at: det.get(name)?.at || '',
      by: det.get(name)?.by || '',
    }))
    .sort((a, b) =>
      b.at > a.at
        ? 1
        : b.at < a.at
          ? -1
          : rank.get(a.name)! - rank.get(b.name)!,
    );

  if (q) {
    const t = q.toLowerCase();

    return [['', all.filter(x => x.name.toLowerCase().includes(t))]];
  }

  const out: BpGroup[] = [];
  const used = new Set<string>();

  const take = (f: (x: BpRow) => unknown) =>
    all.filter(x => !used.has(x.name) && f(x) && used.add(x.name));

  const def = take(x => x.name === br.default);

  if (def.length) {
    out.push(['Default', def]);
  }

  const mine = me
    ? take(x => x.by && x.by.toLowerCase() === me.toLowerCase())
    : [];

  if (mine.length) {
    out.push(['Your branches', mine]);
  }

  const rest = take(() => true);
  const pre = new Map<string, BpRow[]>();

  rest.forEach(x => {
    const k = x.name.includes('/') ? `${x.name.split('/')[0]}/` : '';
    (pre.get(k) || pre.set(k, []).get(k)!).push(x);
  });

  const single: BpRow[] = [];

  [...pre.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .forEach(([k, l]) => {
      if (k && l.length > 1) {
        out.push([k, l]);
      } else {
        single.push(...l);
      }
    });

  if (single.length) {
    out.push([
      out.length ? 'Other' : '',
      single.sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0)),
    ]);
  }

  return out;
}

export function rpGroups(
  repos: RepoSummary[],
  q: string,
  me: string,
): BpGroup[] {
  const all = repos
    .filter(r => !r.archived)
    .map(r => ({
      name: r.full_name,
      at: r.pushed_at || '',
      by: r.private ? 'private' : '',
    }))
    .sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));

  if (q) {
    const t = q.toLowerCase();

    return [['', all.filter(x => x.name.toLowerCase().includes(t))]];
  }

  const out: BpGroup[] = [];
  const recent = all.slice(0, 5);
  const used = new Set(recent.map(x => x.name));

  if (recent.length) {
    out.push(['Recently pushed', recent]);
  }

  const by = new Map<string, BpRow[]>();

  all
    .filter(x => !used.has(x.name))
    .forEach(x => {
      const o = x.name.split('/')[0];
      (by.get(o) || by.set(o, []).get(o)!).push(x);
    });

  [...by.entries()]
    .sort(
      (a, b) =>
        +(b[0].toLowerCase() === me.toLowerCase()) -
          +(a[0].toLowerCase() === me.toLowerCase()) ||
        b[1].length - a[1].length,
    )
    .forEach(([o, l]) => out.push([o, l]));

  return out;
}

export function bpOpen(
  btn: HTMLElement,
  side: 'repo' | 'base' | 'head',
  pick: (v: string) => void,
  repoMode = false,
) {
  bpClose();

  const n = S.np;
  const br = repoMode ? null : n!.branches[n!.repo];

  if (!repoMode && !br) {
    return;
  }

  const cur = repoMode ? n!.repo : n![side];
  const me = S.profile?.login || '';
  const r = btn.getBoundingClientRect();
  const w = Math.max(r.width, 340);
  const below = innerHeight - r.bottom;
  const up = below < 300 && r.top > below;
  const style = `left:${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px;width:${w}px;max-height:${Math.min(420, (up ? r.top : below) - 16)}px;${up ? `bottom:${innerHeight - r.top + 4}px` : `top:${r.bottom + 4}px`}`;

  const done = (v?: string) => {
    bpClose();

    if (v && v !== cur) {
      pick(v);
    }
  };

  OV.bp = {
    repoMode,
    style,
    cur,
    age: bpAge,
    done,
    groupsFor: q =>
      repoMode ? rpGroups(S.repos || [], q, me) : bpGroups(br!, q, me),
  };

  paintOv();
}

export const focusAddr = () => focusTarget('addr', 'select');

export const avUrl = (u: string, n: number) =>
  `${u}${u.includes('?') ? '&' : '?'}s=${n}`;

export function loadProfile() {
  if (!tauri) {
    return;
  }

  tauri!
    .invoke('viewer_profile')
    .then(p => {
      S.me = p.login;
      S.profile = p;

      try {
        localStorage.setItem('profile', JSON.stringify(p));
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
  const have = S.tabs.some(t => t.ref === ref);

  if (have && !S.focus) {
    if (ref === curRef()) {
      S.tabMenu = false;

      return;
    }

    return openTab(ref);
  }

  return newTab ? openTab(ref, { newTab: true }) : openPr(ref);
}

let stuckOn: Element | null = null;

export function bindSticky() {
  const ta = $('.pr-title-area');
  const tb = $('.pr-tabs');

  if (ta && ta === stuckOn && S.ios?.length) {
    return;
  }

  stuckOn = ta;

  if (ta && tb && !$('.is-split')) {
    const io = new IntersectionObserver(
      ([en]) => {
        const v = !en.isIntersecting && en.boundingClientRect.bottom < 0;

        if (!!S.stuck !== v) {
          S.stuck = v;
          repaintShell({ stuck: v });
        }
      },
      { root: $('.main'), threshold: 0 },
    );

    io.observe(ta);
    S.ios!.push(io);
  }
}
