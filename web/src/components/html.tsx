import type { VNode } from 'preact';
import { renderToString } from 'preact-render-to-string';

// Pre-built HTML (icons, markdown bodies) can't be placed in JSX without a wrapper element, so it
// goes in as a private-use marker that html() swaps back after rendering.
const OPEN = '', CLOSE = '';
let chunks: string[] = [];

export const Raw = (s: string) => { chunks.push(s); return `${OPEN}${chunks.length - 1}${CLOSE}`; };

export const html = (node: VNode): string => {
  const out = renderToString(node).replace(/(\d+)/g, (_, i: string) => chunks[+i]);
  chunks = [];
  return out;
};
