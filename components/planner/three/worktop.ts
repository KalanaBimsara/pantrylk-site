import * as THREE from "three";
import type { TopEdge } from "@/lib/planner/types";

/** One texture tile covers this many millimetres of worktop. */
const TILE = 1500;

type P = [number, number]; // (z, y) in the section profile

function arc(cz: number, cy: number, r: number, a0: number, a1: number, steps: number): P[] {
  const out: P[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Cross-section of a worktop, back at -depth/2, front edge profiled at +depth/2, y from 0 to t. */
export function topProfile(depth: number, t: number, edge: TopEdge): P[] {
  const b = -depth / 2, f = depth / 2;
  if (edge === "bevel") {
    const c = Math.min(10, t * 0.4);
    return [[b, 0], [f, 0], [f, t - c], [f - c, t], [b, t]];
  }
  if (edge === "bullnose") {
    const r = t / 2;
    return [[b, 0], ...arc(f - r, r, r, -Math.PI / 2, Math.PI / 2, 14), [b, t]];
  }
  if (edge === "eased") {
    const r = Math.min(4, t / 4);
    return [[b, 0], ...arc(f - r, r, r, -Math.PI / 2, 0, 3), ...arc(f - r, t - r, r, 0, Math.PI / 2, 3), [b, t]];
  }
  return [[b, 0], [f, 0], [f, t], [b, t]];
}

export const boxProfile = (depth: number, h: number): P[] => [[-depth / 2, 0], [depth / 2, 0], [depth / 2, h], [-depth / 2, h]];

/** Extrude a convex profile along x (centred on 0), with world-scale UVs. */
export function slab(len: number, profile: P[]) {
  const pos: number[] = [];
  const uv: number[] = [];
  const x0 = -len / 2, x1 = len / 2;
  const vert = (x: number, [z, y]: P, u: number, v: number) => {
    pos.push(x, y, z);
    uv.push(u / TILE, v / TILE);
  };
  const n = profile.length;
  const top = Math.max(...profile.map((q) => q[1]));
  for (let i = 0; i < n; i++) {
    const a = profile[i], c = profile[(i + 1) % n];
    // Horizontal faces map from above; vertical ones wrap down from the top so patterns run over the edge.
    const flat = Math.abs(c[0] - a[0]) > Math.abs(c[1] - a[1]);
    const v = (p: P) => (flat ? p[0] : p[0] + (top - p[1]));
    vert(x0, a, x0, v(a)); vert(x1, a, x1, v(a)); vert(x1, c, x1, v(c));
    vert(x0, a, x0, v(a)); vert(x1, c, x1, v(c)); vert(x0, c, x0, v(c));
  }
  for (let i = 1; i < n - 1; i++) {
    const [p0, pa, pb] = [profile[0], profile[i], profile[i + 1]];
    vert(x1, p0, p0[0], p0[1]); vert(x1, pb, pb[0], pb[1]); vert(x1, pa, pa[0], pa[1]);
    vert(x0, p0, p0[0], p0[1]); vert(x0, pa, pa[0], pa[1]); vert(x0, pb, pb[0], pb[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
