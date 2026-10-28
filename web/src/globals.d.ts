// Globals the page gets from script tags (vendor/*.js, icons.js) and the Tauri runtime.
interface EditorHandle { getMarkdown(): string; setMarkdown?(md: string): void; focus(): void; destroy(): void; el?: HTMLElement }
interface EditorOptions { value?: string; placeholder?: string; people?: string[]; onChange?: (md: string) => void; onSubmit?: () => void }
interface TauriCore { invoke<K extends keyof import('./types').Commands>(cmd: K, args?: Record<string, unknown>): Promise<import('./types').Commands[K]> }
interface TauriEvent { listen<T = unknown>(name: string, cb: (e: { payload: T }) => void): Promise<() => void> }
interface UpdateHandle { version: string; downloadAndInstall(): Promise<void> }
interface Window {
  __TAURI__?: { core: TauriCore; event?: TauriEvent; updater?: { check(): Promise<UpdateHandle | null> }; process: { relaunch(): Promise<void> }; window?: { getCurrentWindow?: () => { toggleMaximize?: () => void; startDragging?: () => void } | undefined }; webview?: { getCurrentWebview?: () => { setZoom(factor: number): Promise<void> } | undefined } };
  OCTICONS?: Record<string, string>;
  createEditor?: (host: Element, opts?: EditorOptions) => EditorHandle;
  hlLine?: (text: string, path: string) => string | null;
  hljs?: unknown;
}
