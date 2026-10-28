import { Crumbs, PrListPage } from '../components/PrList';
import type { PrListHandlers } from '../components/PrList';
import { InboxPage, NewPr, NotesPage } from '../components/Pages';
import type { InboxHandlers, NewPrHandlers, NotesHandlers } from '../components/Pages';
import { openAux, openClick, openCtx } from './bind';
import { rerender, saveDrafts, setBusy, syncDraft } from './actions';
import { bpOpen } from './addressbar';
import { beginDrag, setDragging } from './frame';
import { S, tauri } from './core';
import { confetti } from './fun';
import { pollNotes, pushDis } from './data';
import { crumbs } from './home';
import { bumpNp, newPrProps, npCompare, npLoadBranches, openNewPr, IB_TITLES, ibOrder, ibSecKey, inboxProps, loadInbox, notesProps, render, saveNotes } from './pages';
import { openPr, openRepo } from './nav';
import type { NpListKey } from '../types';
import { prListProps } from './prlist';

const open = { open: openClick, aux: openAux, ctx: openCtx };
const typedPf = (e: Event) => { S.pf = (e.target as HTMLInputElement).value; render(); };

const prl: PrListHandlers = {
  ...open,
  ps: (s) => { S.prState = s; openRepo(S.repo!, { nav: true }); },
  compare: (repo, br) => openNewPr(repo, br),
  dismiss: (key) => { pushDis[key] = 1; localStorage.setItem('pushdismiss', JSON.stringify(pushDis)); rerender(); },
  filter: typedPf,
  author: (e) => { S.pAuthor = (e.target as HTMLSelectElement).value; render(); },
  label: (e) => { S.pLabel = (e.target as HTMLSelectElement).value; render(); },
  status: (e) => { S.pStatus = (e.target as HTMLSelectElement).value; render(); },
  sort: (e) => { S.psort = (e.target as HTMLSelectElement).value; localStorage.setItem('psort', S.psort); render(); },
  clear: () => { S.pf = S.pAuthor = S.pLabel = S.pStatus = ''; render(); },
};

export function RepoView() {
  return <><Crumbs repo={S.repo!} trail={[{ t: 'Pull requests' }]} on={crumbs} /><PrListPage p={prListProps()} on={prl} /></>;
}

const keep = (fn: () => void) => { S.keepScroll = true; fn(); render(); S.keepScroll = false; };

const notes: NotesHandlers = {
  ...open,
  check: () => pollNotes(),
  readAll: () => keep(() => { S.notes.forEach((n) => (n.read = true)); saveNotes(); }),
  clear: () => keep(() => { S.notes = []; saveNotes(); }),
  filter: (f) => keep(() => { S.nf = f; }),
  read: (e, id) => { e.stopPropagation(); const n = S.notes.find((x) => String(x.id) === String(id)); if (n) keep(() => { n.read = !n.read; saveNotes(); }); },
  del: (e, id) => { e.stopPropagation(); keep(() => { S.notes = S.notes.filter((x) => String(x.id) !== String(id)); saveNotes(); }); },
};

export function NotesView() {
  return <><Crumbs repo="" trail={[{ t: 'Notifications' }]} on={crumbs} /><NotesPage {...notesProps()} on={notes} /></>;
}

