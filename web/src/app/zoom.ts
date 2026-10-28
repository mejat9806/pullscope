// Page zoom (Ctrl/⌘ + wheel, Ctrl/⌘ + / - / 0). Uses the webview's native zoom so layout and popup coordinates stay correct.
const MIN = 0.5;
const MAX = 2.5;
const KEY = 'zoom';

let level = 1;

const view = () => window.__TAURI__?.webview?.getCurrentWebview?.();

const apply = (z: number) => {
  level = Math.min(MAX, Math.max(MIN, Math.round(z * 100) / 100));

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

export const zoomWheel = (e: WheelEvent) => {
  if (!(e.ctrlKey || e.metaKey) || !e.deltaY) {
    return;
  }

  e.preventDefault();
  apply(level * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
};

export const zoomKey = (e: KeyboardEvent) => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) {
    return;
  }

  if (e.key === '=' || e.key === '+') {
    apply(level * 1.1);
  } else if (e.key === '-') {
    apply(level / 1.1);
  } else if (e.key === '0') {
    apply(1);
  } else {
    return;
  }

  e.preventDefault();
};
