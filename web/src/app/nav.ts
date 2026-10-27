import { drafts, rerender, saveDrafts } from './actions';
import { stateOf } from './comments';
import { $, KEY_RECENT, S, tauri } from './core';
import { loadPr, qc, refreshPushes, remember } from './data';
import { enterAnim } from './fun';
import { openNewPr, render } from './pages';
import { saveTabs, tabIdx, tabPut, tabSnap } from './tabs';

export async function loadRepos() {
  S.reposErr = ''; S.repos = null;
  try { S.repos = await tauri.invoke('list_repos'); } catch (e) { S.reposErr = String(e); if (/401|Bad credentials|requires authentication/i.test(S.reposErr)) { S.hasToken = false; S.gateErr = 'GitHub rejected the saved token (expired or revoked). Sign in again.'; } }
  render();
}

export async function openRepo(name, { nav = false } = {}) {
  S.view = 'repo'; S.pAuthor = S.pLabel = S.pStatus = ''; S.repo = name; S.prs = null; S.error = ''; S.bundle = nav && S.bundle ? S.bundle : S.bundle;
  if (!nav) { S.hist = S.hist.slice(0, S.hi + 1); S.hist.push('repo:' + name); S.hi = S.hist.length - 1; }
  S.sideTab = 'prs'; render(); refreshPushes(name);
  try { S.prs = tauri ? await tauri.invoke('list_prs', { repo: name, state: S.prState }) : []; } catch (e) { S.error = String(e); S.prs = []; }
  render();
}

// Loads the sidebar's PR list without leaving the pull request being read.
export async function loadPrs() {
  // Show the last list for this repo at once and refresh quietly, so switching tabs never blanks the sidebar.
  const name = S.repo, ck = `${name}|${S.prState}`; S.prCache = S.prCache || {};
  const hit = S.prCache[ck];
  if (hit) { S.prs = hit.list; if (Date.now() - hit.at < 60000) { rerender(); return; } } else S.prs = null;
  rerender();
  try { const r = tauri ? await tauri.invoke('list_prs', { repo: name, state: S.prState }) : []; S.prCache[ck] = { list: r, at: Date.now() }; if (S.repo === name) S.prs = r; } catch (e) { if (S.repo === name && !hit) S.prs = []; }
  if (S.repo === name) rerender();
}

export const reload = () => S.view === 'repo' ? openRepo(S.repo, { nav: true }) : S.bundle && openPr(`${S.bundle.pull.base.repo.full_name}#${S.bundle.pull.number}`, { nav: true, keepTab: true, manual: true });


