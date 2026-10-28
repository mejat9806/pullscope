import { drafts, rerender, saveDrafts } from './actions';
import { hasComment, stateOf } from './comments';
import { appState, flashLive, KEY_RECENT, setFlash, tauri } from './core';
import { loadPr, qc, refreshPushes, remember } from './data';
import { enterAnim } from './fun';
import { openNewPr, render, scrollMain } from './pages';
import { saveTabs, tabIdx, tabPut, tabSnap } from './tabs';

export async function loadRepos() {
  appState.reposErr = '';
  appState.repos = null;

  if (appState.repoSel) {
    appState.repos = appState.repoSel;
    render();

    return;
  }

  try {
    appState.repos = await tauri!.invoke('list_repos');
  } catch (error) {
    appState.reposErr = String(error);

    if (
      /401|Bad credentials|requires authentication/i.test(appState.reposErr)
    ) {
      appState.hasToken = false;

      appState.gateErr =
        'GitHub rejected the saved token (expired or revoked). Sign in again.';
    }
  }

  render();
}

export async function openRepo(name: string, { nav = false } = {}) {
  appState.view = 'repo';
  appState.pAuthor = appState.pLabel = appState.pStatus = '';
  appState.repo = name;
  appState.prs = null;
  appState.error = '';
  appState.bundle = nav && appState.bundle ? appState.bundle : appState.bundle;

  if (!nav) {
    appState.hist = appState.hist.slice(0, appState.hi + 1);
    appState.hist.push(`repo:${name}`);
    appState.hi = appState.hist.length - 1;
  }

  appState.sideTab = 'prs';
  render();
  refreshPushes(name);

  try {
    appState.prs = tauri
      ? await tauri!.invoke('list_prs', { repo: name, state: appState.prState })
      : [];
  } catch (error) {
    appState.error = String(error);
    appState.prs = [];
  }

  render();
}

// Loads the sidebar's PR list without leaving the pull request being read.
export async function loadPrs() {
  // Show the last list for this repo at once and refresh quietly, so switching tabs never blanks the sidebar.
  const name = appState.repo;
  const ck = `${name}|${appState.prState}`;
  appState.prCache = appState.prCache || {};
  const hit = appState.prCache[ck];

  if (hit) {
    appState.prs = hit.list;

    if (Date.now() - hit.at < 60000) {
      rerender();

      return;
    }
  } else {
    appState.prs = null;
  }

  rerender();

  try {
    const prListItems = tauri
      ? await tauri!.invoke('list_prs', { repo: name, state: appState.prState })
      : [];

    appState.prCache[ck] = { list: prListItems, at: Date.now() };

    if (appState.repo === name) {
      appState.prs = prListItems;
    }
  } catch {
    if (appState.repo === name && !hit) {
      appState.prs = [];
    }
  }

  if (appState.repo === name) {
    rerender();
  }
}

export const reload = () =>
  appState.view === 'repo'
    ? openRepo(appState.repo!, { nav: true })
    : appState.bundle &&
      openPr(
        `${appState.bundle.pull.base.repo.full_name}#${appState.bundle.pull.number}`,
        {
          nav: true,
          keepTab: true,
          manual: true,
        },
      );

// Notification targets are bare comment ids; the page's elements are `c-<id>`.
const elId = (text: string) => `c-${text.replace(/^c-/, '')}`;

