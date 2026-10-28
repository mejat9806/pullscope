// Page zoom (Ctrl/⌘ + wheel, Ctrl/⌘ + / - / 0). Uses the webview's native zoom so layout and popup coordinates stay correct.
const MIN = 0.5;
const MAX = 2.5;
const KEY = 'zoom';

let level = 1;

const view = () => window.__TAURI__?.webview?.getCurrentWebview?.();

const apply = (zoom: number) => {
  level = Math.min(MAX, Math.max(MIN, Math.round(zoom * 100) / 100));

  view()
    ?.setZoom(level)
    .catch(() => {
      /* zoom unavailable */
    });

  try {
    localStorage.setItem(KEY, String(level));
  } catch {
    /* storage unavailable */
  }
};

export const restoreZoom = () => {
  let saved = 1;

  try {
    saved = parseFloat(localStorage.getItem(KEY) || '1');
  } catch {
    /* storage unavailable */
  }

  if (saved && saved !== 1) {
    apply(saved);
  }
};

export const zoomWheel = (event: WheelEvent) => {
  if (!(event.ctrlKey || event.metaKey) || !event.deltaY) {
    return;
  }

  event.preventDefault();
  apply(level * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
};

export const zoomKey = (event: KeyboardEvent) => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return;
  }

  if (event.key === '=' || event.key === '+') {
    apply(level * 1.1);
  } else if (event.key === '-') {
    apply(level / 1.1);
  } else if (event.key === '0') {
    apply(1);
  } else {
    return;
  }

  event.preventDefault();
};