export async function openPr(input, { nav = false, keepTab = false, manual = false, newTab = false, restore = '' } = {}) {
  { const bm = String(input).match(/^([^#\s@]+\/[^#\s@]+)@(.+)$/); if (bm) return openNewPr(bm[1], bm[2]); }
  const fromTab = S.view === 'pr' ? tabIdx() : -1, tabSwitch = !!(restore || S.fadeMain);
  const seq = S.openSeq = (S.openSeq || 0) + 1, stale_ = () => S.openSeq !== seq; // a newer open (tab switch) supersedes this one
  if (!keepTab && !restore) tabSnap();
  // Show the tab at once; the title and state fill in when the PR arrives.
  S.tabPending = '';
  if (!keepTab) { const m = String(input).match(/^([^#\s@\/]+\/[^#\s@]+)#(\d+)$/) || String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/); if (m) { const ref = `${m[1]}#${m[2]}`; S.tabPending = ref; if (!S.tabs.some((t) => t.ref === ref)) { const old = S.recent.find((r) => r.ref === ref), item = { ref, title: old?.title || 'Loading…', state: old?.state || 'open', icon: old?.icon || 'git-pull-request', tab: restore || 'conversation', dot: false }; if (fromTab >= 0 && !newTab) S.tabs[fromTab] = item; else S.tabs.splice(fromTab >= 0 ? fromTab + 1 : S.tabs.length, 0, item); S.tabs = S.tabs.slice(-15); } } }
  S.error = ''; S.view = 'pr'; if (!keepTab) S.tab = restore || 'conversation'; S.sel = null; if (!keepTab) S.fr = null;
  if (keepTab && S.focus && S.tab === 'files') S.focus = ''; // reacting or replying on the Files tab must not jump to the Conversation tab
  // Stale-while-revalidate: show whatever copy exists at once (memory, then disk) and only fetch when it is stale.
  if (keepTab && tauri) await tauri.invoke('invalidate_pr', { url: input }).catch(() => {});
  const mem = qc.peek(input);
  const disk = mem || (tauri && !keepTab ? await tauri.invoke('cached_pr', { url: input }).then((b) => b && { data: b }).catch(() => null) : null);
  const fresh = !!mem && qc.fresh(input) && !keepTab, stale = !!disk && !fresh;
  const had = fresh || stale || (keepTab && S.bundle);
  if (fresh) { S.bundle = mem.data; S.loading = false; }
  else if (disk) { S.bundle = disk.data; S.refreshing = false; S.loading = false; }
  else if (keepTab && S.bundle) { S.refreshing = manual; S.loading = false; }
  else S.loading = true;
  const hot = fresh;
  S.keepScroll = keepTab; render(); S.keepScroll = false;
  if (!keepTab && !restore && $('.main')) $('.main').scrollTop = 0; // a different PR never inherits the previous page's scroll
  // Jump to the comment from the copy already on screen; the refresh below only tops it up.
  const focusNow = () => {
    if (!S.bundle || !S.focus) return false;
    if (S.tab !== 'conversation' && S.tab !== 'timeline') { S.tab = 'conversation'; render(); }
    const el = document.getElementById('c-' + S.focus);
    if (!el) return false;
    S.flashId = S.focus; S.flashUntil = Date.now() + 2500; S.focus = ''; el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); return true;
  };
  const focused = focusNow();
  try {
    const got = hot ? mem.data : await qc.fetch(input, () => loadPr(input));
    if (stale_()) return; // the user already moved on; the result stays in the cache for next time
    S.bundle = got;
    const p = S.bundle.pull, ref = `${p.base.repo.full_name}#${p.number}`, [st, ic] = stateOf(p);
    if (!nav) { S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(ref); S.hi = S.hist.length - 1; }
    S.recent = [{ ref, title: p.title, state: st, icon: ic }, ...S.recent.filter((r) => r.ref !== ref)].slice(0, 30);
    localStorage.setItem(KEY_RECENT, JSON.stringify(S.recent));
    localStorage.setItem('last', ref); remember(ref, p);
    if (!keepTab || tabIdx() >= 0) tabPut(ref, p, { at: fromTab, newTab }); const ti = S.tabs.find((t) => t.ref === ref); if (ti) { ti.dot = false; saveTabs(); }
    if (S.repo !== p.base.repo.full_name) { S.repo = p.base.repo.full_name; S.sideTab = 'prs'; setTimeout(loadPrs, 0); }
    if (S.draftRef !== ref) { saveDrafts(); S.draftRef = ref; S.draft = { ...(drafts[ref] || {}) }; }
  } catch (e) { if (stale_()) return; if (!had) S.bundle = null; S.error = String(e).replace(/^Error: /, ''); }
  S.tabPending = ''; S.loading = false; S.refreshing = false; const savedScroll = restore ? (S.tabs[tabIdx()]?.scroll || 0) : 0; S.restoring = !!savedScroll; S.keepScroll = focused || keepTab; render(); S.keepScroll = false;
  if (savedScroll) { const put = () => { const m = $('.main'); if (m) m.scrollTop = savedScroll; }; put(); requestAnimationFrame(put); setTimeout(() => { put(); S.restoring = false; }, 250); } if (!keepTab && !stale && !focused && !S.flashId && !tabSwitch) enterAnim();
  if (S.bundle && !stale && !keepTab && !focused) $('.main').scrollTop = 0;
  if (S.bundle && S.focus) {
    const id = S.focus; S.focus = '';
    if (S.tab !== 'conversation' && S.tab !== 'timeline') { S.tab = 'conversation'; render(); }
    const el = document.getElementById('c-' + id);
    if (el) { S.flashId = id; S.flashUntil = Date.now() + 2500; el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); }
  }
}
