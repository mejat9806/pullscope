import { useEffect, useRef, useState } from 'preact/hooks';

import { renderIcon } from './ui';

import type { AcRow, BpGroup } from '../types';

export interface ProfPopProps {
  right: number;
  top: number;
  name: string;
  login: string;
  avatar: string;
  ver?: string;
  dense?: boolean;
  pick: (hash: string) => void;
}

export const ProfPop = (props: ProfPopProps) => (
  <div
    class="react-pop cm-pop prof-pop"
    style={`right:${props.right}px;top:${props.top}px`}
  >
    <div class="pp-h">
      <img src={props.avatar} alt="" />
      <div>
        <b>{props.name}</b>
        <i>@{props.login}</i>
      </div>
    </div>
    <button data-h="profile" onClick={() => props.pick('profile')}>
      {renderIcon('link-external')} Your GitHub profile
    </button>
    <button data-h="repos" onClick={() => props.pick('repos')}>
      {renderIcon('repo')} Choose repositories…
    </button>
    <button data-h="dense" onClick={() => props.pick('dense')}>
      {renderIcon('checklist')}{' '}
      {props.dense ? 'Comfortable lists' : 'Compact lists'}
    </button>
    <button data-h="token" onClick={() => props.pick('token')}>
      {renderIcon('key')} Access token…
    </button>
    <button data-h="out" class="danger" onClick={() => props.pick('out')}>
      Sign out
    </button>
    <div class="pp-ver">
      Signed in with token{props.ver ? ` · Pullscope v${props.ver}` : ''}
    </div>
  </div>
);

export interface AcPopProps {
  rows: AcRow[];
  sel: number;
  left: number;
  top: number;
  width: number;
  pick: (acRow: AcRow) => void;
}

export function AcPop(props: AcPopProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
  });

  return (
    <div
      id="acpop"
      class="acpop"
      ref={ref}
      style={`left:${props.left}px;top:${props.top}px;width:${props.width}px`}
      onMouseDown={event => {
        event.preventDefault();

        const element = (event.target as HTMLElement).closest<HTMLElement>(
          '.ac-row',
        );

        if (element) {
          props.pick(props.rows[+element.dataset.i!]);
        }
      }}
    >
      {props.rows.map((acRow, index) => (
        <div class={`ac-row${index === props.sel ? ' on' : ''}`} data-i={index}>
          <span class={`ac-i ${acRow.state || ''}`}>
            {renderIcon(acRow.ic!)}
          </span>
          <span class="ac-t">
            <b>{acRow.label}</b>
            <i>{acRow.sub}</i>
          </span>
        </div>
      ))}
    </div>
  );
}

export interface BpPopProps {
  repoMode: boolean;
  style: string;
  cur: string;
  groupsFor: (query: string) => BpGroup[];
  age: (text: string) => string;
  done: (value?: string) => void;
}

// Branch / repository picker: the query and the highlighted row are its own state; the caller only learns the final choice.
export function BpPop(props: BpPopProps) {
  const [query, setQ] = useState('');
  const [act, setAct] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const groups = props.groupsFor(query.trim());
  const rows = groups.flatMap(([, bpRows]) => bpRows);
  const first = Math.max(0, Math.min(act, rows.length - 1));

  useEffect(() => {
    inp.current?.focus();
  }, []);

  useEffect(() => {
    ref.current?.querySelector('.act')?.scrollIntoView({ block: 'nearest' });
  });

  let index = 0;

  return (
    <div id="bppop" class="bp-pop" ref={ref} style={props.style}>
      <input
        class="bp-q"
        ref={inp}
        placeholder={
          props.repoMode ? 'Filter repositories…' : 'Filter branches…'
        }
        spellcheck={false}
        value={query}
        onInput={event => {
          setQ((event.target as HTMLInputElement).value);
          setAct(0);
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            props.done();
          } else if (event.key === 'Enter') {
            event.preventDefault();
            props.done(rows[first]?.name);
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();

            setAct(
              Math.max(
                0,
                Math.min(
                  rows.length - 1,
                  first + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              ),
            );
          }
        }}
      />
      <div class="bp-list">
        {groups.length && rows.length ? (
          groups.map(([hash, bpRows]) => (
            <>
              {hash ? (
                <div class="bp-h">
                  {hash}
                  <span>{bpRows.length}</span>
                </div>
              ) : (
                ''
              )}
              {bpRows.map(bpRow => {
                const idx = index++;

                return (
                  <div
                    class={`bp-r${idx === first ? ' act' : ''}${bpRow.name === props.cur ? ' cur' : ''}`}
                    data-b={bpRow.name}
                    onClick={() => props.done(bpRow.name)}
                    onMouseMove={() => {
                      if (idx !== first) {
                        setAct(idx);
                      }
                    }}
                  >
                    <span class="bp-ck">
                      {bpRow.name === props.cur ? '✓' : ''}
                    </span>
                    <span class="bp-n">{bpRow.name}</span>
                    {bpRow.by ? <span class="bp-by">{bpRow.by}</span> : ''}
                    <span class="bp-t">{props.age(bpRow.at)}</span>
                  </div>
                );
              })}
            </>
          ))
        ) : (
          <div class="bp-empty">No matches</div>
        )}
      </div>
    </div>
  );
}

