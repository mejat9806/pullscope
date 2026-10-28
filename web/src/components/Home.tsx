import { renderIcon, SP } from './ui';

import type { ComponentChildren } from 'preact';

const cap = (text: string) => text[0].toUpperCase() + text.slice(1);

export interface RecentCard {
  ref: string;
  state: string;
  icon: string;
  title: string;
}

export interface RepoCard {
  full: string;
  name: string;
  owner: string;
  priv: boolean;
  archived: boolean;
  issues: number;
  desc: string;
}

export interface PushBanner {
  repo: string;
  branch: string;
  ago: string;
  key: string;
  showRepo: boolean;
}

export interface HomeHandlers {
  tab: (text: string) => void;
  vis: (value: string) => void;
  sort: (event: Event) => void;
  group: (event: Event) => void;
  repoFilter: (event: Event) => void;
  recentFilter: (event: Event) => void;
  rstate: (text: string) => void;
  repo: (full: string) => void;
  open: (el: HTMLElement, event: MouseEvent) => void;
  aux: (el: HTMLElement, event: MouseEvent) => void;
  ctx: (el: HTMLElement, event: MouseEvent) => void;
  rm: (event: MouseEvent, ref: string) => void;
  addToken: () => void;
  compare: (repo: string, branch: string) => void;
  dismiss: (key: string) => void;
}

export interface HomeProps {
  owner: string;
  tab: string;
  repoCount: number | null;
  recentCount: number;
  banners: PushBanner[];
  err: string;
  body:
    | {
        kind: 'recent';
        filter: string;
        state: string;
        hasAny: boolean;
        cards: RecentCard[];
        emptyText: string;
      }
    | { kind: 'addtoken' }
    | { kind: 'error'; text: string }
    | { kind: 'spinner' }
    | {
        kind: 'repos';
        filter: string;
        vis: string;
        sort: string;
        group: string;
        groups: { owner: string; cards: RepoCard[] }[] | null;
        cards: RepoCard[];
        none: boolean;
      };
}

export function Banners({
  items,
  on,
}: {
  items: PushBanner[];
  on: Pick<HomeHandlers, 'compare' | 'dismiss'>;
}) {
  return (
    <>
      {items.map(pushBanner => (
        <div class="push-banner">
          {renderIcon('git-branch')}
          <span>
            <b>{pushBanner.branch}</b> had recent pushes {pushBanner.ago}
            {pushBanner.showRepo ? (
              <>
                {' '}
                <i>· {pushBanner.repo}</i>
              </>
            ) : (
              ''
            )}
          </span>
          <span class="sp"></span>
          <button
            class="btn small primary"
            data-compare={`${pushBanner.repo}@${pushBanner.branch}`}
            onClick={() => on.compare(pushBanner.repo, pushBanner.branch)}
          >
            Compare &amp; pull request
          </button>
          <button
            class="push-x"
            data-pdismiss={pushBanner.key}
            onClick={() => on.dismiss(pushBanner.key)}
            title="Dismiss"
          >
            {renderIcon('x')}
          </button>
        </div>
      ))}
    </>
  );
}

function Card({ r: repoCard, on }: { r: RepoCard; on: HomeHandlers }) {
  return (
    <a
      class="hm-card"
      data-repo={repoCard.full}
      onClick={() => on.repo(repoCard.full)}
    >
      <span class="rc-i" style="color:var(--fgColor-muted)">
        {renderIcon(repoCard.priv ? 'lock' : 'repo')}
      </span>
      <span class="hm-t">
        <b>{repoCard.name}</b>
        <i>
          {repoCard.owner}
          {repoCard.archived ? ' · archived' : ''}
          {repoCard.issues ? ` · ${repoCard.issues} open` : ''}
        </i>
        {repoCard.desc ? <em>{repoCard.desc}</em> : ''}
      </span>
    </a>
  );
}

function Opt({
  v: otherValue,
  cur,
  t: text,
}: {
  v: string;
  cur: string;
  t: string;
}) {
  return (
    <option value={otherValue} selected={cur === otherValue}>
      {text}
    </option>
  );
}

