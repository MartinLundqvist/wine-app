/// <reference types="vite/client" />

declare module "d3-scale" {
  interface ScaleLinear {
    domain(domain: number[]): this;
    range(range: number[]): this;
    clamp(clamp: boolean): this;
    (value: number): number;
  }
  export function scaleLinear(): ScaleLinear;
}

declare module "d3-shape" {
  export function lineRadial<Datum>(): LineRadial<Datum>;
  export interface LineRadial<Datum> {
    angle(accessor: (d: Datum) => number): this;
    radius(accessor: (d: Datum) => number): this;
    curve(curve: unknown): this;
    (data: Datum[]): string | null;
  }
  export function curveLinearClosed(): unknown;
}