// Click and reaction effects: plain state, so they can be drawn (and removed) like any other view.
export type Fx =
  | {
      id: number;
      k: 'rip';
      l: number;
      t: number;
      w: number;
      h: number;
      radius: string;
      color: string;
      x: number;
      y: number;
      d: number;
    }
  | {
      id: number;
      k: 'burst';
      x: number;
      y: number;
      ch: string;
      dx: number;
      dy: number;
    }
  | { id: number; k: 'conf'; w: number; h: number };

function Confetti({
  w: otherWidth,
  h: otherHeight,
  done,
}: {
  w: number;
  h: number;
  done: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const context = canvas.getContext('2d')!;

    const cols = [
      '#0969da',
      '#1f883d',
      '#8250df',
      '#f2cc60',
      '#cf222e',
      '#ff8fb1',
    ];

    const ps = Array.from({ length: 160 }, () => ({
      x: otherWidth / 2,
      y: otherHeight * 0.6,
      vx: (Math.random() - 0.5) * 18,
      vy: -8 - Math.random() * 14,
      r: 4 + Math.random() * 5,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.4,
      c: cols[(Math.random() * cols.length) | 0],
    }));

    let time = 0;
    let raf = 0;

    const handler = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      time++;

      ps.forEach(props => {
        props.vy += 0.35;
        props.vx *= 0.99;
        props.x += props.vx;
        props.y += props.vy;
        props.a += props.va;
        context.save();
        context.translate(props.x, props.y);
        context.rotate(props.a);
        context.fillStyle = props.c;
        context.globalAlpha = Math.max(0, 1 - time / 130);
        context.fillRect(-props.r, -props.r / 2, props.r * 2, props.r);
        context.restore();
      });

      if (time < 130) {
        raf = requestAnimationFrame(handler);
      } else {
        done();
      }
    };

    handler();

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      class="confetti"
      ref={ref}
      width={otherWidth}
      height={otherHeight}
    ></canvas>
  );
}

export const FxLayer = ({
  items,
  drop,
}: {
  items: Fx[];
  drop: (id: number) => void;
}) => (
  <>
    {items.map(value =>
      value.k === 'rip' ? (
        <div
          key={value.id}
          style={`position:fixed;z-index:999;overflow:hidden;pointer-events:none;left:${value.l}px;top:${value.t}px;width:${value.w}px;height:${value.h}px;border-radius:${value.radius};color:${value.color}`}
        >
          <span
            class="ripple"
            style={`width:${value.d}px;height:${value.d}px;left:${value.x}px;top:${value.y}px`}
          ></span>
        </div>
      ) : value.k === 'burst' ? (
        <span
          key={value.id}
          class="burst"
          style={`left:${value.x}px;top:${value.y}px;--dx:${value.dx}px;--dy:${value.dy}px`}
        >
          {value.ch}
        </span>
      ) : (
        <Confetti
          key={value.id}
          w={value.w}
          h={value.h}
          done={() => drop(value.id)}
        />
      ),
    )}
  </>
);
