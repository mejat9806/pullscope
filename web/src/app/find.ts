// Find in the page (⌘F / Ctrl+F). The webview has no built-in find bar, so this one searches the visible text and
// paints matches with the CSS Custom Highlight API, which leaves the Preact-managed DOM untouched.
const MATCH_LIMIT = 2000;

const SKIPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
]);

type HighlightRegistry = Map<string, unknown>;

let bar: HTMLElement | null = null;
let input: HTMLInputElement | null = null;
let counter: HTMLElement | null = null;
let matches: Range[] = [];
let current = -1;
let searchedFor = '';

const registry = (): HighlightRegistry | undefined =>
  (CSS as unknown as { highlights?: HighlightRegistry }).highlights;

const paint = () => {
  const highlights = registry();

  const HighlightClass = (
    window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }
  ).Highlight;

  if (!highlights || !HighlightClass) {
    return;
  }

  highlights.delete('find-all');
  highlights.delete('find-current');

  if (matches.length) {
    highlights.set('find-all', new HighlightClass(...matches));
  }

  if (matches[current]) {
    highlights.set('find-current', new HighlightClass(matches[current]));
  }
};

const showCount = () => {
  if (!counter) {
    return;
  }

  counter.textContent = matches.length
    ? `${current + 1}/${matches.length}${matches.length >= MATCH_LIMIT ? '+' : ''}`
    : input?.value
      ? 'No results'
      : '';
};

const isVisible = (element: Element) =>
  (element as HTMLElement).checkVisibility
    ? (element as HTMLElement).checkVisibility()
    : true;

const collect = (query: string): Range[] => {
  const found: Range[] = [];
  const needle = query.toLowerCase();

  const walker = document.createTreeWalker(
    document.getElementById('app') ?? document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        const parent = node.parentElement;

        return parent &&
          !SKIPPED_TAGS.has(parent.tagName) &&
          node.nodeValue &&
          isVisible(parent)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    },
  );

  for (
    let node = walker.nextNode();
    node && found.length < MATCH_LIMIT;
    node = walker.nextNode()
  ) {
    const text = (node.nodeValue ?? '').toLowerCase();

    for (
      let start = text.indexOf(needle);
      start !== -1 && found.length < MATCH_LIMIT;
      start = text.indexOf(needle, start + needle.length)
    ) {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + needle.length);
      found.push(range);
    }
  }

  return found;
};

const reveal = () => {
  const range = matches[current];

  if (!range) {
    return;
  }

  range.startContainer.parentElement?.scrollIntoView({
    block: 'center',
    inline: 'nearest',
  });
};

const search = (keepPosition = false) => {
  const query = input?.value ?? '';
  searchedFor = query;
  matches = query ? collect(query) : [];

  current = matches.length
    ? keepPosition
      ? Math.min(current, matches.length - 1)
      : 0
    : -1;

  paint();
  showCount();
  reveal();
};

export const findStep = (direction: 1 | -1) => {
  const stale = matches.some(range => !range.startContainer.isConnected);

  if (input?.value !== searchedFor || stale) {
    search(true);
  }

  if (!matches.length) {
    return;
  }

  current = (current + direction + matches.length) % matches.length;
  paint();
  showCount();
  reveal();
};

export const closeFind = () => {
  bar?.remove();
  bar = input = counter = null;
  matches = [];
  current = -1;
  registry()?.delete('find-all');
  registry()?.delete('find-current');
};

const button = (label: string, title: string, onClick: () => void) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.addEventListener('click', onClick);

  return element;
};

export const openFind = () => {
  if (bar && input) {
    input.focus();
    input.select();

    return;
  }

  bar = document.createElement('div');
  bar.className = 'findbar';
  input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Find in page';
  input.setAttribute('aria-label', 'Find in page');
  counter = document.createElement('span');
  counter.className = 'findbar-count';
  input.addEventListener('input', () => search());

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      findStep(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeFind();
    }
  });

  bar.append(
    input,
    counter,
    button('↑', 'Previous match (Shift+Enter)', () => findStep(-1)),
    button('↓', 'Next match (Enter)', () => findStep(1)),
    button('✕', 'Close (Esc)', closeFind),
  );

  document.body.append(bar);

  const selected = window.getSelection()?.toString().trim() ?? '';

  if (selected && selected.length < 100 && !selected.includes('\n')) {
    input.value = selected;
    search();
  }

  input.focus();
  input.select();
};
