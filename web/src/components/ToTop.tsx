import { I } from './ui';

// One floating button on every long page: down to the end while you are at the top, back to the top once you are further down.
export const ToTop = ({ dir, onClick }: { dir: '' | 'up' | 'down'; onClick: () => void }) =>
  <button id="totop" title={dir === 'down' ? 'Scroll to bottom' : 'Back to top'} aria-label={dir === 'down' ? 'Scroll to bottom' : 'Back to top'} hidden={!dir} onClick={onClick}>{I(dir === 'down' ? 'chevron-down' : 'chevron-up')}</button>;
