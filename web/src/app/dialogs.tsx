import {
  CmPop,
  CommitsDialog,
  ConfirmDialog,
  CtxPop,
  DeleteCommentDialog,
  EditCommentDialog,
  EditPrDialog,
  HideCommentDialog,
  MetaDialog,
  ReactPop,
  RepoPickDialog,
  ReviewDialog,
  TokenDialog,
} from '../components/Dialogs';
import { ProfPop } from '../components/Overlays';
import { closeDlg, errMsg } from './actions';
import { appState, isOwnPr, REACTS } from './core';
import { pendList } from './diff';
import { setSlot } from './frame';
import { commitList, commitsDialogProps, setFr, sinceReview } from './mergebox';
import { metaSave } from './meta';
import { repoPickSave } from './repopick';
import { oauthGo, tokenSave } from './token';

import type { CpHandlers } from '../components/Merge';

// Dialogs and popups are plain state (S.dlg / S.pop) painted by Preact: dialogs into #dlg (repainted with every page render), popups into their own host on <body>.
export const paintDlg = () => setSlot('dlg', <Dialogs />);

const cpOn: CpHandlers = {
  close: () => closeDlg(),
  all: () => setFr(null),
  since: () => {
    const sr = sinceReview(appState.bundle!);

    if (sr?.n) {
      setFr({ a: sr.at + 1, b: commitList(appState.bundle!).length - 1 });
    }
  },
  save: () => {
    if (appState.cpick) {
      setFr({ ...appState.cpick });
    }
  },
  filter: event => {
    appState.cfilter = (event.target as HTMLInputElement).value;
    paintDlg();
  },
  pick: (event, index) => {
    event.preventDefault();
    const frRange = appState.cpick;

    appState.cpick =
      !frRange || frRange.a !== frRange.b
        ? { a: index, b: index }
        : { a: Math.min(frRange.a, index), b: Math.max(frRange.b, index) };

    paintDlg();
  },
};

export function Dialogs() {
  const dlg = appState.dlg;

  if (!dlg) {
    return null;
  }

  const close = () => closeDlg();

  const ok = () => {
    if (
      dlg.k !== 'commits' &&
      dlg.k !== 'token' &&
      dlg.k !== 'repos' &&
      dlg.k !== 'meta'
    ) {
      dlg.ok();
    }
  };

  switch (dlg.k) {
    case 'commits':
      return <CommitsDialog {...commitsDialogProps()} on={cpOn} />;
    case 'token':
      return (
        <TokenDialog
          text={appState.tokenText || ''}
          input={event => {
            appState.tokenText = (
              event.currentTarget as HTMLInputElement
            ).value;
          }}
          code={appState.oauth?.code || ''}
          err={appState.oauth?.err || ''}
          go={oauthGo}
          close={close}
          save={tokenSave}
        />
      );
    case 'repos': {
      const rp = appState.rpick!;

      return (
        <RepoPickDialog
          repos={rp.all}
          on={new Set(rp.on)}
          q={rp.q}
          err={rp.err}
          close={close}
          save={repoPickSave}
          toggle={name => {
            rp.on = rp.on.includes(name)
              ? rp.on.filter(text => text !== name)
              : [...rp.on, name];

            paintDlg();
          }}
          all={on => {
            const query = rp.q.toLowerCase();

            const vis = (rp.all || [])
              .map(repoSummary => repoSummary.full_name)
              .filter(name => name.toLowerCase().includes(query));

            rp.on = on
              ? [...new Set([...rp.on, ...vis])]
              : rp.on.filter(name => !vis.includes(name));

            paintDlg();
          }}
          input={event => {
            rp.q = (event.currentTarget as HTMLInputElement).value;
            paintDlg();
          }}
        />
      );
    }
    case 'meta': {
      const meta = appState.meta!;

      return (
        <MetaDialog
          field={meta.field}
          items={meta.items}
          on={meta.on}
          q={meta.q}
          err={meta.err}
          busy={meta.busy}
          close={close}
          save={metaSave}
          pick={id => {
            meta.on =
              meta.field === 'milestone'
                ? id
                  ? [id]
                  : []
                : meta.on.includes(id)
                  ? meta.on.filter(text => text !== id)
                  : [...meta.on, id];

            paintDlg();
          }}
          input={event => {
            meta.q = (event.currentTarget as HTMLInputElement).value;
            paintDlg();
          }}
        />
      );
    }
    case 'review': {
      const count = pendList().length;

      return (
        <ReviewDialog
          ph={
            count
              ? `Leave a review comment (${count} line comment${count === 1 ? '' : 's'} will be included)`
              : 'Leave a review comment (required unless approving)'
          }
          ev={dlg.ev}
          own={isOwnPr()}
          onEv={value => {
            dlg.ev = value;
            paintDlg();
          }}
          err={errMsg('review')}
          close={close}
          ok={ok}
        />
      );
    }

    case 'editpr':
      return (
        <EditPrDialog
          title={dlg.title}
          onTitle={value => {
            dlg.title = value;
          }}
          err={errMsg('editpr')}
          close={close}
          ok={ok}
        />
      );
    case 'confirm':
      return (
        <ConfirmDialog
          title={dlg.title}
          text={dlg.text}
          label={dlg.label}
          danger={dlg.danger}
          close={close}
          ok={ok}
        />
      );
    case 'editc':
      return <EditCommentDialog err={errMsg('editc')} close={close} ok={ok} />;
    case 'delc':
      return <DeleteCommentDialog err={errMsg('delc')} close={close} ok={ok} />;
    case 'hidec':
      return (
        <HideCommentDialog
          reasons={dlg.reasons}
          reason={appState.hideReason || 'OUTDATED'}
          pick={event => {
            appState.hideReason = (
              event.currentTarget as HTMLSelectElement
            ).value;

            paintDlg();
          }}
          err={errMsg('hidec')}
          close={close}
          ok={ok}
        />
      );
    default:
      return null;
  }
}

function Pops() {
  const pop = appState.pop;

  if (!pop) {
    return null;
  }

  if (pop.k === 'cm') {
    return <CmPop {...pop} />;
  }

  if (pop.k === 'ctx') {
    return <CtxPop {...pop} />;
  }

  if (pop.k === 'prof') {
    return <ProfPop {...pop} />;
  }

  return (
    <ReactPop
      x={pop.x}
      y={pop.y}
      reacts={REACTS as [string, string][]}
      pick={pop.pick}
    />
  );
}

const paintPop = () => setSlot('pop', <Pops />);

export function openPop(nonNullable: NonNullable<typeof appState.pop>) {
  appState.pop = nonNullable;
  paintPop();
}

export function closePop() {
  if (!appState.pop) {
    return;
  }

  appState.pop = null;
  paintPop();
}

// Whatever opens a popup stops its own click, so any later click (inside or outside) dismisses it.

// Clicking the dimmed area outside a dialog closes it. Press and release must both land there, so selecting text and letting go outside does not.
let downOn: EventTarget | null = null;

document.addEventListener(
  'mousedown',
  event => {
    downOn = event.target;
  },
  true,
);

document.addEventListener(
  'click',
  event => {
    const element = event.target as HTMLElement;

    if (appState.dlg && element === downOn && element.id === 'dlgbg') {
      closeDlg();
    }
  },
  true,
);
