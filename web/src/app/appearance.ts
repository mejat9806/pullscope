// Look-and-feel settings (font, text size, code size, density). Kept in localStorage and applied as CSS variables on <html>.
export type FontChoice = 'system' | 'classic' | 'serif' | 'rounded' | 'mono';

export interface Appearance {
  font: FontChoice;
  textSize: number;
  codeSize: number;
  dense: boolean;
}

export const FONT_STACKS: Record<FontChoice, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, "Segoe UI", "Noto Sans", sans-serif',
  classic: '"Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif',
  serif: '"Iowan Old Style", "Charter", Georgia, "Times New Roman", serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  system: 'System',
  classic: 'Classic',
  serif: 'Serif',
  rounded: 'Rounded',
  mono: 'Monospace',
};

export const TEXT_SIZES = [90, 100, 110, 120, 135];

export const CODE_SIZES = [11, 12, 13, 14, 16];

const KEY = 'appearance';

const DEFAULTS: Appearance = {
  font: 'system',
  textSize: 100,
  codeSize: 12,
  dense: false,
};

const load = (): Appearance => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(KEY) ?? 'null',
    ) as Partial<Appearance> | null;

    const legacyDense = localStorage.getItem('dense') === '1';

    return {
      ...DEFAULTS,
      dense: legacyDense,
      ...saved,
      font: saved?.font && saved.font in FONT_STACKS ? saved.font : 'system',
    };
  } catch {
    return { ...DEFAULTS };
  }
};

let current = load();

export const getAppearance = (): Appearance => ({ ...current });

const apply = () => {
  const root = document.documentElement;
  root.style.setProperty('--ui-font', FONT_STACKS[current.font]);
  root.style.setProperty('--text-scale', String(current.textSize / 100));
  root.style.setProperty('--code-size', `${current.codeSize}px`);
  root.classList.toggle('dense', current.dense);
};

export const setAppearance = (patch: Partial<Appearance>) => {
  current = { ...current, ...patch };
  apply();

  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage unavailable */
  }
};

export const resetAppearance = () => {
  setAppearance({ ...DEFAULTS });
};

export const restoreAppearance = apply;
