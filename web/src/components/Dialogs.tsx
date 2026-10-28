import {
  CODE_SIZES,
  FONT_LABELS,
  FONT_STACKS,
  TEXT_SIZES,
} from '../app/appearance';
import { DraftBox } from './Actions';
import { CommitsDialog } from './Merge';

import type { Appearance, FontChoice } from '../app/appearance';
import type { PalRow } from '../types';
import type { CommitsDialogProps, CpHandlers } from './Merge';

const Err = ({ m: message }: { m: string }) => (
  <div id="reverr">{message ? <div class="act-err">{message}</div> : ''}</div>
);

export interface Btns {
  close: () => void;
  ok: () => void;
}

export interface ReviewDlgProps extends Btns {
  ph: string;
  ev: string;
  onEv: (value: string) => void;
  own: boolean;
}

const REVS: [string, string, string][] = [
  ['COMMENT', 'Comment', 'Submit general feedback without explicit approval.'],
  ['APPROVE', 'Approve', 'Submit feedback and approve merging these changes.'],
  [
    'REQUEST_CHANGES',
    'Request changes',
    'Submit feedback that must be addressed before merging.',
  ],
];

export const ReviewDialog = (props: ReviewDlgProps & { err: string }) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg wide">
      <h2>Finish your review</h2>
      <DraftBox k="review" ph={props.ph} rows={5} submit={props.ok} />
      <div class="radios">
        {REVS.filter(([value]) => !props.own || value === 'COMMENT').map(
          ([otherValue, text, otherText]) => (
            <label>
              <input
                type="radio"
                name="rev"
                value={otherValue}
                checked={props.ev === otherValue}
                onChange={() => props.onEv(otherValue)}
              />{' '}
              <b>{text}</b> <span>{otherText}</span>
            </label>
          ),
        )}
      </div>
      <Err m={props.err} />
      <div class="btns">
        <button
          title="Close without submitting a review"
          class="btn"
          id="revcancel"
          onClick={props.close}
        >
          Cancel
        </button>
        <button
          title="Send your review to GitHub"
          class="btn primary"
          id="revsubmit"
          onClick={props.ok}
        >
          Submit review
        </button>
      </div>
    </div>
  </div>
);

export const EditPrDialog = (
  otherValue: Btns & {
    title: string;
    err: string;
    onTitle: (value: string) => void;
  },
) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg wide">
      <h2>Edit pull request</h2>
      <label class="np-l">Title</label>
      <input
        class="input"
        id="eptitle"
        value={otherValue.title}
        onInput={event =>
          otherValue.onTitle((event.target as HTMLInputElement).value)
        }
        style="width:100%;box-sizing:border-box;height:34px"
      />
      <label class="np-l">Description</label>
      <DraftBox k="prbody" ph="Describe your changes" rows={8} />
      <Err m={otherValue.err} />
      <div class="btns">
        <button
          title="Close without saving"
          class="btn"
          id="epcancel"
          onClick={otherValue.close}
        >
          Cancel
        </button>
        <button
          title="Save the new title and description"
          class="btn primary"
          id="epsave"
          onClick={otherValue.ok}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

export interface AppearanceDlgProps {
  value: Appearance;
  zoom: number;
  change: (patch: Partial<Appearance>) => void;
  zoomTo: (level: number) => void;
  reset: () => void;
  close: () => void;
}

const ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.5];

