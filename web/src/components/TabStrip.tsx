import { GROUP_COLORS } from '../app/tabs';
import { Icon } from './ui';

import type { RecentEntry, Tab, TabGroup } from '../types';

export interface TabHandlers {
  open: (index: number) => void;
  aux: (event: MouseEvent, index: number) => void;
  down: (event: MouseEvent, index: number) => void;
  close: (event: MouseEvent, index: number) => void;
  add: (event: MouseEvent) => void;
  fresh: (ref: string) => void;
  home: () => void;
  reopen: () => void;
  ctx: (event: MouseEvent, index: number) => void;
  closeOthers: (index: number) => void;
  closeRight: (index: number) => void;
  closeAll: () => void;
  closeOne: (index: number) => void;
  groupCtx: (event: MouseEvent, id: string) => void;
  toggleGroup: (id: string) => void;
  rename: (id: string, name: string | null) => void;
  renameStart: (id: string) => void;
  color: (id: string, color: string) => void;
  ungroup: (id: string) => void;
  closeGroup: (id: string) => void;
  pin: (index: number) => void;
  newGroup: (index: number) => void;
  toGroup: (index: number, id: string) => void;
  leaveGroup: (index: number) => void;
}

export interface TabStripProps {
  tabs: Tab[];
  cur: string;
  recents: RecentEntry[];
  menu: boolean;
  menuAt: { top: number; left: number } | null;
  ctx: { index: number; group?: string; top: number; left: number } | null;
  groups: TabGroup[];
  editing: string | null;
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
  ctx,
  groups,
  editing,
  drag,
  closedFirst,
  on,
}: TabStripProps) {
  return (
    <div class="ptabs">
      {tabs.map((tab, index) => {
        const group = tab.group
          ? groups.find(item => item.id === tab.group)
          : undefined;

        const startsGroup =
          !!group && (index === 0 || tabs[index - 1].group !== tab.group);

        const hidden = !!group?.collapsed && tab.ref !== cur;

        return (
          <>
            {startsGroup && group && (
              <GroupChip
                group={group}
                count={tabs.filter(item => item.group === group.id).length}
                editing={editing === group.id}
                on={on}
              />
            )}
            <div
              class={`ptab ${tab.ref === cur ? 'on' : ''}${drag && drag.from === index ? ' drag' : ''}${group ? ' grp' : ''}${tab.pinned ? ' pin' : ''}${hidden ? ' hid' : ''}`}
              style={`${tabShift(drag, index) ?? ''}${group ? `;--gc:${group.color}` : ''}`}
              data-tab={index}
              onClick={event => {
                if ((event.target as HTMLElement).closest('.pt-x')) {
                  return;
                }

                on.open(index);
              }}
              onAuxClick={event => on.aux(event, index)}
              onContextMenu={event => on.ctx(event, index)}
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
              {!tab.pinned && (
                <button
                  class="pt-x"
                  data-tabx={index}
                  onClick={event => on.close(event, index)}
                  aria-label="Close tab"
                  title="Close this tab"
                >
                  <Icon n="x" />
                </button>
              )}
            </div>
          </>
        );
      })}
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
      {ctx && (
        <div
          class="pt-menu pt-ctx"
          style={`top:${ctx.top}px;left:${ctx.left}px;margin-top:0`}
        >
          {ctx.group ? (
            <GroupMenu
              group={groups.find(item => item.id === ctx.group)}
              on={on}
            />
          ) : (
            <TabMenu index={ctx.index} tabs={tabs} groups={groups} on={on} />
          )}
        </div>
      )}
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

interface GroupChipProps {
  group: TabGroup;
  count: number;
  editing: boolean;
  on: TabHandlers;
}

const GroupChip = ({ group, count, editing, on }: GroupChipProps) => (
  <div
    class={`pt-group${group.collapsed ? ' collapsed' : ''}`}
    style={`--gc:${group.color}`}
    onContextMenu={event => on.groupCtx(event, group.id)}
    title={`${group.name || 'Tab group'}: click to ${group.collapsed ? 'expand' : 'collapse'}, right-click for more`}
  >
    {editing ? (
      <input
        class="pt-gname"
        value={group.name}
        placeholder="Name this group"
        maxLength={24}
        ref={element => element?.focus()}
        onClick={event => event.stopPropagation()}
        onBlur={event =>
          on.rename(group.id, (event.currentTarget as HTMLInputElement).value)
        }
        onKeyDown={event => {
          if (event.key === 'Enter') {
            on.rename(
              group.id,
              (event.currentTarget as HTMLInputElement).value,
            );
          } else if (event.key === 'Escape') {
            on.rename(group.id, null);
          }
        }}
      />
    ) : (
      <button class="pt-gbtn" onClick={() => on.toggleGroup(group.id)}>
        {group.name || (group.collapsed ? `${count} tabs` : '')}
        {group.name && group.collapsed ? <small>{count}</small> : null}
      </button>
    )}
  </div>
);

interface TabMenuProps {
  index: number;
  tabs: Tab[];
  groups: TabGroup[];
  on: TabHandlers;
}

const TabMenu = ({ index, tabs, groups, on }: TabMenuProps) => {
  const tab = tabs[index];

  if (!tab) {
    return null;
  }

  const others = groups.filter(group => group.id !== tab.group);

  return (
    <>
      <a
        title={
          tab.pinned
            ? 'Let this tab move and close again'
            : 'Keep this tab small, first in line and out of Close all'
        }
        onClick={() => on.pin(index)}
      >
        <Icon n="bookmark" /> {tab.pinned ? 'Unpin tab' : 'Pin tab'}
      </a>
      <a
        title="Put this tab in a new, named group"
        onClick={() => on.newGroup(index)}
      >
        <Icon n="plus" /> Add to new group
      </a>
      {others.map(group => (
        <a
          title="Move this tab into this group"
          onClick={() => on.toGroup(index, group.id)}
        >
          <span class="pt-swatch" style={`background:${group.color}`}></span>
          Add to {group.name || 'unnamed group'}
        </a>
      ))}
      {tab.group && (
        <a
          title="Take this tab out of its group"
          onClick={() => on.leaveGroup(index)}
        >
          <Icon n="x" /> Remove from group
        </a>
      )}
      <hr />
      <a title="Close this tab" onClick={() => on.closeOne(index)}>
        <Icon n="x" /> Close tab
      </a>
      <a
        title="Close every tab except this one and the pinned ones"
        class={tabs.filter(item => !item.pinned).length < 2 ? 'off' : ''}
        onClick={() => on.closeOthers(index)}
      >
        <Icon n="x" /> Close other tabs
      </a>
      <a
        title="Close the tabs after this one"
        class={index >= tabs.length - 1 ? 'off' : ''}
        onClick={() => on.closeRight(index)}
      >
        <Icon n="x" /> Close tabs to the right
      </a>
      <a title="Close every tab except the pinned ones" onClick={on.closeAll}>
        <Icon n="x-circle" /> Close all tabs
      </a>
    </>
  );
};

const GroupMenu = ({
  group,
  on,
}: {
  group: TabGroup | undefined;
  on: TabHandlers;
}) =>
  group ? (
    <>
      <a
        title="Give this group a name"
        onClick={() => on.renameStart(group.id)}
      >
        <Icon n="pencil" /> Rename group
      </a>
      <div class="pt-colors">
        {GROUP_COLORS.map(color => (
          <button
            class={color === group.color ? 'on' : ''}
            style={`background:${color}`}
            title="Colour this group"
            onClick={() => on.color(group.id, color)}
          ></button>
        ))}
      </div>
      <a
        title={
          group.collapsed
            ? 'Show the tabs of this group'
            : 'Hide the tabs of this group'
        }
        onClick={() => on.toggleGroup(group.id)}
      >
        <Icon n={group.collapsed ? 'chevron-right' : 'chevron-down'} />{' '}
        {group.collapsed ? 'Expand group' : 'Collapse group'}
      </a>
      <a
        title="Keep the tabs, drop the group"
        onClick={() => on.ungroup(group.id)}
      >
        <Icon n="x" /> Ungroup
      </a>
      <a
        title="Close every tab in this group"
        onClick={() => on.closeGroup(group.id)}
      >
        <Icon n="x-circle" /> Close group
      </a>
    </>
  ) : null;
