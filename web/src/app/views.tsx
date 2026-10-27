import { Crumbs, PrListPage } from '../components/PrList';
import type { PrListHandlers } from '../components/PrList';
import { InboxPage, NotesPage } from '../components/Pages';
import type { InboxHandlers, NotesHandlers } from '../components/Pages';
import { openAux, openClick, openCtx } from './bind';
import { rerender } from './actions';
import { S } from './core';
import { pollNotes, pushDis } from './data';
import { crumbs } from './home';
import { openNewPr, inboxProps, loadInbox, notesProps, render, saveNotes } from './pages';
import { openRepo } from './nav';
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
  return <><Crumbs repo={S.repo!} trail={[{ t: 'Pull requests' }]} extra="" on={crumbs} /><PrListPage p={prListProps()} on={prl} /></>;
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
  return <><Crumbs repo="" trail={[{ t: 'Notifications' }]} extra="" on={crumbs} /><NotesPage {...notesProps()} on={notes} /></>;
}

const inbox: InboxHandlers = { ...open, refresh: () => loadInbox(true) };

export function InboxView() {
  return <><Crumbs repo="" trail={[{ t: 'Inbox' }]} extra="" on={crumbs} /><InboxPage p={inboxProps()} on={inbox} /></>;
}
