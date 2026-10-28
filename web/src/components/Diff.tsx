import { whenParts } from '../app/core';
import { DraftBox, ErrLine } from './Actions';
import { DiffHunkTable, FoldBtn, ReactionsBar } from './Comments';
import { flashClass, useFlash } from './flash';
import { Av, renderIcon, SP, When } from './ui';

import type { Person } from '../types';
import type { ConvHandlers, HunkRow, ReactionsProps } from './Comments';
import type { FlashProps } from './flash';

export type SugProps =
  | { kind: 'note'; text: string }
  | {
      kind: 'btn';
      id: number | string;
      disabled: boolean;
      ref: string;
      mine: boolean;
    };

export function Sug({ s: props, on }: { s: SugProps; on?: ConvHandlers }) {
  return props.kind === 'note' ? (
    <div class="sug-row">
      <span class="sug-note">{props.text}</span>
    </div>
  ) : (
    <div class="sug-row">
      <button
        class="btn small primary"
        data-sug={props.id}
        disabled={props.disabled}
        onClick={on && (event => on.sug(event, String(props.id)))}
      >
        Apply suggestion
      </button>
      <span class="sug-note">
        Commits to <code>{props.ref}</code>
        {props.mine ? '' : ' (fork — needs push access)'}
      </span>
    </div>
  );
}

export interface TcProps {
  user: Person | null | undefined;
  login: string;
  at: string;
  id: number | string;
  root: number | string;
  withMenu: boolean;
  bodyHtml: string;
  reactions: ReactionsProps;
  sug: SugProps | null;
  anchorId: boolean;
  kb?: boolean;
  flash?: FlashProps;
}

export function Tc(props: TcProps & { on?: ConvHandlers }) {
  const { on } = props;
  const ref = useFlash(props.flash, props.kb);

  return (
    <div
      ref={ref}
      class={`tc${props.kb ? ' kb' : ''}${flashClass(props.flash)}`}
      id={props.anchorId ? `c-${props.id}` : undefined}
    >
      <a href={props.user?.html_url || '#'}>{Av(props.user, 24)}</a>
      <div style="flex:1;min-width:0">
        <div>
          <span class="who">{props.login}</span>
          {SP}
          <span>{When(props.at)}</span>
          {props.withMenu ? (
            <button
              class="cm-btn"
              data-cm={props.id}
              data-root={props.root}
              title="Comment actions"
              onClick={
                on &&
                (event => on.menu(event, event.currentTarget as HTMLElement))
              }
            >
              ⋯
            </button>
          ) : (
            ''
          )}
        </div>
        <div
          class="markdown-body"
          style="margin-top:8px"
          dangerouslySetInnerHTML={{ __html: props.bodyHtml }}
        />
        {props.sug ? <Sug s={props.sug} on={on} /> : ''}
        <ReactionsBar {...props.reactions} on={on?.react} />
      </div>
    </div>
  );
}

export interface ThreadRowProps {
  cols: number;
  k: string;
  def: boolean;
  folded: boolean;
  side: string;
  line: number;
  outdated: boolean;
  resolved: boolean;
  cards: TcProps[];
  reply: ReplyProps | null;
  act: { tid: string; res: boolean } | null;
}

export function ThreadRow(props: ThreadRowProps & { on?: ConvHandlers }) {
  const { on } = props;

  return (
    <tr class="lc-row th-row">
      <td colspan={props.cols}>
        <div class={`thread inl${props.folded ? ' folded' : ''}`}>
          <div class="thread-head">
            <FoldBtn
              k={props.k}
              title="Hide this thread"
              def={props.def}
              folded={props.folded}
              onFold={on?.fold}
            />
            <span class="th-t">
              Comment on line{' '}
              <b>
                {props.side}
                {props.line}
              </b>
            </span>
            {props.outdated ? <span class="res out">Outdated</span> : ''}
            {props.resolved ? <span class="res">Resolved</span> : ''}
          </div>
          {props.cards.map(otherProps => (
            <Tc {...otherProps} on={on} />
          ))}
          {props.reply ? <ReplyBox {...props.reply} on={on} /> : ''}
          {props.act ? (
            <div class="th-foot">
              <button
                class="thread-act"
                data-thread={props.act.tid}
                data-res={props.act.res ? 'unresolve' : 'resolve'}
                onClick={
                  on &&
                  (event =>
                    on.thread(
                      event,
                      props.act!.tid,
                      props.act!.res ? 'unresolve' : 'resolve',
                    ))
                }
              >
                {props.act.res
                  ? 'Unresolve conversation'
                  : 'Resolve conversation'}
              </button>
            </div>
          ) : (
            ''
          )}
        </div>
      </td>
    </tr>
  );
}

export interface ReplyProps {
  rid: number | string;
  ph: string;
  err: string;
}

export function ReplyBox({
  rid,
  ph,
  err,
  on,
}: ReplyProps & { on?: ConvHandlers }) {
  return (
    <div class="reply">
      <DraftBox
        k={`reply-${rid}`}
        ph={ph}
        rows={2}
        submit={on && (() => on.reply(String(rid)))}
      />
      <ErrLine m={err} />
      <button
        class="btn small"
        data-sendreply={rid}
        onClick={on && (() => on.reply(String(rid)))}
      >
        Reply
      </button>
    </div>
  );
}

