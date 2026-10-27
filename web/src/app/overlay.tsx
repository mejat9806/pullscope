import { render as paint } from 'preact';
import { AcPop, BpPop, FxLayer } from '../components/Overlays';
import type { AcPopProps, BpPopProps, Fx } from '../components/Overlays';

// Floating layers that belong to no page: the address-bar suggestions, the branch picker and the click effects.
// They are plain state, painted into one host on <body>.
export const OV: { ac: AcPopProps | null; bp: BpPopProps | null; fx: Fx[] } = { ac: null, bp: null, fx: [] };

let host: HTMLElement | null = null;
export function paintOv() {
  if (!host) { host = document.createElement('div'); host.id = 'ovl'; host.style.display = 'contents'; document.body.appendChild(host); }
  paint(<>{OV.ac && <AcPop {...OV.ac} />}{OV.bp && <BpPop {...OV.bp} />}<FxLayer items={OV.fx} drop={fxDrop} /></>, host);
}

let fxId = 0;
export function fxDrop(id: number) { OV.fx = OV.fx.filter((f) => f.id !== id); paintOv(); }
export function fxAdd(f: DistributiveOmit<Fx, 'id'>, ms = 0) { const id = ++fxId; OV.fx = [...OV.fx, { ...f, id } as Fx]; paintOv(); if (ms) setTimeout(() => fxDrop(id), ms); }
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
