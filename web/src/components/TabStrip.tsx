import type { RecentEntry, Tab } from '../types';
import { Icon } from './ui';

export interface TabHandlers {
  open: (i: number) => void; aux: (e: MouseEvent, i: number) => void; down: (e: MouseEvent, i: number) => void; close: (e: MouseEvent, i: number) => void
  add: (e: MouseEvent) => void; fresh: (ref: string) => void; home: () => void; reopen: () => void
}

export interface TabStripProps { tabs: Tab[]; cur: string; recents: RecentEntry[]; menu: boolean; menuAt: { top: number; left: number } | null; drag: { from: number; to: number; dx: number; w: number } | null; closedFirst: string | null; on: TabHandlers }

// While a tab is dragged it follows the pointer and the tabs it passes slide aside by its width.
const tabShift = (d: TabStripProps['drag'], i: number) => !d ? undefined : i === d.from ? `transform:translateX(${d.dx}px)` : d.from < d.to && i > d.from && i <= d.to ? `transform:translateX(-${d.w}px)` : d.from > d.to && i < d.from && i >= d.to ? `transform:translateX(${d.w}px)` : undefined;

export function TabStrip({ tabs, cur, recents, menu, menuAt, drag, closedFirst, on }: TabStripProps) {
  return (
    <div class="ptabs">
      {tabs.map((t, i) => (
        <div class={`ptab ${t.ref === cur ? 'on' : ''}${drag && drag.from === i ? ' drag' : ''}`} style={tabShift(drag, i)} data-tab={i} onClick={(e) => { if ((e.target as HTMLElement).closest(".pt-x")) return; on.open(i); }} onAuxClick={(e) => on.aux(e, i)} onMouseDown={(e) => on.down(e, i)} title={t.ref + ' · ' + t.title}>
          <span class={`rc-i ${t.state}`}><Icon n={t.icon} /></span>
          <span class="pt-t"><i>{t.ref.split('/').pop()}</i>{' '}{t.title}</span>
          {t.dot && <span class="pt-dot"></span>}
          <button class="pt-x" data-tabx={i} onClick={(e) => on.close(e, i)} aria-label="Close tab"><Icon n={'x'} /></button>
        </div>
      ))}
      <button class="pt-add" id="tabadd" onClick={on.add} title="New tab (⌘T)" aria-label="New tab"><Icon n={'plus'} />{tabs.length < 2 && <span>New tab</span>}</button>
      {menu && (
        <div class="pt-menu" style={menuAt ? `top:${menuAt.top}px;left:${menuAt.left}px;margin-top:0` : undefined}>
          <a data-tabhome="" onClick={on.home}><Icon n={'home'} /> Home</a>
          {recents.length > 0 && <h6>Recent</h6>}
          {recents.map((r) => (
            <a data-tabnew={r.ref} onClick={() => on.fresh(r.ref)}><span class={`rc-i ${r.state}`}><Icon n={r.icon} /></span><span class="pt-mt"><i>{r.ref}</i>{' '}{r.title}</span></a>
          ))}
          {closedFirst !== null && <><h6>Closed</h6><a data-tabreopen="" onClick={on.reopen}><Icon n={'clock'} /> Reopen {closedFirst} <kbd>⌘⇧T</kbd></a></>}
        </div>
      )}
    </div>
  );
}

