import { avatar, icon, when } from '../app/core';
import type { Person } from '../types';
import { Raw } from './html';

// Shorthands for the pre-built HTML helpers so templates read like the markup they produce.
export const I = (name: string, size?: number, cls?: string) => Raw(icon(name, size, cls));
export const Av = (u?: Person | null, s = 40) => Raw(avatar(u, s));
export const When = (t: string) => Raw(when(t));
export const SP = ' ';

export const Icon = ({ n, s = 16, c = '' }: { n: string; s?: number; c?: string }) => (
  <svg class={`octicon ${c}`} viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true" dangerouslySetInnerHTML={{ __html: (window.OCTICONS || {})[n] || '' }} />
);
