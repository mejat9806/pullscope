import type { GhNotif, NotifFilter } from '../types';
import { S, load, selNames, tauri, when } from './core';
import { openExternal } from './addressbar';
import { openPr } from './nav';
import { render } from './pages';
import type { GhNotifProps, GhNotifHandlers } from '../components/Pages';

export const REASONS: [string, string][] = [['review_requested', 'Review requested'], ['mention', 'Mentioned'], ['team_mention', 'Team mentioned'], ['assign', 'Assigned'], ['author', 'You opened'], ['comment', 'Commented'], ['subscribed', 'Watching'], ['ci_activity', 'CI activity'], ['state_change', 'State change'], ['approval_requested', 'Approval requested'], ['security_alert', 'Security alert']];
const label = (list: [string, string][], k: string) => list.find(([v]) => v === k)?.[1] || k.replace(/_/g, ' ');

const DEFAULT: NotifFilter = { all: false, reasons: [], q: '', chosenOnly: true, group: false, markOnOpen: true };
const filter = (): NotifFilter => (S.gnf = S.gnf || { ...DEFAULT, ...load<Partial<NotifFilter>>('gnf', {}), q: '' });
const save = () => { try { localStorage.setItem('gnf', JSON.stringify({ ...filter(), q: '' })); } catch { /* storage full */ } render(); };

export async function loadGh(force = false) {
  const g = S.gh = S.gh || { list: null, err: '', loading: false };
  if (g.loading && !force) return;
  g.loading = true; g.err = ''; render();
  try { g.list = tauri ? await tauri.invoke('gh_notifs', { all: filter().all }) : []; } catch (e) { g.err = String(e).replace(/^Error: /, ''); }
  g.loading = false; render();
}

export const openFeedTab = () => { S.ibTab = 'feed'; if (!S.gh?.list) loadGh(); else render(); };

async function act(n: GhNotif, action: 'read' | 'done' | 'mute') {
  const g = S.gh!; const was = g.list;
  g.list = (g.list || []).flatMap((x) => (x.id !== n.id ? [x] : action === 'read' ? [{ ...x, unread: false }] : [])); render();
  try { await tauri!.invoke('gh_notif_act', { id: n.id, action }); } catch (e) { g.list = was; g.err = String(e).replace(/^Error: /, ''); render(); }
}

const find = (id: string) => S.gh?.list?.find((x) => x.id === id);
const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function ghProps(): GhNotifProps {
  const g = S.gh || { list: null, err: '', loading: true }, f = filter(), q = f.q.toLowerCase(), chosen = new Set(selNames().map((r) => r.toLowerCase()));
  const shown = (g.list || []).filter((n) => (!f.reasons.length || f.reasons.includes(n.reason))
    && (!f.chosenOnly || !chosen.size || chosen.has(n.repo.toLowerCase())) && (!q || `${n.title} ${n.repo}`.toLowerCase().includes(q)));
  const row = (n: GhNotif) => ({ id: n.id, unread: n.unread, icon: 'git-pull-request', title: n.title, sub: `${f.group ? '' : n.repo + ' · '}${label(REASONS, n.reason)} · ${when(n.updated_at).replace(/<\/?span[^>]*>/g, '')}` });
  const by = new Map<string, GhNotif[]>(); shown.forEach((n) => { const k = f.group ? n.repo : ''; (by.get(k) || by.set(k, []).get(k)!).push(n); });
  return { loading: g.loading, err: g.err, groups: g.list ? [...by.entries()].map(([name, l]) => ({ name, rows: l.map(row) })) : null, total: shown.length, unread: shown.filter((n) => n.unread).length,
    f, reasons: REASONS, hasChosen: chosen.size > 0 };
}

export const ghOn: GhNotifHandlers = {
  refresh: () => loadGh(true),
  open: (id) => {
    const n = find(id); if (!n) return;
    if (n.unread && filter().markOnOpen) act(n, 'read');
    if (n.number) openPr(`${n.repo}#${n.number}`); else openExternal(n.url);
  },
  read: (id) => { const n = find(id); if (n) act(n, 'read'); },
  done: (id) => { const n = find(id); if (n) act(n, 'done'); },
  mute: (id) => { const n = find(id); if (n) act(n, 'mute'); },
  readAll: async () => {
    const g = S.gh; if (!g?.list || !tauri) return;
    const was = g.list; g.list = g.list.map((n) => ({ ...n, unread: false })); render();
    try { await tauri.invoke('gh_notif_read_all', {}); } catch (e) { g.list = was; g.err = String(e).replace(/^Error: /, ''); render(); }
  },
  reason: (r) => { filter().reasons = toggle(filter().reasons, r); save(); },
  query: (e) => { filter().q = (e.target as HTMLInputElement).value; render(); },
  all: () => { filter().all = !filter().all; try { localStorage.setItem('gnf', JSON.stringify({ ...filter(), q: '' })); } catch { /* ignore */ } loadGh(true); },
  chosen: () => { filter().chosenOnly = !filter().chosenOnly; save(); },
  group: () => { filter().group = !filter().group; save(); },
  markOnOpen: () => { filter().markOnOpen = !filter().markOnOpen; save(); },
  clear: () => { Object.assign(filter(), { reasons: [], q: '' }); save(); },
  tab: (t) => { if (t === 'feed') openFeedTab(); else { S.ibTab = 'prs'; render(); } },
};
