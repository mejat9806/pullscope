import type { ComponentChildren } from 'preact';
import { html, Raw } from './html';
import { I, SP } from './ui';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export interface RecentCard { ref: string; state: string; icon: string; title: string }
export interface RepoCard { full: string; name: string; owner: string; priv: boolean; archived: boolean; issues: number; desc: string }
export interface HomeProps {
  owner: string; tab: string; repoCount: number | null; recentCount: number; banners: string; err: string;
  body:
    | { kind: 'recent'; filter: string; state: string; hasAny: boolean; cards: RecentCard[]; emptyText: string }
    | { kind: 'html'; html: string }
    | { kind: 'repos'; filter: string; vis: string; sort: string; group: string; groups: { owner: string; cards: RepoCard[] }[] | null; cards: RepoCard[]; none: boolean };
}

function Card({ r }: { r: RepoCard }) {
  return <a class="hm-card" data-repo={r.full}><span class="rc-i" style="color:var(--fgColor-muted)">{I(r.priv ? 'lock' : 'repo')}</span><span class="hm-t"><b>{r.name}</b><i>{r.owner}{r.archived ? ' · archived' : ''}{r.issues ? ` · ${r.issues} open` : ''}</i>{r.desc ? <em>{r.desc}</em> : ''}</span></a>;
}
function Opt({ v, cur, t }: { v: string; cur: string; t: string }) { return <option value={v} selected={cur === v}>{t}</option>; }

function Body({ b }: { b: HomeProps['body'] }): ComponentChildren {
  if (b.kind === 'html') return Raw(b.html);
  if (b.kind === 'recent') {
    return <>{b.hasAny ? <div class="hm-fbar"><input class="input hm-filter" id="hmrfilter" placeholder="Filter by title or repo…" value={b.filter} /><div class="seg-ctl">{['all', 'open', 'merged', 'closed'].map((x) => <button class={b.state === x ? 'on' : ''} data-rstate={x}>{cap(x)}</button>)}</div></div> : ''}
      {b.cards.length ? <div class="hm-grid">{b.cards.map((r) => <a class="hm-card" data-open={r.ref}><span class={`rc-i ${r.state}`}>{I(r.icon)}</span><span class="hm-t"><b>{r.title}</b><i>{r.ref}</i></span><button class="rc-x" data-rm={r.ref} title="Remove">{I('x')}</button></a>)}</div> : <div class="diff-empty">{b.emptyText}</div>}</>;
  }
  const grid = b.none ? <div class="diff-empty">No matching repositories.</div> : b.groups ? <>{b.groups.map((g) => <><h3 class="hm-grp">{g.owner}<span>{g.cards.length}</span></h3><div class="hm-grid">{g.cards.map((r) => <Card r={r} />)}</div></>)}</> : <div class="hm-grid">{b.cards.map((r) => <Card r={r} />)}</div>;
  return <><div class="hm-fbar"><input class="input hm-filter" id="hmfilter" placeholder="Find a repository…" value={b.filter} /><div class="seg-ctl">{['all', 'public', 'private'].map((x) => <button class={b.vis === x ? 'on' : ''} data-hvis={x}>{cap(x)}</button>)}</div>
    <select class="input" id="hmsort" title="Sort"><Opt v="pushed" cur={b.sort} t="Recently pushed" /><Opt v="oldest" cur={b.sort} t="Least recently pushed" /><Opt v="name" cur={b.sort} t="Name A–Z" /><Opt v="namez" cur={b.sort} t="Name Z–A" /><Opt v="owner" cur={b.sort} t="Owner A–Z" /><Opt v="ownerz" cur={b.sort} t="Owner Z–A" /><Opt v="issues" cur={b.sort} t="Most open issues" /></select>
    <select class="input" id="hmgroup" title="Group"><Opt v="none" cur={b.group} t="No grouping" /><Opt v="owner" cur={b.group} t="Group by owner" /></select></div>{grid}</>;
}

export function Home(p: HomeProps) {
  return <div class="notes-page hm-page"><div class="np-head"><h1>{I('home')}{SP}{p.owner || 'Home'}</h1></div>{'\n  '}
    <p class="hm-hint">Open a pull request: type <code>owner/repo#123</code> or paste a URL in the bar above.</p>{p.banners ? <div class="push-wrap">{Raw(p.banners)}</div> : ''}{p.err ? <div class="err">{p.err}</div> : ''}
    <div class="np-tabs"><button class={p.tab === 'repos' ? 'sel' : ''} data-htab="repos">{I('repo')} Repositories{p.repoCount !== null ? <span>{p.repoCount}</span> : ''}</button><button class={p.tab === 'recent' ? 'sel' : ''} data-htab="recent">{I('clock')} Recent<span>{p.recentCount}</span></button></div><Body b={p.body} /></div>;
}
export const homeHtml = (p: HomeProps) => html(<Home {...p} />);
export const diffEmptyHtml = (inner: ComponentChildren, cls = '') => html(<div class={`diff-empty${cls}`}>{inner}</div>);
export const addTokenHtml = () => html(<div class="diff-empty">Add an access token to list all your repositories and their pull requests.<br /><br /><button class="btn primary" id="addtoken">Add token</button></div>);
export const spinnerHtml = () => html(<div class="spinner" style="margin:48px auto">Loading repositories…</div>);
