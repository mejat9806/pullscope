import type { ComponentChildren } from 'preact';
import { useScroller } from './req';

export interface ShellPane { key: string; children: ComponentChildren }
export interface ShellProps { nav: boolean; navHidden: boolean; sbw: number; lw: number; fade: boolean; enter: boolean; stuck: boolean; active: ShellPane; onPage: (e: MouseEvent) => void; kept: ShellPane[]; onScroll: (e: Event) => void; onGrip: (e: MouseEvent) => void; onGripReset: () => void; onScrim: () => void; side?: ComponentChildren; dlg?: ComponentChildren; notes?: ComponentChildren }

// The shown page scrolls when asked (`scroll:main`) and reports its own scrolling.
const Main = (p: { cls: string; onScroll: (e: Event) => void; onPage: (e: MouseEvent) => void; children: ComponentChildren }) => {
  const ref = useScroller('main', true);
  return <div class={p.cls} ref={ref} onScroll={p.onScroll}><div id="page" style="display:contents" onClick={p.onPage}>{p.children}</div></div>;
};

// The frame around every view: the sidebar host, its grip, the mobile scrim, the page and the parked pages of other open tabs.
// All pages share one keyed list, so a tab moving between parked and shown keeps its DOM. A parked tab keeps the very vnode it last rendered, so Preact skips it and its DOM (scroll, open editors) stays as it was.
export const Shell = (p: ShellProps) => (
  <>
    <div class={`shell ${p.nav ? 'nav-open' : ''} ${p.navHidden ? 'nav-hidden' : ''}${p.enter ? ' entering' : ''}`} style={`--sbw:${p.sbw}px;--lw:${p.lw}%`}>
      <div id="side" style="display:contents">{p.side}</div>
      <div class="sb-grip" id="sbgrip" title="Drag to resize · double-click to reset" onMouseDown={p.onGrip} onDblClick={p.onGripReset}></div>
      <div class="scrim" id="scrim" onClick={p.onScrim}></div>
      {[p.active, ...p.kept].map((k, i) => i === 0
        ? <Main key={k.key} cls={`main${p.fade ? ' tab-in' : ''}${p.stuck ? ' stuck' : ''}`} onScroll={p.onScroll} onPage={p.onPage}>{k.children}</Main>
        : <div class="main-off" key={k.key} style="display:none"><div style="display:contents">{k.children}</div></div>)}
    </div>
    <div id="dlg" style="display:contents">{p.dlg}</div>
    <div id="notehost" style="display:contents">{p.notes}</div>
  </>
);