export const AppearanceDialog = (props: AppearanceDlgProps) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg wide ap-dlg">
      <h2>Appearance</h2>
      <div class="ap-row">
        <span>Font</span>
        <div class="seg">
          {(Object.keys(FONT_LABELS) as FontChoice[]).map(font => (
            <button
              key={font}
              class={props.value.font === font ? 'on' : ''}
              style={`font-family:${FONT_STACKS[font]}`}
              title={`Use the ${FONT_LABELS[font]} font`}
              onClick={() => props.change({ font })}
            >
              {FONT_LABELS[font]}
            </button>
          ))}
        </div>
      </div>
      <div class="ap-row">
        <span>Reading text size</span>
        <div class="seg">
          {TEXT_SIZES.map(size => (
            <button
              key={size}
              class={props.value.textSize === size ? 'on' : ''}
              title={`Comments and descriptions at ${size}%`}
              onClick={() => props.change({ textSize: size })}
            >
              {size}%
            </button>
          ))}
        </div>
      </div>
      <div class="ap-row">
        <span>Code size</span>
        <div class="seg">
          {CODE_SIZES.map(size => (
            <button
              key={size}
              class={props.value.codeSize === size ? 'on' : ''}
              title={`Diffs and code at ${size}px`}
              onClick={() => props.change({ codeSize: size })}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
      <div class="ap-row">
        <span>Whole interface</span>
        <div class="seg">
          {ZOOM_STEPS.map(level => (
            <button
              key={level}
              class={Math.abs(props.zoom - level) < 0.02 ? 'on' : ''}
              title={`Zoom the whole window to ${Math.round(level * 100)}% (Ctrl/⌘ + and −)`}
              onClick={() => props.zoomTo(level)}
            >
              {Math.round(level * 100)}%
            </button>
          ))}
        </div>
      </div>
      <div class="ap-row">
        <span>Lists</span>
        <div class="seg">
          <button
            class={props.value.dense ? '' : 'on'}
            title="Roomy rows in the Inbox and sidebar"
            onClick={() => props.change({ dense: false })}
          >
            Comfortable
          </button>
          <button
            class={props.value.dense ? 'on' : ''}
            title="Tighter rows in the Inbox and sidebar"
            onClick={() => props.change({ dense: true })}
          >
            Compact
          </button>
        </div>
      </div>
      <div class="ap-sample">
        <b>Preview</b>
        <p>
          Looks good to me. One nit: rename <code>cfg</code> to{' '}
          <code>config</code>.
        </p>
        <pre>
          {'const total = items.reduce((sum, item) => sum + item.price, 0);'}
        </pre>
      </div>
      <div class="btns">
        <button
          class="btn"
          title="Put every appearance setting back to its default"
          onClick={props.reset}
        >
          Reset
        </button>
        <button
          class="btn primary"
          title="Close the appearance settings"
          onClick={props.close}
        >
          Done
        </button>
      </div>
    </div>
  </div>
);

export const ConfirmDialog = (
  value: Btns & { title: string; text: string; label: string; danger: boolean },
) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg">
      <h2>{value.title}</h2>
      <p>{value.text}</p>
      <div class="btns">
        <button
          title="Close without doing it"
          class="btn"
          id="cfcancel"
          onClick={value.close}
        >
          Cancel
        </button>
        <button
          title={
            value.danger
              ? 'Confirm this action, it cannot be undone'
              : 'Confirm'
          }
          class={`btn ${value.danger ? 'danger' : 'primary'}`}
          id="cfok"
          onClick={value.ok}
        >
          {value.label}
        </button>
      </div>
    </div>
  </div>
);

export const EditCommentDialog = (value: Btns & { err: string }) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg wide">
      <h2>Edit comment</h2>
      <DraftBox k="editc" ph="Edit your comment" rows={6} />
      <Err m={value.err} />
      <div class="btns">
        <button
          title="Close without saving"
          class="btn"
          id="eccancel"
          onClick={value.close}
        >
          Cancel
        </button>
        <button
          title="Save your edited comment"
          class="btn primary"
          id="ecsave"
          onClick={value.ok}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

export const DeleteCommentDialog = (value: Btns & { err: string }) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg">
      <h2>Delete this comment?</h2>
      <p style="color:var(--fgColor-muted)">This can't be undone.</p>
      <Err m={value.err} />
      <div class="btns">
        <button
          title="Keep the comment"
          class="btn"
          id="dccancel"
          onClick={value.close}
        >
          Cancel
        </button>
        <button
          title="Delete this comment for good"
          class="btn danger"
          id="dcdo"
          onClick={value.ok}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export const HideCommentDialog = (
  otherValue: Btns & {
    reasons: [string, string][];
    reason: string;
    pick: (event: Event) => void;
    err: string;
  },
) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg">
      <h2>Hide this comment</h2>
      <label class="np-l">Reason</label>
      <select
        class="sel"
        id="hcreason"
        style="width:100%;height:34px"
        onChange={otherValue.pick}
      >
        {otherValue.reasons.map(([innerValue, line]) => (
          <option
            value={innerValue}
            selected={innerValue === otherValue.reason}
          >
            {line}
          </option>
        ))}
      </select>
      <Err m={otherValue.err} />
      <div class="btns">
        <button
          title="Keep the comment visible"
          class="btn"
          id="hccancel"
          onClick={otherValue.close}
        >
          Cancel
        </button>
        <button
          title="Hide this comment"
          class="btn primary"
          id="hcdo"
          onClick={otherValue.ok}
        >
          Hide comment
        </button>
      </div>
    </div>
  </div>
);

