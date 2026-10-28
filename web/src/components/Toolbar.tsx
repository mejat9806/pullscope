import { useFocusTarget } from './req';
import { Icon } from './ui';

import type { Profile } from '../types';

export interface ToolbarHandlers {
  nav: (event: MouseEvent) => void;
  back: () => void;
  fwd: () => void;
  reload: () => void;
  external: () => void;
  mode: (event: MouseEvent) => void;
  addr: (event: Event) => void;
  drag: (event: MouseEvent) => void;
  input: (event: Event) => void;
  focus: (event: Event) => void;
  blur: () => void;
  key: (event: KeyboardEvent) => void;
  upd: () => void;
  retry: (event: MouseEvent) => void;
  newPr: () => void;
  inbox: () => void;
  bell: (event: MouseEvent) => void;
  signin: () => void;
  prof: (event: MouseEvent) => void;
}

export interface ToolbarProps {
  text: string;
  hasBundle: boolean;
  canBack: boolean;
  canFwd: boolean;
  update: { busy?: boolean; version: string } | null;
  offline: boolean;
  unread: number;
  dark: boolean;
  pop: number;
  profile: Profile | null;
  hasToken: boolean;
  avatar: string;
  on: ToolbarHandlers;
}

const NL = '\n  ';

export function Toolbar(props: ToolbarProps) {
  const label = props.profile ? props.profile.name || props.profile.login : '';

  return (
    <header
      class="toolbar"
      data-tauri-drag-region=""
      onMouseDown={props.on.drag}
    >
      {NL}
      <button
        class="tb-btn nav-btn"
        id="navbtn"
        onClick={props.on.nav}
        title="Show or hide the sidebar"
      >
        <Icon n="three-bars" />
      </button>
      <div class="tb-group">
        <button
          class="tb-btn"
          id="back"
          onClick={props.on.back}
          disabled={!props.canBack}
          title="Back (⌘[)"
        >
          <Icon n="chevron-left" />
        </button>
        <button
          class="tb-btn"
          id="fwd"
          onClick={props.on.fwd}
          disabled={!props.canFwd}
          title="Forward (⌘])"
        >
          <Icon n="chevron-right" />
        </button>
        <button
          class="tb-btn"
          id="reload"
          onClick={props.on.reload}
          disabled={!props.hasBundle}
          title="Reload (⌘R)"
        >
          <Icon n="sync" />
        </button>
      </div>
      {NL}
      <form id="addr" class="addr" onSubmit={props.on.addr}>
        <Icon n="search" />
        <input
          id="addrinput"
          ref={useFocusTarget('addr')}
          value={props.text}
          onInput={props.on.input}
          onFocus={props.on.focus}
          onBlur={props.on.blur}
          onKeyDown={props.on.key}
          placeholder="Open a pull request: owner/repo#123 or URL  (⌘L)"
          spellcheck={false}
          autocomplete="off"
        />
      </form>
      {props.update && (
        <button
          class="upd"
          id="upd"
          onClick={props.on.upd}
          title="Download and install the new version, then restart"
        >
          <Icon n="sync" />{' '}
          {props.update.busy
            ? 'Updating…'
            : `Update to v${props.update.version}`}
        </button>
      )}
      {NL}
      <div class="tb-group">
        <button
          class={`tb-btn off-ind ${props.offline ? 'on' : ''}`}
          id="retry"
          onClick={props.on.retry}
          data-tip="Offline — can't reach GitHub. Showing the saved copy. Click to retry."
          aria-label="Offline, click to retry"
          tabindex={props.offline ? 0 : -1}
        >
          <Icon n="alert" />
        </button>
        <button
          class="tb-btn"
          id="external"
          onClick={props.on.external}
          disabled={!props.hasBundle}
          title="Open on github.com"
        >
          <Icon n="link-external" />
        </button>
        <button
          class="tb-btn"
          id="newprbtn"
          onClick={props.on.newPr}
          title="New pull request"
        >
          <Icon n="plus" />
        </button>
        <button
          class="tb-btn"
          id="inboxbtn"
          onClick={props.on.inbox}
          title="Inbox: PRs that need you"
        >
          <Icon n="checklist" />
        </button>
        <button
          class="tb-btn bell"
          id="bell"
          onClick={props.on.bell}
          title="Notifications"
        >
          <Icon n="bell" />
          {props.unread > 0 && <i class="dot">{props.unread}</i>}
        </button>
        <button
          key={props.pop}
          class={`theme-sw${props.dark ? ' dark' : ''}${props.pop ? ' pop' : ''}`}
          id="mode"
          onClick={props.on.mode}
          role="switch"
          aria-checked={props.dark}
          title={`Switch to ${props.dark ? 'light' : 'dark'} mode`}
        >
          <i class="st"></i>
          <i class="st s2"></i>
          <i class="st s3"></i>
          <i class="cl"></i>
          <i class="cl c2"></i>
          <span class="knob">
            <b class="cr"></b>
            <b class="cr c2"></b>
            <b class="cr c3"></b>
          </span>
        </button>
        {props.hasToken && props.profile ? (
          <button
            class="prof-btn"
            id="profbtn"
            onClick={props.on.prof}
            title={`${label} — account menu`}
          >
            <img src={props.avatar} alt="" />
            <span>{label}</span>
            <Icon n="chevron-down" s={12} />
          </button>
        ) : (
          <button
            class="tb-btn"
            id="signin"
            onClick={props.on.signin}
            title="Access token"
          >
            <Icon n="key" />
          </button>
        )}
      </div>
    </header>
  );
}
