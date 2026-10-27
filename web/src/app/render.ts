import { S } from './core';
import { openPr, openRepo } from './nav';

export const go = (n) => { const t = S.hi + n; if (t < 0 || t >= S.hist.length) return; S.hi = t; (S.hist[t].startsWith('repo:') ? openRepo(S.hist[t].slice(5), { nav: true }) : openPr(S.hist[t], { nav: true })); };