export interface TokenDlgProps {
  text: string;
  input: (event: Event) => void;
  code: string;
  err: string;
  go: () => void;
  close: () => void;
  save: () => void;
}

export const TokenDialog = (props: TokenDlgProps) => (
  <div class="dlg-bg" id="dlgbg">
    <div class="dlg">
      <h2>GitHub classic token</h2>
      <p>
        Use a <b>classic</b> personal access token with the <code>repo</code>{' '}
        scope. It lists all your repositories (including organization ones) and
        raises the rate limit to 5,000 requests per hour. Organization with SSO:
        after creating it, click <b>Configure SSO → Authorize</b>. Stored in
        your OS keychain. Leave empty and save to remove it.
      </p>
      <div class="oauth-row">
        <button
          title="Sign in with GitHub in your browser"
          class="btn primary"
          id="oauthgo"
          onClick={props.go}
        >
          Sign in with GitHub
        </button>
        <span>or paste a token below</span>
      </div>
      <div id="oauthbox">
        {props.code ? (
          <div class="oauth-code">
            <span>Enter this code on GitHub</span>
            <b>{props.code}</b>
            <small>Waiting for approval…</small>
          </div>
        ) : props.err ? (
          <div class="err" style="margin:8px 0">
            {props.err}
          </div>
        ) : (
          ''
        )}
      </div>
      <p>
        <a href="https://github.com/settings/tokens/new?scopes=repo&description=Pullscope">
          Create a classic token (repo scope preselected) ↗
        </a>
      </p>
      <input
        class="input"
        id="tokeninput"
        type="password"
        value={props.text}
        onInput={props.input}
        placeholder="ghp_…"
        style="width:100%;box-sizing:border-box"
      />
      <div class="btns">
        <button
          title="Close without saving"
          class="btn"
          id="tokcancel"
          onClick={props.close}
        >
          Cancel
        </button>
        <button
          title="Save the access token"
          class="btn primary"
          id="toksave"
          onClick={props.save}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

export interface RepoPickProps {
  repos: { full_name: string; private: boolean }[] | null;
  on: Set<string>;
  q: string;
  err: string;
  toggle: (name: string) => void;
  all: (on: boolean) => void;
  input: (event: Event) => void;
  close: () => void;
  save: () => void;
}

export const RepoPickDialog = (props: RepoPickProps) => {
  const query = props.q.toLowerCase();

  const shown = (props.repos || []).filter(row =>
    row.full_name.toLowerCase().includes(query),
  );

  return (
    <div class="dlg-bg" id="dlgbg">
      <div class="dlg wide">
        <h2>Choose repositories</h2>
        <p>
          Only the ticked repositories are listed and fetched (sidebar, inbox,
          notifications). Tick none, or all, to use every repository. Pasting a
          pull request link still opens any repository.
        </p>
        <input
          class="input"
          id="rpq"
          placeholder="Filter…"
          value={props.q}
          onInput={props.input}
          style="width:100%;box-sizing:border-box;height:34px"
        />
        <div class="rp-bar">
          <span>{props.on.size} selected</span>
          <button
            title="Tick every repository in the list"
            class="btn"
            onClick={() => props.all(true)}
          >
            Select shown
          </button>
          <button
            title="Untick all repositories"
            class="btn"
            onClick={() => props.all(false)}
          >
            Clear
          </button>
        </div>
        <div class="rp-list">
          {props.repos ? (
            shown.length ? (
              shown.map(row => (
                <label class="rp-row">
                  <input
                    type="checkbox"
                    checked={props.on.has(row.full_name)}
                    onChange={() => props.toggle(row.full_name)}
                  />{' '}
                  <b>{row.full_name}</b>
                  {row.private ? <i>private</i> : ''}
                </label>
              ))
            ) : (
              <div class="sb-empty">No matches.</div>
            )
          ) : (
            <div class="sb-empty">Loading repositories…</div>
          )}
        </div>
        <Err m={props.err} />
        <div class="btns">
          <button
            title="Close without saving"
            class="btn"
            id="rpcancel"
            onClick={props.close}
          >
            Cancel
          </button>
          <button
            title="Save the chosen repositories"
            class="btn primary"
            id="rpsave"
            onClick={props.save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export interface MetaProps {
  field: string;
  items: { id: string; name: string; color?: string; avatar?: string }[] | null;
  on: string[];
  q: string;
  err: string;
  busy: boolean;
  pick: (id: string) => void;
  input: (event: Event) => void;
  close: () => void;
  save: () => void;
}

const META_T: Record<string, string> = {
  labels: 'Labels',
  assignees: 'Assignees',
  milestone: 'Milestone',
};

export const MetaDialog = (props: MetaProps) => {
  const query = props.q.toLowerCase();
  const one = props.field === 'milestone';

  const shown = (props.items || []).filter(row =>
    row.name.toLowerCase().includes(query),
  );

  return (
    <div class="dlg-bg" id="dlgbg">
      <div class="dlg wide">
        <h2>{META_T[props.field]}</h2>
        <input
          class="input"
          id="metaq"
          placeholder="Filter…"
          value={props.q}
          onInput={props.input}
          style="width:100%;box-sizing:border-box;height:34px"
        />
        <div class="rp-list">
          {props.items ? (
            <>
              {one && (
                <label class="rp-row">
                  <input
                    type="radio"
                    name="ms"
                    checked={!props.on.length}
                    onChange={() => props.pick('')}
                  />{' '}
                  <b>No milestone</b>
                </label>
              )}
              {shown.length ? (
                shown.map(row => (
                  <label class="rp-row">
                    <input
                      type={one ? 'radio' : 'checkbox'}
                      name="ms"
                      checked={props.on.includes(row.id)}
                      onChange={() => props.pick(row.id)}
                    />
                    {row.avatar && (
                      <img
                        class="mt-av"
                        src={row.avatar}
                        width="20"
                        height="20"
                      />
                    )}
                    {row.color && (
                      <i class="mt-dot" style={`background:#${row.color}`}></i>
                    )}
                    <b>{row.name}</b>
                  </label>
                ))
              ) : (
                <div class="sb-empty">None found.</div>
              )}
            </>
          ) : (
            <div class="sb-empty">Loading…</div>
          )}
        </div>
        <Err m={props.err} />
        <div class="btns">
          <button
            title="Close without saving"
            class="btn"
            onClick={props.close}
          >
            Cancel
          </button>
          <button
            title="Save to GitHub"
            class="btn primary"
            disabled={props.busy || !props.items}
            onClick={props.save}
          >
            {props.busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { CommitsDialog };

export type { CommitsDialogProps, CpHandlers };

export const CmPop = ({
  x: left,
  y: offset,
  hr,
  edit,
  hide,
  del,
  pick,
}: {
  x: number;
  y: number;
  hr: boolean;
  edit: boolean;
  hide: boolean;
  del: boolean;
  pick: (hash: string) => void;
}) => (
  <div class="react-pop cm-pop" style={`left:${left}px;top:${offset}px`}>
    <button
      title="Copy a link to this comment"
      data-h="link"
      onClick={() => pick('link')}
    >
      Copy link
    </button>
    <button
      title="Copy the comment as Markdown"
      data-h="md"
      onClick={() => pick('md')}
    >
      Copy Markdown
    </button>
    <button
      title="Start a reply that quotes this comment"
      data-h="quote"
      onClick={() => pick('quote')}
    >
      Quote reply
    </button>
    <button
      title="Open a new issue that mentions this comment"
      data-h="issue"
      onClick={() => pick('issue')}
    >
      Reference in new issue
    </button>
    {hr ? <hr /> : ''}
    {edit ? (
      <button
        title="Edit this comment"
        data-h="edit"
        onClick={() => pick('edit')}
      >
        Edit
      </button>
    ) : (
      ''
    )}
    {hide ? (
      <button
        title="Hide this comment"
        data-h="hide"
        onClick={() => pick('hide')}
      >
        Hide
      </button>
    ) : (
      ''
    )}
    {del ? (
      <button
        title="Delete this comment"
        data-h="del"
        class="danger"
        onClick={() => pick('del')}
      >
        Delete
      </button>
    ) : (
      ''
    )}
  </div>
);

export const ReactPop = ({
  x: left,
  y: offset,
  reacts,
  pick,
}: {
  x: number;
  y: number;
  reacts: [string, string][];
  pick: (color: string) => void;
}) => (
  <div class="react-pop" style={`left:${left}px;top:${offset}px`}>
    {reacts.map(([key, em]) => (
      <button
        title={`React with ${key}`}
        data-c={key}
        onClick={() => pick(key)}
      >
        {em}
      </button>
    ))}
  </div>
);

export const CtxPop = ({
  x: left,
  y: offset,
  pick,
}: {
  x: number;
  y: number;
  pick: (hash: string) => void;
}) => (
  <div class="react-pop cm-pop" style={`left:${left}px;top:${offset}px`}>
    <button
      title="Open this pull request in a new tab"
      data-h="new"
      onClick={() => pick('new')}
    >
      Open in new tab
    </button>
    <button
      title="Open this pull request in this tab"
      data-h="here"
      onClick={() => pick('here')}
    >
      Open
    </button>
    <button
      title="Copy a link to this pull request"
      data-h="link"
      onClick={() => pick('link')}
    >
      Copy link
    </button>
  </div>
);

const focusEl = (el: HTMLElement | null) => {
  el?.focus();
};

export interface PaletteProps {
  q: string;
  rows: PalRow[];
  sel: number;
  onQ: (value: string) => void;
  onKey: (event: KeyboardEvent) => void;
  pick: (index: number) => void;
  close: () => void;
}

export const Palette = (props: PaletteProps) => (
  <div
    class="dlg-bg palette"
    onMouseDown={event => {
      if (event.target === event.currentTarget) {
        props.close();
      }
    }}
  >
    <div class="dlg pal">
      <input
        class="pal-in"
        placeholder="Jump to a pull request — owner/repo#123, a URL, or search recent…"
        value={props.q}
        ref={focusEl}
        onInput={event => props.onQ((event.target as HTMLInputElement).value)}
        onKeyDown={props.onKey}
      />
      <div
        class="pal-list"
        onMouseDown={event => {
          const element = (event.target as HTMLElement).closest<HTMLElement>(
            '.pal-row',
          );

          if (element) {
            props.pick(+element.dataset.i!);
          }
        }}
      >
        {props.rows.length ? (
          props.rows.map((palRow, index) => (
            <div
              class={`pal-row${index === props.sel ? ' on' : ''}`}
              data-i={index}
            >
              <b>{palRow.label}</b>
              <i>{palRow.sub}</i>
            </div>
          ))
        ) : (
          <div class="pal-none">No matches</div>
        )}
      </div>
    </div>
  </div>
);

const HELP: [string, string][] = [
  ['Jump to any pull request', '⌘ K'],
  ['Next / previous comment', 'j / k'],
  ['Next / previous unresolved thread', '] / ['],
  ['Reply to the selected comment', 'r'],
  ['Write a comment (docked at the bottom)', 'c'],
  ['New pull request', 'n'],
  ['New tab / close tab / reopen closed', '⌘T · ⌘W · ⌘⇧T'],
  ['Go to tab 1–9 / next tab', '⌘1–9 · ⌃Tab'],
  ['Open a PR in a new tab', '⌘-click'],
  ['Turn Split view on / off', 's'],
  ['Swap the two sides of Split view', 'f'],
  ['Diff: unified ⇄ side-by-side', 'd'],
  ['Show this help', '?'],
  ['Close dialogs and menus', 'Esc'],
];

export const HelpDialog = ({ close }: { close: () => void }) => (
  <div class="dlg-bg palette" onMouseDown={close}>
    <div class="dlg pal">
      <h2>Keyboard shortcuts</h2>
      {HELP.map(([text, otherText]) => (
        <div class="kb-r">
          <span>{text}</span>
          <kbd>{otherText}</kbd>
        </div>
      ))}
    </div>
  </div>
);
