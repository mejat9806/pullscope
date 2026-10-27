import type { ConvHandlers } from '../components/Comments';
import type { DiffHandlers } from './diff';
import type { FilesHandlers } from '../components/Merge';
import type { AttentionHandlers } from '../components/Timeline';
import { applySuggestion, cbarKey, cmMenu, disableAuto, doMerge, enableAuto, getMine, lcAdd, lcCancel, lcDel, lcOpen, lcSuggest, markReady, reactAdd, reactToggle, rerender, rerunChecks, reviewDialog, sendComment, sendReply, setDiffMode, threadAct, toDraft, toggleClosed, toggleComposer, toggleMb, updateBranch } from './actions';
import { foldAllConv } from './bind';
import { S } from './core';
import { foldToggle } from './fold';
import { commitList, openCommits, setFr } from './mergebox';
import { render } from './pages';
import { jumpUnresolved } from './timeline';
import type { TlHandlers } from './timeline';

// One set of comment handlers for every live view that shows comments (conversation, timeline, diff lines, split view).
export const convOn: ConvHandlers = {
  fold: (e, k, def) => foldToggle(e, k, def),
  menu: (e, b) => cmMenu(e, b),
  react: { toggle: (e, kind, id, c) => reactToggle(e, kind, id, c), add: (e, b) => reactAdd(e, b), hover: (kind, id) => { getMine(kind, id); } },
  thread: (e, node, how) => { threadAct(e, node, how); },
  sug: (e, id) => applySuggestion(e, id),
  reply: (id) => { sendReply(id); },
};

export const diffOn: DiffHandlers = { conv: convOn, plus: (e) => lcOpen(e), lc: { del: (id) => lcDel(id), cancel: () => lcCancel(), suggest: (e) => lcSuggest(e), add: () => lcAdd() } };

export const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };

export function openTab(k: string) { S.tab = k; render(); document.querySelector('.main')!.scrollTop = 0; }

export const filesOn: FilesHandlers = {
  commits: () => openCommits(), all: () => setFr(null),
  step: (n) => { const cs = commitList(S.bundle!), i = (S.fr?.a ?? 0) + n; if (cs[i]) setFr({ a: i, b: i }); },
  mode: (m) => setDiffMode(m),
  sort: (e) => { S.fileSort = (e.target as HTMLSelectElement).value; rerender(); },
  finish: () => reviewDialog(),
  foldAll: (allFolded, names) => { names.forEach((n) => { S.fold['f:' + n] = !allFolded; }); localStorage.setItem('fold', JSON.stringify(S.fold)); rerender(); },
  fold: (e, k, def) => foldToggle(e, k, def),
};

export const attOn: AttentionHandlers = { next: () => jumpUnresolved(), unres: () => keep(() => { S.unres = !S.unres; }), tab: openTab };

export const tlOn: TlHandlers = {
  conv: convOn,
  bars: {
    who: (w) => keep(() => { S.who = S.who.includes(w) ? S.who.filter((x) => x !== w) : [...S.who, w]; }),
    whoClear: () => keep(() => { S.who = []; }),
    range: (e) => keep(() => { S.range = (e.target as HTMLInputElement).value; if (S.range === 'custom' && !S.rFrom && !S.rTo) { const d = (t: number) => new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10); S.rTo = d(Date.now()); S.rFrom = d(Date.now() - 7 * 864e5); } }),
    from: (e) => keep(() => { S.rFrom = (e.target as HTMLInputElement).value; }),
    to: (e) => keep(() => { S.rTo = (e.target as HTMLInputElement).value; }),
    sort: () => keep(() => { S.sort = S.sort === 'desc' ? 'asc' : 'desc'; localStorage.setItem('csort', S.sort); }),
  },
  foldAll: foldAllConv,
  tab: openTab,
  merge: { toggle: (e, k) => toggleMb(e, k), rerun: (e) => { rerunChecks(e); }, update: () => { updateBranch(); }, ready: () => { markReady(); } },
  act: { close: () => toggleClosed(), merge: () => doMerge(), noauto: () => { disableAuto(); }, auto: () => { enableAuto(); }, draft: () => toDraft() },
  composer: { toggle: () => toggleComposer(), key: (e) => cbarKey(e), send: () => { sendComment(); }, close: () => toggleClosed() },
};
