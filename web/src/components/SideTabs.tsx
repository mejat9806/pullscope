import { html } from './html';

interface Props { active: string; hasRepo: boolean }

const tabClass = (on: boolean) => (on ? 'on' : '');

export function SideTabs({ active, hasRepo }: Props) {
  return (
    <div class="sb-tabs">
      <button data-side="repos" class={tabClass(active === 'repos')}>Repos</button>
      {hasRepo && <button data-side="prs" class={tabClass(active === 'prs')}>PRs</button>}
      <button data-side="recent" class={tabClass(active === 'recent')}>Recent</button>
    </div>
  );
}

export const sideTabsHtml = (props: Props) => html(<SideTabs {...props} />);
