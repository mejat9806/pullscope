import { Icon } from './ui';

import type { RecentEntry, Tab } from '../types';

export interface TabHandlers {
  open: (index: number) => void;
  aux: (event: MouseEvent, index: number) => void;
  down: (event: MouseEvent, index: number) => void;
  close: (event: MouseEvent, index: number) => void;
  add: (event: MouseEvent) => void;
  fresh: (ref: string) => void;
  home: () => void;
  reopen: () => void;
}

export interface TabStripProps {
  tabs: Tab[];
  cur: string;
  recents: RecentEntry[];
  menu: boolean;
  menuAt: { top: number; left: number } | null;
  drag: { from: number; to: number; dx: number; w: number } | null;
  closedFirst: string | null;
  on: TabHandlers;
}

// While a tab is dragged it follows the pointer and the tabs it passes slide aside by its width.
const tabShift = (item: TabStripProps['drag'], index: number) =>
  !item
    ? undefined
    : index === item.from
      ? `transform:translateX(${item.dx}px)`
      : item.from < item.to && index > item.from && index <= item.to
        ? `transform:translateX(-${item.w}px)`
        : item.from > item.to && index < item.from && index >= item.to
          ? `transform:translateX(${item.w}px)`
          : undefined;

export function TabStrip({
  tabs,
  cur,
  recents,
  menu,
  menuAt,
  drag,
  closedFirst,
  on,
}: TabStripProps) {
  return (
    <div class="ptabs">
      {tabs.map((tab, index) => (
        <div
          class={`ptab ${tab.ref === cur ? 'on' : ''}${drag && drag.from === index ? ' drag' : ''}`}
          style={tabShift(drag, index)}
          data-tab={index}
          onClick={event => {
            if ((event.target as HTMLElement).closest('.pt-x')) {
              return;
            }

            on.open(index);
          }}
          onAuxClick={event => on.aux(event, index)}
          onMouseDown={event => on.down(event, index)}
          title={`${tab.ref} · ${tab.title}`}
        >
          <span class={`rc-i ${tab.state}`}>
            <Icon n={tab.icon} />
          </span>
          <span class="pt-t">
            <i>{tab.ref.split('/').pop()}</i> {tab.title}
          </span>
          {tab.dot && <span class="pt-dot"></span>}
          <button
            class="pt-x"
            data-tabx={index}
            onClick={event => on.close(event, index)}
            aria-label="Close tab"
          >
            <Icon n="x" />
          </button>
        </div>
      ))}
      <button
        class="pt-add"
        id="tabadd"
        onClick={on.add}
        title="New tab (⌘T)"
        aria-label="New tab"
      >
        <Icon n="plus" />
        {tabs.length < 2 && <span>New tab</span>}
      </button>
      {menu && (
        <div
          class="pt-menu"
          style={
            menuAt
              ? `top:${menuAt.top}px;left:${menuAt.left}px;margin-top:0`
              : undefined
          }
        >
          <a data-tabhome="" onClick={on.home}>
            <Icon n="home" /> Home
          </a>
          {recents.length > 0 && <h6>Recent</h6>}
          {recents.map(recentEntry => (
            <a
              data-tabnew={recentEntry.ref}
              onClick={() => on.fresh(recentEntry.ref)}
            >
              <span class={`rc-i ${recentEntry.state}`}>
                <Icon n={recentEntry.icon} />
              </span>
              <span class="pt-mt">
                <i>{recentEntry.ref}</i> {recentEntry.title}
              </span>
            </a>
          ))}
          {closedFirst !== null && (
            <>
              <h6>Closed</h6>
              <a data-tabreopen="" onClick={on.reopen}>
                <Icon n="clock" /> Reopen {closedFirst} <kbd>⌘⇧T</kbd>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