export async function openPr(
  input: string,
  {
    nav = false,
    keepTab = false,
    manual = false,
    newTab = false,
    restore = '',
  } = {},
) {
  {
    const bm = String(input).match(/^([^#\s@]+\/[^#\s@]+)@(.+)$/);

    if (bm) {
      return openNewPr(bm[1], bm[2]);
    }
  }

  const fromTab = appState.view === 'pr' ? tabIdx() : -1;
  const tabSwitch = !!(restore || appState.fadeMain);
  const seq = (appState.openSeq = (appState.openSeq || 0) + 1);
  const stale_ = () => appState.openSeq !== seq; // a newer open (tab switch) supersedes this one

  if (!keepTab && !restore) {
    tabSnap();
  }

  // Show the tab at once; the title and state fill in when the PR arrives.
  appState.tabPending = '';

  if (!keepTab) {
    const match =
      String(input).match(/^([^#\s@/]+\/[^#\s@]+)#(\d+)$/) ||
      String(input).match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/);

    if (match) {
      const ref = `${match[1]}#${match[2]}`;
      appState.tabPending = ref;

      if (!appState.tabs.some(tab => tab.ref === ref)) {
        const old = appState.recent.find(
          recentEntry => recentEntry.ref === ref,
        );

        const item = {
          ref,
          title: old?.title || 'Loading…',
          state: old?.state || 'open',
          icon: old?.icon || 'git-pull-request',
          tab: restore || 'conversation',
          dot: false,
        };

        if (fromTab >= 0 && !newTab) {
          appState.tabs[fromTab] = item;
        } else {
          appState.tabs.splice(
            fromTab >= 0 ? fromTab + 1 : appState.tabs.length,
            0,
            item,
          );
        }

        appState.tabs = appState.tabs.slice(-15);
      }
    }
  }

  appState.error = '';
  appState.view = 'pr';

  if (!keepTab) {
    appState.tab = restore || 'conversation';
  }

  appState.sel = null;

  if (!keepTab) {
    appState.fr = null;
  }

  if (keepTab && appState.focus && appState.tab === 'files') {
    appState.focus = '';
  } // reacting or replying on the Files tab must not jump to the Conversation tab

  // Stale-while-revalidate: show whatever copy exists at once (memory, then disk) and only fetch when it is stale.
  if (keepTab && tauri) {
    await tauri!.invoke('invalidate_pr', { url: input }).catch(() => {});
  }

  const mem = qc.peek(input);

  const disk =
    mem ||
    (tauri && !keepTab
      ? await tauri!
          .invoke('cached_pr', { url: input })
          .then(bundle => bundle && { data: bundle })
          .catch(() => null)
      : null);

  const fresh = !!mem && qc.fresh(input) && !keepTab;
  const stale = !!disk && !fresh;
  const had = fresh || stale || (keepTab && appState.bundle);

  if (fresh) {
    appState.bundle = mem.data;
    appState.loading = false;
  } else if (disk) {
    appState.bundle = disk.data;
    appState.refreshing = false;
    appState.loading = false;
  } else if (keepTab && appState.bundle) {
    appState.refreshing = manual;
    appState.loading = false;
  } else {
    appState.loading = true;
  }

  const hot = fresh;
  appState.keepScroll = keepTab;
  render();
  appState.keepScroll = false;

  if (!keepTab && !restore) {
    scrollMain(0);
  } // a different PR never inherits the previous page's scroll

  // Jump to the comment from the copy already on screen; the refresh below only tops it up.
  const focusNow = () => {
    if (!appState.bundle || !appState.focus) {
      return false;
    }

    if (appState.tab !== 'conversation' && appState.tab !== 'timeline') {
      appState.tab = 'conversation';
      render();
    }

    if (!hasComment(appState.focus)) {
      return false;
    }

    setFlash(elId(appState.focus), { block: 'start' });
    appState.focus = '';
    appState.keepScroll = true;
    render();
    appState.keepScroll = false;

    return true;
  };

  const focused = focusNow();

  try {
    const got = hot ? mem.data : await qc.fetch(input, () => loadPr(input));

    if (stale_()) {
      return;
    } // the user already moved on; the result stays in the cache for next time

    appState.bundle = got!;

    const pull = got!.pull;
    const ref = `${pull.base.repo.full_name}#${pull.number}`;
    const [st, ic] = stateOf(pull);

    if (!nav) {
      appState.hist = appState.hist.slice(0, appState.hi + 1);
      appState.hist.push(ref);
      appState.hi = appState.hist.length - 1;
    }

    appState.recent = [
      { ref, title: pull.title, state: st, icon: ic },
      ...appState.recent.filter(recentEntry => recentEntry.ref !== ref),
    ].slice(0, 30);

    localStorage.setItem(KEY_RECENT, JSON.stringify(appState.recent));
    localStorage.setItem('last', ref);
    remember(ref, pull);

    if (!keepTab || tabIdx() >= 0) {
      tabPut(ref, pull, { at: fromTab, newTab });
    }

    const ti = appState.tabs.find(tab => tab.ref === ref);

    if (ti) {
      ti.dot = false;
      saveTabs();
    }

    if (appState.repo !== pull.base.repo.full_name) {
      appState.repo = pull.base.repo.full_name;
      appState.sideTab = 'prs';
      setTimeout(loadPrs, 0);
    }

    if (appState.draftRef !== ref) {
      saveDrafts();
      appState.draftRef = ref;
      appState.draft = { ...(drafts[ref] || {}) };
    }
  } catch (error) {
    if (stale_()) {
      return;
    }

    if (!had) {
      appState.bundle = null;
    }

    appState.error = String(error).replace(/^Error: /, '');
  }

  appState.tabPending = '';
  appState.loading = false;
  appState.refreshing = false;
  const savedScroll = restore ? appState.tabs[tabIdx()]?.scroll || 0 : 0;
  appState.restoring = !!savedScroll;
  appState.keepScroll = focused || keepTab;
  render();
  appState.keepScroll = false;

  if (savedScroll) {
    const put = () => scrollMain(savedScroll);
    put();
    requestAnimationFrame(put);

    setTimeout(() => {
      put();
      appState.restoring = false;
    }, 250);
  }

  if (!keepTab && !stale && !focused && !flashLive() && !tabSwitch) {
    enterAnim();
  }

  if (appState.bundle && !stale && !keepTab && !focused) {
    scrollMain(0);
  }

  if (appState.bundle && appState.focus) {
    const id = appState.focus;
    appState.focus = '';

    if (appState.tab !== 'conversation' && appState.tab !== 'timeline') {
      appState.tab = 'conversation';
      render();
    }

    if (hasComment(id)) {
      setFlash(elId(id), { block: 'start' });
      appState.keepScroll = true;
      render();
      appState.keepScroll = false;
    }
  }
}
