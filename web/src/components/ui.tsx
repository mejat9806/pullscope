import { whenParts } from '../app/core';

import type { Person } from '../types';

// Shorthands so templates read like the markup they produce; all of them render in a live tree and through html().
export const renderIcon = (name: string, size?: number, cls?: string) => (
  <Icon n={name} s={size} c={cls} />
);

export const Av = (person?: Person | null, size = 40) => (
  <Avatar u={person} s={size} />
);

export const When = (text: string, lead?: string) => (
  <WhenText t={text} lead={lead} />
);

export const SP = ' ';

export const Icon = ({
  n: name,
  s: size = 16,
  c: color = '',
}: {
  n: string;
  s?: number;
  c?: string;
}) => (
  <svg
    class={`octicon ${color}`}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    height={size}
    aria-hidden="true"
    dangerouslySetInnerHTML={{
      __html: (window.OCTICONS || {})[name + (size === 24 ? '-24' : '')] || '',
    }}
  />
);

export const Avatar = ({
  u: person,
  s: size = 40,
}: {
  u?: Person | null;
  s?: number;
}) => (
  <img
    class="av"
    loading="lazy"
    decoding="async"
    src={`${person?.avatar_url || ''}${person?.avatar_url ? `${person.avatar_url.includes('?') ? '&' : '?'}s=${size * 2}` : ''}`}
    width={size}
    height={size}
    alt={`@${person?.login || 'ghost'}`}
    style="border-radius:50%;display:block"
  />
);

export const WhenText = ({ t: text, lead }: { t: string; lead?: string }) => {
  const item = whenParts(text, lead);

  return <span title={item.title}>{item.text}</span>;
};

// Pre-built HTML (markdown bodies, diff tables) that a tab still builds as a string. It lives in a layout-neutral wrapper.