const foldSave = () => { try { localStorage.setItem('fold', JSON.stringify(S.fold)); } catch { /* storage full */ } render(); };
const ibSave = (o: string[]) => { S.ibOrder = o.length ? o : undefined; try { if (o.length) localStorage.setItem('iborder', JSON.stringify(o)); else localStorage.removeItem('iborder'); } catch { /* storage full */ } render(); };
// Sections slide to their new places (FLIP) and the moved one flashes, so it is clear what changed.
const secTops = () => new Map([...document.querySelectorAll<HTMLElement>('.ib-sec[data-t]')].map((e) => [e.dataset.t!, e.getBoundingClientRect().top]));
function ibMove(title: string, o: string[]) {
  const before = secTops(); ibSave(o);
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll<HTMLElement>('.ib-sec[data-t]').forEach((e) => {
    const dy = (before.get(e.dataset.t!) ?? 0) - e.getBoundingClientRect().top;
    if (Math.abs(dy) > 1) e.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    if (e.dataset.t === title) { e.classList.add('ib-moved'); setTimeout(() => e.classList.remove('ib-moved'), 1400); }
  })));
}
// Grab a section by its grip: the others show where it would land, and letting go moves it.
function ibGrip(e: MouseEvent, title: string) {
  e.preventDefault(); e.stopPropagation(); const y0 = e.clientY; let started = false;
  const over = (y: number) => {
    const secs = [...document.querySelectorAll<HTMLElement>('.ib-sec[data-t]')].filter((x) => x.dataset.t !== title);
    const hit = secs.find((x) => { const r = x.getBoundingClientRect(); return y >= r.top && y <= r.bottom; }) || secs.reduce<HTMLElement | null>((b, x) => (!b || Math.abs(x.getBoundingClientRect().top - y) < Math.abs(b.getBoundingClientRect().top - y) ? x : b), null);
    if (!hit) return null; const r = hit.getBoundingClientRect(); return { title: hit.dataset.t!, after: y > r.top + Math.min(r.height / 2, 60) };
  };
  beginDrag({
    move: (ev) => {
      if (!started) { if (Math.abs(ev.clientY - y0) < 5) return; started = true; S.ibDrag = title; setDragging(true); }
      const o = over(ev.clientY); if (o?.title !== S.ibOver?.title || o?.after !== S.ibOver?.after) { S.ibOver = o; render(); }
    },
    end: () => {
      const to = S.ibOver; setDragging(false); const was = started; S.ibDrag = ''; S.ibOver = null;
      if (!was || !to) { if (was) render(); return; }
      const o = ibOrder().filter((x) => x !== title); o.splice(o.indexOf(to.title) + (to.after ? 1 : 0), 0, title); ibMove(title, o);
    },
  });
}
const inbox: InboxHandlers = {
  ...open, refresh: () => loadInbox(true),
  sort: (e) => { S.ibSort = (e.target as HTMLSelectElement).value; try { localStorage.setItem('ibsort', S.ibSort); } catch { /* ignore */ } render(); },
  query: (e) => { S.ibQ = (e.target as HTMLInputElement).value; render(); },
  fold: (k) => { S.fold[k] = !S.fold[k]; foldSave(); },
  move: (t, by) => { const o = ibOrder(), i = o.indexOf(t), j = i + by; if (i < 0 || j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; ibMove(t, o); },
  grip: ibGrip,
  resetOrder: () => ibSave([]),
  foldAll: (closed) => { IB_TITLES.forEach((t) => { S.fold[ibSecKey(t)] = closed; }); foldSave(); },
};

export function InboxView() {
  return <><Crumbs repo="" trail={[{ t: 'Inbox' }]} on={crumbs} /><InboxPage p={inboxProps()} on={inbox} /></>;
}

const np = () => S.np!;
const npSet = (f: () => void) => { f(); np().key = `${np().repo}|${np().base}|${np().head}`; };
const val = (e: Event) => (e.target as HTMLInputElement).value;

const newpr: NewPrHandlers = {
  cancel: () => { S.view = S.bundle ? 'pr' : 'home'; delete S.draft.newpr; render(); },
  repo: (e) => bpOpen(e.currentTarget as HTMLElement, 'repo', (v) => { npSet(() => { np().repo = v; np().base = ''; np().head = ''; np().cmp = null; np().titleTouched = false; np().title = ''; }); render(); npLoadBranches(np().repo); }, true),
  repoIn: (e) => { npSet(() => { np().repo = val(e).trim(); np().base = ''; np().head = ''; }); npLoadBranches(np().repo); },
  base: (e) => bpOpen(e.currentTarget as HTMLElement, 'base', (v) => { npSet(() => { np().base = v; }); npCompare(); }),
  head: (e) => bpOpen(e.currentTarget as HTMLElement, 'head', (v) => { npSet(() => { np().head = v; np().titleTouched = false; }); npCompare(); }),
  swap: () => { npSet(() => { [np().base, np().head] = [np().head, np().base]; }); npCompare(); },
  tpl: (e) => {
    const n = np(), sel = e.target as HTMLSelectElement, t = n.tpl[`${n.repo}|${n.base}`] || [], cur = (S.draft.newpr || '').trim(), next = sel.value === '-1' ? '' : t[+sel.value].body;
    if (cur && cur !== n.tplText.trim() && !confirm('Replace what you have written with this template?')) { rerender(); return; }
    S.draft.newpr = n.tplText = next; saveDrafts(); bumpNp(); rerender(); syncDraft('newpr');
  },
  title: (e) => { np().title = val(e); np().titleTouched = true; render(); },
  draft: (e) => { np().draft = (e.target as HTMLInputElement).checked; render(); },
  add: (k: NpListKey, e) => { if (val(e)) { np()[k].push(val(e)); render(); } },
  del: (k: NpListKey, v) => { np()[k] = np()[k].filter((x: string) => x !== v); render(); },
  mile: (e) => { np().milestone = val(e); },
  issues: (e) => { np().issues = val(e); },
  create: async () => {
    const n = np(), sel = '#npcreate'; setBusy(sel, true); n.err = '';
    try {
      const nums = [...new Set((n.issues.match(/\d+/g) || []))];
      const body = ((S.draft.newpr || '').trim() + (nums.length ? `\n\n${nums.map((x) => `Closes #${x}`).join('\n')}` : '')).trim();
      const extra = { reviewers: n.reviewers, assignees: n.assignees, labels: n.labels, milestone: n.milestone ? Number(n.milestone) : null };
      const r = await tauri!.invoke('create_pr', { repo: n.repo, base: n.base, head: n.head, title: n.title, body, draft: n.draft, extra });
      const warn = r.warnings?.length ? `Created, but ${r.warnings.join(' · ')}` : '';
      delete S.draft.newpr; saveDrafts(); S.np = null; confetti(); await openPr(`${n.repo}#${r.number}`, { nav: true }); if (warn) { S.actErr = { k: 'comment', m: warn }; rerender(); }
    } catch (err) { n.err = String(err).replace(/^Error: /, ''); } finally { setBusy(sel, false); }
  },
};

export function NewPrView() {
  return <><Crumbs repo={np().repo} trail={[{ t: 'New pull request' }]} on={crumbs} /><NewPr p={newPrProps()} on={newpr} /></>;
}
