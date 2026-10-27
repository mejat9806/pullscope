import { whenParts } from '../app/core';
import type { Person } from '../types';

// Shorthands so templates read like the markup they produce; all of them render in a live tree and through html().
export const I = (name: string, size?: number, cls?: string) => <Icon n={name} s={size} c={cls} />;
export const Av = (u?: Person | null, s = 40) => <Avatar u={u} s={s} />;
export const When = (t: string, lead?: string) => <WhenText t={t} lead={lead} />;
export const SP = ' ';

export const Icon = ({ n, s = 16, c = '' }: { n: string; s?: number; c?: string }) => (
  <svg class={`octicon ${c}`} viewBox={`0 0 ${s} ${s}`} width={s} height={s} aria-hidden="true" dangerouslySetInnerHTML={{ __html: (window.OCTICONS || {})[n + (s === 24 ? '-24' : '')] || '' }} />
);

export const Avatar = ({ u, s = 40 }: { u?: Person | null; s?: number }) => (
  <img class="av" src={`${u?.avatar_url || ''}${u?.avatar_url ? (u.avatar_url.includes('?') ? '&' : '?') + 's=' + s * 2 : ''}`} width={s} height={s} alt={`@${u?.login || 'ghost'}`} style="border-radius:50%;display:block" />
);

export const WhenText = ({ t, lead }: { t: string; lead?: string }) => { const w = whenParts(t, lead); return <span title={w.title}>{w.text}</span>; };

// Pre-built HTML (markdown bodies, diff tables) that a tab still builds as a string. It lives in a layout-neutral wrapper.