export interface LcHandlers {
  del: (id: string) => void;
  cancel: () => void;
  suggest: (event: Event) => void;
  add: () => void;
}

export const LcCards = ({
  cards,
  on,
}: {
  cards: { id: number | string; body: string }[];
  on?: LcHandlers;
}) => (
  <>
    {cards.map(item => (
      <div class="lc-card">
        <span class="lc-tag">Pending</span>
        <div class="lc-body" dangerouslySetInnerHTML={{ __html: item.body }} />
        <button
          class="lc-x"
          data-lcdel={item.id}
          title="Delete draft comment"
          onClick={on && (() => on.del(String(item.id)))}
        >
          {renderIcon('x')}
        </button>
      </div>
    ))}
  </>
);

export const LcEdit = ({
  code,
  on,
}: {
  code: string | null;
  on?: LcHandlers;
}) => (
  <div class="lc-edit">
    <DraftBox
      k="lc"
      ph="Leave a comment on this line"
      rows={3}
      submit={on?.add}
    />
    <div class="lc-btns">
      {code !== null ? (
        <button
          class="btn small"
          id="lcsuggest"
          data-code={code}
          title="Insert a suggested change for this line"
          onClick={on?.suggest}
        >
          ± Suggest change
        </button>
      ) : (
        ''
      )}
      <span class="sp"></span>
      <button class="btn small" id="lccancel" onClick={on?.cancel}>
        Cancel
      </button>
      <button class="btn small primary" id="lcadd" onClick={on?.add}>
        Add to review
      </button>
    </div>
  </div>
);

export interface RvThread {
  folded: boolean;
  k: string;
  def: boolean;
  path: string;
  resolved: boolean;
  tid: string | null;
  hunk: HunkRow[];
  cards: TcProps[];
  reply: ReplyProps;
}

export interface ReviewBlockProps {
  folded: boolean;
  k: string;
  kind: string;
  ic: string;
  user: Person | null | undefined;
  verb: string;
  url: string;
  at: string;
  sum: { ok: boolean; text: string; allRes: boolean } | null;
  bodyHtml: string;
  threads: RvThread[];
  allRes: boolean;
}

const Actor = ({ u: person }: { u?: Person | null }) =>
  person ? (
    <a class="actor" href={person.html_url}>
      {person.login}
    </a>
  ) : (
    <span class="actor">ghost</span>
  );

export function ReviewBlock(props: ReviewBlockProps & { on?: ConvHandlers }) {
  const { on } = props;

  return (
    <div class={`TLI rev${props.folded ? ' folded' : ''}`}>
      <div class={`TLI-badge ${props.kind}`}>{renderIcon(props.ic)}</div>
      <div class="TLI-avatar">{Av(props.user, 20)}</div>
      <div class="TLI-body">
        <div class="row">
          <FoldBtn
            k={props.k}
            title="Collapse / expand this review"
            def={props.allRes}
            folded={props.folded}
            onFold={on?.fold}
          />
          <Actor u={props.user} /> <span>{props.verb}</span>{' '}
          <a class="time" href={props.url}>
            {props.at}
          </a>
          {props.sum ? (
            <span class={`rev-sum${props.sum.ok ? ' ok' : ''}`}>
              {props.sum.allRes ? (
                <>{renderIcon('check')} All resolved</>
              ) : (
                props.sum.text
              )}
            </span>
          ) : (
            ''
          )}
        </div>
        {'\n  '}
        {props.bodyHtml ? (
          <div
            class="cbox nocaret"
            style="margin-top:8px;color:var(--fgColor-default)"
          >
            <div class="cbody">
              <div
                class="markdown-body"
                dangerouslySetInnerHTML={{ __html: props.bodyHtml }}
              />
            </div>
          </div>
        ) : (
          ''
        )}
        {props.threads.length ? (
          <div>
            {props.threads.map(rvThread => (
              <div class={`thread${rvThread.folded ? ' folded' : ''}`}>
                <div class="thread-head">
                  <FoldBtn
                    k={rvThread.k}
                    title="Hide this thread"
                    def={rvThread.def}
                    folded={rvThread.folded}
                    onFold={on?.fold}
                  />
                  {rvThread.path}
                  {rvThread.resolved ? <span class="res">Resolved</span> : ''}
                  {rvThread.tid ? (
                    <button
                      class="thread-act"
                      data-thread={rvThread.tid}
                      data-res={rvThread.resolved ? 'unresolve' : 'resolve'}
                      onClick={
                        on &&
                        (event =>
                          on.thread(
                            event,
                            rvThread.tid!,
                            rvThread.resolved ? 'unresolve' : 'resolve',
                          ))
                      }
                    >
                      {rvThread.resolved ? 'Unresolve' : 'Resolve conversation'}
                    </button>
                  ) : (
                    ''
                  )}
                </div>
                <div class="diffhunk">
                  <DiffHunkTable rows={rvThread.hunk} />
                </div>
                {rvThread.cards.map(otherProps => (
                  <Tc {...otherProps} on={on} />
                ))}
                <ReplyBox {...rvThread.reply} on={on} />
              </div>
            ))}
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

void whenParts;
