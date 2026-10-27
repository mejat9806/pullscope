import type { RecentEntry, Tab } from '../types';
import { html, Raw } from './html';

type Icon = (name: string, size?: number) => string;

export interface TabStripProps { tabs: Tab[]; cur: string; recents: RecentEntry[]; menu: boolean; closedFirst: string | null; icon: Icon }

export function TabStrip({ tabs, cur, recents, menu, closedFirst, icon }: TabStripProps) {
  return (
    <div class="ptabs">
      {tabs.map((t, i) => (
        <div class={`ptab ${t.ref === cur ? 'on' : ''}`} data-tab={i} title={t.ref + ' · ' + t.title}>
          <span class={`rc-i ${t.state}`}>{Raw(icon(t.icon))}</span>
          <span class="pt-t"><i>{t.ref.split('/').pop()}</i>{' '}{t.title}</span>
          {t.dot && <span class="pt-dot"></span>}
          <button class="pt-x" data-tabx={i} aria-label="Close tab">{Raw(icon('x'))}</button>
        </div>
      ))}
      <button class="pt-add" id="tabadd" title="New tab (⌘T)" aria-label="New tab">{Raw(icon('plus'))}{tabs.length < 2 && <span>New tab</span>}</button>
      {menu && (
        <div class="pt-menu">
          <a data-tabhome="">{Raw(icon('home'))} Home</a>
          {recents.length > 0 && <h6>Recent</h6>}
          {recents.map((r) => (
            <a data-tabnew={r.ref}><span class={`rc-i ${r.state}`}>{Raw(icon(r.icon))}</span><span class="pt-mt"><i>{r.ref}</i>{' '}{r.title}</span></a>
          ))}
          {closedFirst !== null && <><h6>Closed</h6><a data-tabreopen="">{Raw(icon('clock'))} Reopen {closedFirst} <kbd>⌘⇧T</kbd></a></>}
        </div>
      )}
    </div>
  );
}

export const tabStripHtml = (p: TabStripProps) => html(<TabStrip {...p} />);
