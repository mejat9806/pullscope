import { AcPop, BpPop, FxLayer } from '../components/Overlays';
import { setSlot } from './frame';

import type { AcPopProps, BpPopProps, Fx } from '../components/Overlays';

// Floating layers that belong to no page: the address-bar suggestions, the branch picker and the click effects.
// They are plain state, painted into one host on <body>.
export const OV: { ac: AcPopProps | null; bp: BpPopProps | null; fx: Fx[] } = {
  ac: null,
  bp: null,
  fx: [],
};

export const paintOv = () =>
  setSlot(
    'ovl',
    <>
      {OV.ac && <AcPop {...OV.ac} />}
      {OV.bp && <BpPop {...OV.bp} />}
      <FxLayer items={OV.fx} drop={fxDrop} />
    </>,
  );

let fxId = 0;

export function fxDrop(id: number) {
  OV.fx = OV.fx.filter(value => value.id !== id);
  paintOv();
}

export function fxAdd(value: DistributiveOmit<Fx, 'id'>, ms = 0) {
  const id = ++fxId;
  OV.fx = [...OV.fx, { ...value, id } as Fx];
  paintOv();

  if (ms) {
    setTimeout(() => fxDrop(id), ms);
  }
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;
