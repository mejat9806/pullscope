import { I } from './ui';

export const ToTop = ({ hidden, onClick }: { hidden: boolean; onClick: () => void }) =>
  <button id="totop" title="Back to top" aria-label="Back to top" hidden={hidden} onClick={onClick}>{I('chevron-up')}</button>;
