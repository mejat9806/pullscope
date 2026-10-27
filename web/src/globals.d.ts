// Browser globals the page gets from script tags and the Tauri runtime, plus loose DOM typing for code written against querySelector results.
interface Window {
  __TAURI__: any;
  OCTICONS: Record<string, string>;
  createEditor: (host: Element, opts?: any) => any;
  hlLine: any;
  hljs: any;
  [k: string]: any;
}
interface EventTarget { closest(sel: string): any; id: string; value: any; dataset: DOMStringMap; classList: DOMTokenList; matches(sel: string): boolean; contains(n: any): boolean; blur(): void; isConnected: boolean; [k: string]: any }
interface Event { key: string; button: number; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; detail: number; clientX: number; clientY: number; dataTransfer: any; relatedTarget: any; [k: string]: any }
interface Element {
  dataset: DOMStringMap; value: any; style: CSSStyleDeclaration; focus(o?: any): void; blur(): void; click(): void; hidden: boolean; checked: boolean; disabled: boolean;
  innerText: string; offsetHeight: number; offsetWidth: number; offsetTop: number; selectionStart: number; select(): void; setSelectionRange(a: number, b: number): void; scrollTo(o?: any): void; title: string; href: string; src: string; open: boolean; type: string; name: string; placeholder: string;
  addEventListener(type: string, listener: (e: any) => any, opts?: any): void; [k: string]: any;
}
interface ParentNode { querySelector(sel: string): any; querySelectorAll(sel: string): NodeListOf<any> }
interface Document { querySelector(sel: string): any; querySelectorAll(sel: string): NodeListOf<any>; activeElement: any }
interface HTMLElement { [k: string]: any }
