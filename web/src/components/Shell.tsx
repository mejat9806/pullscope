import { useEffect } from 'preact/hooks';

import { useScroller } from './req';

import type { ComponentChildren } from 'preact';

export interface ShellPane {
  key: string;
  children: ComponentChildren;
}

export interface ShellProps {
  nav: boolean;
  navHidden: boolean;
  sbw: number;
  lw: number;
  fade: boolean;
  enter: boolean;
  stuck: boolean;
  active: ShellPane;
  onPage: (event: MouseEvent) => void;
  kept: ShellPane[];
  onScroll: (event: Event) => void;
  onMeasure: (el: HTMLElement) => void;
  onGrip: (event: MouseEvent) => void;
  onGripReset: () => void;
  onScrim: () => void;
  side?: ComponentChildren;
  dlg?: ComponentChildren;
  notes?: ComponentChildren;
}

// The shown page scrolls when asked (`scroll:main`) and reports its own scrolling.
const Main = (props: {
  cls: string;
  onScroll: (event: Event) => void;
  onMeasure: (el: HTMLElement) => void;
  onPage: (event: MouseEvent) => void;
  children: ComponentChildren;
}) => {
  const ref = useScroller('main', true);

  // A page that has not been scrolled yet still needs its scroll button: re-measure when its size or content changes.
  useEffect(() => {
    const el = ref.current as HTMLElement | null;

    if (!el) {
      return;
    }

    let raf = 0;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => props.onMeasure(el));
    };

    const ro = new ResizeObserver(measure);
    const mo = new MutationObserver(measure);
    ro.observe(el);
    mo.observe(el, { childList: true, subtree: true });
    measure();

    return () => {
      ro.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div class={props.cls} ref={ref} onScroll={props.onScroll}>
      <div id="page" style="display:contents" onClick={props.onPage}>
        {props.children}
      </div>
    </div>
  );
};

// The frame around every view: the sidebar host, its grip, the mobile scrim, the page and the parked pages of other open tabs.
// All pages share one keyed list, so a tab moving between parked and shown keeps its DOM. A parked tab keeps the very vnode it last rendered, so Preact skips it and its DOM (scroll, open editors) stays as it was.
export const Shell = (props: ShellProps) => (
  <>
    <div
      class={`shell ${props.nav ? 'nav-open' : ''} ${props.navHidden ? 'nav-hidden' : ''}${props.enter ? ' entering' : ''}`}
      style={`--sbw:${props.sbw}px;--lw:${props.lw}%`}
    >
      <div id="side" style="display:contents">
        {props.side}
      </div>
      <div
        class="sb-grip"
        id="sbgrip"
        title="Drag to resize · double-click to reset"
        onMouseDown={props.onGrip}
        onDblClick={props.onGripReset}
      ></div>
      <div class="scrim" id="scrim" onClick={props.onScrim}></div>
      {[props.active, ...props.kept].map((shellPane, index) =>
        index === 0 ? (
          <Main
            key={shellPane.key}
            cls={`main${props.fade ? ' tab-in' : ''}${props.stuck ? ' stuck' : ''}`}
            onScroll={props.onScroll}
            onMeasure={props.onMeasure}
            onPage={props.onPage}
          >
            {shellPane.children}
          </Main>
        ) : (
          <div class="main-off" key={shellPane.key} style="display:none">
            <div style="display:contents">{shellPane.children}</div>
          </div>
        ),
      )}
    </div>
    <div id="dlg" style="display:contents">
      {props.dlg}
    </div>
    <div id="notehost" style="display:contents">
      {props.notes}
    </div>
  </>
);
