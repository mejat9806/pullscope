import type { Profile } from '../types';
import { Icon } from './ui';

export interface ToolbarHandlers {
  nav: (e: MouseEvent) => void; back: () => void; fwd: () => void; reload: () => void; external: () => void
  mode: (e: MouseEvent) => void; addr: (e: Event) => void; upd: () => void; retry: (e: MouseEvent) => void
  newPr: () => void; inbox: () => void; bell: (e: MouseEvent) => void; signin: () => void; prof: (e: MouseEvent) => void
}

export interface ToolbarProps {
  prRef: string; hasBundle: boolean; canBack: boolean; canFwd: boolean; update: { busy?: boolean; version: string } | null
  offline: boolean; unread: number; dark: boolean; profile: Profile | null; hasToken: boolean; avatar: string
  on: ToolbarHandlers
}

const NL = '\n  ';

export function Toolbar(p: ToolbarProps) {
  const label = p.profile ? p.profile.name || p.profile.login : '';
  return (
    <header class="toolbar" data-tauri-drag-region="">
      {NL}<button class="tb-btn nav-btn" id="navbtn" onClick={p.on.nav} title="Show or hide the sidebar"><Icon n={'three-bars'} /></button>
      <div class="tb-group">
        <button class="tb-btn" id="back" onClick={p.on.back} disabled={!p.canBack} title="Back (⌘[)"><Icon n={'chevron-left'} /></button>
        <button class="tb-btn" id="fwd" onClick={p.on.fwd} disabled={!p.canFwd} title="Forward (⌘])"><Icon n={'chevron-right'} /></button>
        <button class="tb-btn" id="reload" onClick={p.on.reload} disabled={!p.hasBundle} title="Reload (⌘R)"><Icon n={'sync'} /></button>
      </div>
      {NL}<form id="addr" class="addr" onSubmit={p.on.addr}><Icon n={'search'} /><input id="addrinput" value={p.prRef} placeholder="Open a pull request: owner/repo#123 or URL  (⌘L)" spellcheck={false} autocomplete="off" /></form>{p.update && <button class="upd" id="upd" onClick={p.on.upd} title="Download and install the new version, then restart"><Icon n={'sync'} /> {p.update.busy ? 'Updating…' : 'Update to v' + p.update.version}</button>}
      {NL}<div class="tb-group">
        <button class={`tb-btn off-ind ${p.offline ? 'on' : ''}`} id="retry" onClick={p.on.retry} data-tip="Offline — can't reach GitHub. Showing the saved copy. Click to retry." aria-label="Offline, click to retry" tabindex={p.offline ? 0 : -1}><Icon n={'alert'} /></button>
        <button class="tb-btn" id="external" onClick={p.on.external} disabled={!p.hasBundle} title="Open on github.com"><Icon n={'link-external'} /></button>
        <button class="tb-btn" id="newprbtn" onClick={p.on.newPr} title="New pull request"><Icon n={'plus'} /></button>
        <button class="tb-btn" id="inboxbtn" onClick={p.on.inbox} title="Inbox: PRs that need you"><Icon n={'checklist'} /></button>
        <button class="tb-btn bell" id="bell" onClick={p.on.bell} title="Notifications"><Icon n={'bell'} />{p.unread > 0 && <i class="dot">{p.unread}</i>}</button>
        <button class={`theme-sw${p.dark ? ' dark' : ''}`} id="mode" onClick={p.on.mode} role="switch" aria-checked={p.dark} title={`Switch to ${p.dark ? 'light' : 'dark'} mode`}><i class="st"></i><i class="st s2"></i><i class="st s3"></i><i class="cl"></i><i class="cl c2"></i><span class="knob"><b class="cr"></b><b class="cr c2"></b><b class="cr c3"></b></span></button>
        {p.hasToken && p.profile
          ? <button class="prof-btn" id="profbtn" onClick={p.on.prof} title={`${label} — account menu`}><img src={p.avatar} alt="" /><span>{label}</span><Icon n={'chevron-down'} s={12} /></button>
          : <button class="tb-btn" id="signin" onClick={p.on.signin} title="Access token"><Icon n={'key'} /></button>}
      </div>
    </header>
  );
}