function Body({
  b: otherValue,
  on,
}: {
  b: HomeProps['body'];
  on: HomeHandlers;
}): ComponentChildren {
  if (otherValue.kind === 'addtoken') {
    return (
      <div class="diff-empty">
        Add an access token to list all your repositories and their pull
        requests.
        <br />
        <br />
        <button class="btn primary" id="addtoken" onClick={on.addToken}>
          Add token
        </button>
      </div>
    );
  }

  if (otherValue.kind === 'error') {
    return <div class="diff-empty err">{otherValue.text}</div>;
  }

  if (otherValue.kind === 'spinner') {
    return (
      <div class="spinner" style="margin:48px auto">
        Loading repositories…
      </div>
    );
  }

  if (otherValue.kind === 'recent') {
    return (
      <>
        {otherValue.hasAny ? (
          <div class="hm-fbar">
            <input
              class="input hm-filter"
              id="hmrfilter"
              placeholder="Filter by title or repo…"
              value={otherValue.filter}
              onInput={on.recentFilter}
            />
            <div class="seg-ctl">
              {['all', 'open', 'merged', 'closed'].map(text => (
                <button
                  class={otherValue.state === text ? 'on' : ''}
                  data-rstate={text}
                  onClick={() => on.rstate(text)}
                >
                  {cap(text)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          ''
        )}
        {otherValue.cards.length ? (
          <div class="hm-grid">
            {otherValue.cards.map(recentCard => (
              <a
                class="hm-card"
                data-open={recentCard.ref}
                onClick={event => on.open(event.currentTarget, event)}
                onAuxClick={event => on.aux(event.currentTarget, event)}
                onContextMenu={event => on.ctx(event.currentTarget, event)}
              >
                <span class={`rc-i ${recentCard.state}`}>
                  {renderIcon(recentCard.icon)}
                </span>
                <span class="hm-t">
                  <b>{recentCard.title}</b>
                  <i>{recentCard.ref}</i>
                </span>
                <button
                  class="rc-x"
                  data-rm={recentCard.ref}
                  onClick={event => on.rm(event, recentCard.ref)}
                  title="Remove"
                >
                  {renderIcon('x')}
                </button>
              </a>
            ))}
          </div>
        ) : (
          <div class="diff-empty">{otherValue.emptyText}</div>
        )}
      </>
    );
  }

  const grid = otherValue.none ? (
    <div class="diff-empty">No matching repositories.</div>
  ) : otherValue.groups ? (
    <>
      {otherValue.groups.map(group => (
        <>
          <h3 class="hm-grp">
            {group.owner}
            <span>{group.cards.length}</span>
          </h3>
          <div class="hm-grid">
            {group.cards.map(repoCard => (
              <Card r={repoCard} on={on} />
            ))}
          </div>
        </>
      ))}
    </>
  ) : (
    <div class="hm-grid">
      {otherValue.cards.map(repoCard => (
        <Card r={repoCard} on={on} />
      ))}
    </div>
  );

  return (
    <>
      <div class="hm-fbar">
        <input
          class="input hm-filter"
          id="hmfilter"
          placeholder="Find a repository…"
          value={otherValue.filter}
          onInput={on.repoFilter}
        />
        <div class="seg-ctl">
          {['all', 'public', 'private'].map(text => (
            <button
              class={otherValue.vis === text ? 'on' : ''}
              data-hvis={text}
              onClick={() => on.vis(text)}
            >
              {cap(text)}
            </button>
          ))}
        </div>
        <select class="input" id="hmsort" title="Sort" onChange={on.sort}>
          <Opt v="pushed" cur={otherValue.sort} t="Recently pushed" />
          <Opt v="oldest" cur={otherValue.sort} t="Least recently pushed" />
          <Opt v="name" cur={otherValue.sort} t="Name A–Z" />
          <Opt v="namez" cur={otherValue.sort} t="Name Z–A" />
          <Opt v="owner" cur={otherValue.sort} t="Owner A–Z" />
          <Opt v="ownerz" cur={otherValue.sort} t="Owner Z–A" />
          <Opt v="issues" cur={otherValue.sort} t="Most open issues" />
        </select>
        <select class="input" id="hmgroup" title="Group" onChange={on.group}>
          <Opt v="none" cur={otherValue.group} t="No grouping" />
          <Opt v="owner" cur={otherValue.group} t="Group by owner" />
        </select>
      </div>
      {grid}
    </>
  );
}

export function Home({ p: props, on }: { p: HomeProps; on: HomeHandlers }) {
  return (
    <div class="notes-page hm-page">
      <div class="np-head">
        <h1>
          {renderIcon('home')}
          {SP}
          {props.owner || 'Home'}
        </h1>
      </div>
      {'\n  '}
      <p class="hm-hint">
        Open a pull request: type <code>owner/repo#123</code> or paste a URL in
        the bar above.
      </p>
      {props.banners.length ? (
        <div class="push-wrap">
          <Banners items={props.banners} on={on} />
        </div>
      ) : (
        ''
      )}
      {props.err ? <div class="err">{props.err}</div> : ''}
      <div class="np-tabs">
        <button
          class={props.tab === 'repos' ? 'sel' : ''}
          data-htab="repos"
          onClick={() => on.tab('repos')}
        >
          {renderIcon('repo')} Repositories
          {props.repoCount !== null ? <span>{props.repoCount}</span> : ''}
        </button>
        <button
          class={props.tab === 'recent' ? 'sel' : ''}
          data-htab="recent"
          onClick={() => on.tab('recent')}
        >
          {renderIcon('clock')} Recent<span>{props.recentCount}</span>
        </button>
      </div>
      <Body b={props.body} on={on} />
    </div>
  );
}
