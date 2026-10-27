import type { Profile } from '../types';
import { html, Raw } from './html';

export interface ToolbarProps {
  prRef: string; hasBundle: boolean; canBack: boolean; canFwd: boolean; update: { busy?: boolean; version: string } | null
  offline: boolean; unread: number; dark: boolean; profile: Profile | null; hasToken: boolean; avatar: string
  icon: (name: string, size?: number) => string
}

const NL = '\n  ';

export function Toolbar(p: ToolbarProps) {
  const { icon } = p, label = p.profile ? p.profile.name || p.profile.login : '';
  return (
    <header class="toolbar" data-tauri-drag-region="">
      {NL}<button class="tb-btn nav-btn" id="navbtn" title="Show or hide the sidebar">{Raw(icon('three-bars'))}</button>
      <div class="tb-group">
        <button class="tb-btn" id="back" disabled={!p.canBack} title="Back (⌘[)">{Raw(icon('chevron-left'))}</button>
        <button class="tb-btn" id="fwd" disabled={!p.canFwd} title="Forward (⌘])">{Raw(icon('chevron-right'))}</button>
        <button class="tb-btn" id="reload" disabled={!p.hasBundle} title="Reload (⌘R)">{Raw(icon('sync'))}</button>
      </div>
      {NL}<form id="addr" class="addr">{Raw(icon('search'))}<input id="addrinput" value={p.prRef} placeholder="Open a pull request: owner/repo#123 or URL  (⌘L)" spellcheck={false} autocomplete="off" /></form>{p.update && <button class="upd" id="upd" title="Download and install the new version, then restart">{Raw(icon('sync'))} {p.update.busy ? 'Updating…' : 'Update to v' + p.update.version}</button>}
      {NL}<div class="tb-group">
        <button class={`tb-btn off-ind ${p.offline ? 'on' : ''}`} id="retry" data-tip="Offline — can't reach GitHub. Showing the saved copy. Click to retry." aria-label="Offline, click to retry" tabindex={p.offline ? 0 : -1}>{Raw(icon('alert'))}</button>
        <button class="tb-btn" id="external" disabled={!p.hasBundle} title="Open on github.com">{Raw(icon('link-external'))}</button>
        <button class="tb-btn" id="newprbtn" title="New pull request">{Raw(icon('plus'))}</button>
        <button class="tb-btn" id="inboxbtn" title="Inbox: PRs that need you">{Raw(icon('checklist'))}</button>
        <button class="tb-btn bell" id="bell" title="Notifications">{Raw(icon('bell'))}{p.unread > 0 && <i class="dot">{p.unread}</i>}</button>
        <button class={`theme-sw${p.dark ? ' dark' : ''}`} id="mode" role="switch" aria-checked={p.dark} title={`Switch to ${p.dark ? 'light' : 'dark'} mode`}><i class="st"></i><i class="st s2"></i><i class="st s3"></i><i class="cl"></i><i class="cl c2"></i><span class="knob"><b class="cr"></b><b class="cr c2"></b><b class="cr c3"></b></span></button>
        {p.hasToken && p.profile
          ? <button class="prof-btn" id="profbtn" title={`${label} — account menu`}><img src={p.avatar} alt="" /><span>{label}</span>{Raw(icon('chevron-down', 12))}</button>
          : <button class="tb-btn" id="signin" title="Access token">{Raw(icon('key'))}</button>}
      </div>
    </header>
  );
}

export const toolbarHtml = (p: ToolbarProps) => html(<Toolbar {...p} />);
