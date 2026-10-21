"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { byId, FRONT_T, FRONTS, HANDLES, TOP_Y } from "@/lib/planner/finishes";
import { frontLayout, type FrontPanel } from "@/lib/planner/geometry";
import type { Product } from "@/lib/planner/types";
import { carcassMaterial, colorMaterial, frontMaterial, handleMaterial, M, UNIT_BOX, UNIT_CYL } from "./materials";

type V3 = [number, number, number];

export function B({ p, s, m, r }: { p: V3; s: V3; m: THREE.Material; r?: V3 }) {
  return <mesh position={p} scale={s} rotation={r} geometry={UNIT_BOX} material={m} castShadow receiveShadow />;
}
export function C({ p, r, h, m, rot }: { p: V3; r: number; h: number; m: THREE.Material; rot?: V3 }) {
  return <mesh position={p} scale={[r * 2, h, r * 2]} rotation={rot} geometry={UNIT_CYL} material={m} castShadow receiveShadow />;
}

/** Eases a value toward its target every frame (door swings, drawer slides). */
function useEase(target: number, apply: (v: number) => void) {
  const v = useRef(target);
  useFrame((_, dt) => {
    const next = v.current + (target - v.current) * Math.min(1, dt * 7);
    if (Math.abs(next - v.current) > 1e-5 || Math.abs(target - v.current) > 1e-5) {
      v.current = Math.abs(target - next) < 1e-4 ? target : next;
      apply(v.current);
    }
  });
}

export type Look = { front: string; handle: string; carcass: string };

// ---------------------------------------------------------------- handles

function Handle({ id, w, h, at, orient }: { id: string; w: number; h: number; at: "top" | "bottom" | "free-l" | "free-r" | "center-top" | "center-bottom"; orient: "h" | "v" }) {
  const hd = byId(HANDLES, id);
  const m = handleMaterial(id);
  if (hd.type === "none") return null;
  if (hd.type === "gola") {
    const y = at.includes("bottom") ? -h / 2 + 12 : h / 2 - 12;
    return <B p={[0, y, FRONT_T / 2 + 0.6]} s={[w - 2, 24, 1]} m={m} />;
  }
  if (hd.type === "edge") {
    const y = at.includes("bottom") || at === "bottom" ? -h / 2 - 2 : h / 2 + 2;
    const len = Math.min(w - 40, 220);
    const x = at === "free-l" ? -w / 2 + 20 + len / 2 : at === "free-r" ? w / 2 - 20 - len / 2 : 0;
    return <B p={[x, y, FRONT_T / 2 - 4]} s={[len, 6, 26]} m={m} />;
  }
  // Point where the handle sits on the panel.
  const inset = 45;
  let x = 0, y = 0;
  if (at === "free-l") x = -w / 2 + inset;
  if (at === "free-r") x = w / 2 - inset;
  const vlen = orient === "v" ? Math.min(h - 80, h > 1000 ? 420 : 192) : 0;
  const hlen = orient === "h" ? Math.min(w - 80, w >= 600 ? 320 : 160) : 0;
  if (at === "top" || at === "free-l" || at === "free-r") y = h / 2 - inset - vlen / 2;
  if (at === "bottom") y = -h / 2 + inset + vlen / 2;
  if (at === "center-top") y = h / 2 - 40;
  if (at === "center-bottom") y = -h / 2 + 40;
  if ((at === "free-l" || at === "free-r") && h > 1300) y = 0;
  const z = FRONT_T / 2;
  if (hd.type === "knob") return <C p={[x, y, z + 14]} r={14} h={28} m={m} rot={[Math.PI / 2, 0, 0]} />;
  const len = orient === "v" ? vlen : hlen;
  const span = len - 24;
  return (
    <group position={[x, y, z]}>
      <B p={[0, 0, 32]} s={orient === "v" ? [12, len, 12] : [len, 12, 12]} m={m} />
      <B p={orient === "v" ? [0, span / 2, 15] : [span / 2, 0, 15]} s={[9, 9, 28]} m={m} />
      <B p={orient === "v" ? [0, -span / 2, 15] : [-span / 2, 0, 15]} s={[9, 9, 28]} m={m} />
    </group>
  );
}

// ---------------------------------------------------------------- fronts

function Slab({ w, h, look, kind }: { w: number; h: number; look: Look; kind: FrontPanel["kind"] }) {
  const f = byId(FRONTS, look.front);
  const fm = frontMaterial(look.front);
  if (kind === "glass") {
    const bw = 55;
    return (
      <group>
        <B p={[0, h / 2 - bw / 2, 0]} s={[w, bw, FRONT_T]} m={fm} />
        <B p={[0, -h / 2 + bw / 2, 0]} s={[w, bw, FRONT_T]} m={fm} />
        <B p={[-w / 2 + bw / 2, 0, 0]} s={[bw, h - 2 * bw, FRONT_T]} m={fm} />
        <B p={[w / 2 - bw / 2, 0, 0]} s={[bw, h - 2 * bw, FRONT_T]} m={fm} />
        <mesh position={[0, 0, 0]} scale={[w - 2 * bw, h - 2 * bw, 4]} geometry={UNIT_BOX} material={M.glass} />
      </group>
    );
  }
  if (kind === "appDoor") return <B p={[0, 0, 0]} s={[w, h, FRONT_T + 12]} m={M.steel} />;
  if (f.shaker && w > 200 && h > 200) {
    const bw = Math.min(70, w / 5, h / 5);
    return (
      <group>
        <B p={[0, 0, -3]} s={[w, h, FRONT_T - 6]} m={fm} />
        <B p={[0, h / 2 - bw / 2, 3]} s={[w, bw, 6]} m={fm} />
        <B p={[0, -h / 2 + bw / 2, 3]} s={[w, bw, 6]} m={fm} />
        <B p={[-w / 2 + bw / 2, 0, 3]} s={[bw, h - 2 * bw, 6]} m={fm} />
        <B p={[w / 2 - bw / 2, 0, 3]} s={[bw, h - 2 * bw, 6]} m={fm} />
      </group>
    );
  }
  return <B p={[0, 0, 0]} s={[w, h, FRONT_T]} m={fm} />;
}

const GAP = 3;

function Front({ f, bodyW, baseY, depth, look, open, absY }: { f: FrontPanel; bodyW: number; baseY: number; depth: number; look: Look; open: boolean; absY: number }) {
  const w = f.x1 - f.x0 - GAP, h = f.y1 - f.y0 - GAP;
  const cx = -bodyW / 2 + (f.x0 + f.x1) / 2, cy = baseY + (f.y0 + f.y1) / 2;
  const zb = depth / 2 - FRONT_T; // back face of the fronts
  const pivot = useRef<THREE.Group>(null);
  const slide = useRef<THREE.Group>(null);
  const centreAbove = absY + cy > 1050;

  const hingedTarget = !open ? 0 : f.hinge === "l" ? -1.75 : f.hinge === "r" ? 1.75 : f.hinge === "t" ? -1.6 : 1.35;
  useEase(hingedTarget, (v) => {
    if (!pivot.current) return;
    if (f.hinge === "t" || f.hinge === "b") pivot.current.rotation.x = v;
    else pivot.current.rotation.y = v;
  });
  useEase(open ? Math.min(460, depth * 0.75) : 0, (v) => {
    if (slide.current) slide.current.position.z = v;
  });

  const orient = f.kind === "drawer" || f.kind === "lift" || f.kind === "dish" || f.kind === "pull" ? "h" : "v";
  const handleAt =
    f.kind === "drawer" || f.kind === "dish" || f.kind === "pull" ? "center-top" : f.kind === "lift" ? "center-bottom"
      : f.hinge === "l" ? "free-r" : f.hinge === "r" ? "free-l" : centreAbove ? "bottom" : "top";
  const handle = <Handle id={f.kind === "appDoor" ? "bar-steel" : look.handle} w={w} h={h} at={handleAt} orient={orient} />;

  if (f.kind === "oven" || f.kind === "micro") {
    return (
      <group position={[cx, cy, zb + FRONT_T / 2]}>
        <B p={[0, 0, 0]} s={[w, h, FRONT_T]} m={M.blackGlass} />
        <B p={[0, h / 2 - 30, FRONT_T / 2 + 0.5]} s={[w, 60, 1]} m={M.darkSteel} />
        <B p={[0, h / 2 - 95, FRONT_T / 2 + 22]} s={[w - 120, 14, 14]} m={M.steel} />
        <mesh position={[0, -25, FRONT_T / 2 + 0.6]} scale={[w - 140, h - 200, 1]} geometry={UNIT_BOX} material={M.black} />
      </group>
    );
  }
  if (f.kind === "panel" || f.kind === "blind") {
    return (
      <group position={[cx, cy, zb + FRONT_T / 2]}>
        {f.kind === "blind" ? <Slab w={w} h={h} look={look} kind="door" /> : <B p={[0, 0, 0]} s={[w, h, FRONT_T]} m={M.steel} />}
        {f.kind === "panel" && [-0.3, -0.1, 0.1, 0.3].map((k) => <C key={k} p={[k * w, 0, FRONT_T / 2 + 10]} r={16} h={20} m={M.black} rot={[Math.PI / 2, 0, 0]} />)}
      </group>
    );
  }
  if (f.kind === "drawer" || f.kind === "pull") {
    const inner = depth - 70;
    return (
      <group ref={slide}>
        <group position={[cx, cy, zb + FRONT_T / 2]}>
          <Slab w={w} h={h} look={look} kind="drawer" />
          {handle}
        </group>
        <group position={[cx, cy - h / 2 + 30, zb - inner / 2]}>
          <B p={[0, 0, 0]} s={[w - 50, 14, inner]} m={M.white} />
          <B p={[-(w - 50) / 2, Math.min(h, 260) / 2 - 20, 0]} s={[12, Math.min(h, 260) - 40, inner]} m={M.white} />
          <B p={[(w - 50) / 2, Math.min(h, 260) / 2 - 20, 0]} s={[12, Math.min(h, 260) - 40, inner]} m={M.white} />
          <B p={[0, Math.min(h, 260) / 2 - 20, -inner / 2]} s={[w - 50, Math.min(h, 260) - 40, 12]} m={M.white} />
          {f.kind === "pull" && [0.25, 0.55, 0.85].map((k) => <B key={k} p={[0, (h - 60) * k, 0]} s={[w - 60, 6, inner - 20]} m={M.darkSteel} />)}
        </group>
      </group>
    );
  }
  // Hinged fronts: the pivot group sits on the hinge axis.
  const isV = f.hinge === "t" || f.hinge === "b";
  const px = isV ? cx : f.hinge === "l" ? cx - w / 2 : cx + w / 2;
  const py = f.hinge === "t" ? cy + h / 2 : f.hinge === "b" ? cy - h / 2 : 0;
  const local: V3 = [isV ? 0 : f.hinge === "l" ? w / 2 : -w / 2, isV ? (f.hinge === "t" ? -h / 2 : h / 2) : cy, FRONT_T / 2];
  return (
    <group ref={pivot} position={[px, py, zb]}>
      <group position={local}>
        <Slab w={w} h={h} look={look} kind={f.kind} />
        {handle}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- cabinets

function Sink({ w, d }: { w: number; d: number }) {
  const sw = Math.min(w - 120, 780);
  const z = -d / 2 + 310 + 20;
  return (
    <group position={[0, TOP_Y, 0]}>
      <B p={[0, 1, z]} s={[sw, 2, 440]} m={M.steel} />
      <B p={[sw > 600 ? -sw * 0.18 : 0, 1.6, z]} s={[sw > 600 ? sw * 0.58 : sw - 60, 1.4, 380]} m={M.basin} />
      {sw > 600 && <B p={[sw * 0.3, 1.6, z]} s={[sw * 0.3, 1.4, 380]} m={M.basin} />}
      <group position={[sw > 600 ? -sw * 0.18 : 0, 0, -d / 2 + 70]}>
        <C p={[0, 130, 0]} r={16} h={260} m={M.steel} />
        <B p={[0, 255, 85]} s={[22, 22, 190]} m={M.steel} />
        <B p={[38, 120, 0]} s={[60, 10, 12]} m={M.steel} />
      </group>
    </group>
  );
}

function Hob({ w, d, gas = false }: { w: number; d: number; gas?: boolean }) {
  const hw = Math.min(w - 60, w >= 800 ? 750 : 580);
  const burners: [number, number, number][] = w >= 800
    ? [[-0.32, -0.22, 75], [-0.32, 0.22, 60], [0, 0, 95], [0.32, -0.22, 60], [0.32, 0.22, 75]]
    : [[-0.25, -0.22, 75], [-0.25, 0.22, 60], [0.25, -0.22, 60], [0.25, 0.22, 85]];
  return (
    <group position={[0, TOP_Y, -d / 2 + 330]}>
      <B p={[0, 3, 0]} s={[hw, 6, 510]} m={M.blackGlass} />
      {burners.map(([x, z, r], k) => (
        <C key={k} p={[x * hw, 6.6, z * 510]} r={r} h={gas ? 18 : 0.8} m={gas ? M.black : M.darkSteel} />
      ))}
    </group>
  );
}

export function Cabinet({ p, w, d, h, look, open, mirror, absY }: { p: Product; w: number; d: number; h: number; look: Look; open: boolean; mirror: boolean; absY: number }) {
  const T = 18;
  const bodyH = h - p.plinth;
  const y = p.plinth;
  const cd = d - FRONT_T;
  const zc = -d / 2 + cd / 2;
  const side = carcassMaterial(look.carcass, look.front);
  const inner = M.white;
  const fronts = frontLayout(p, w, bodyH, mirror);
  const shelves = p.model === "open" || p.model === "doors" || p.model === "glass" || p.model === "tallDoors" || p.model === "corner" || p.model === "sink"
    ? bodyH > 1200 ? [0.2, 0.4, 0.6, 0.8] : bodyH > 500 ? [0.5] : [] : [];
  return (
    <group>
      {p.plinth > 0 && <B p={[0, p.plinth / 2, -30]} s={[w - 4, p.plinth, d - 80]} m={M.plinth} />}
      <B p={[-w / 2 + T / 2, y + bodyH / 2, zc]} s={[T, bodyH, cd]} m={side} />
      <B p={[w / 2 - T / 2, y + bodyH / 2, zc]} s={[T, bodyH, cd]} m={side} />
      <B p={[0, y + T / 2, zc]} s={[w - 2 * T, T, cd]} m={inner} />
      <B p={[0, y + bodyH - T / 2, zc]} s={[w - 2 * T, T, cd]} m={p.layer === "base" ? inner : side} />
      <B p={[0, y + bodyH / 2, -d / 2 + 4]} s={[w - 2 * T, bodyH - 2 * T, 8]} m={inner} />
      {shelves.map((k) => <B key={k} p={[0, y + bodyH * k, zc + 10]} s={[w - 2 * T - 2, T, cd - 30]} m={inner} />)}
      {p.model === "tallFridge" && <B p={[0, y + bodyH / 2, zc]} s={[w - 2 * T - 4, bodyH - 2 * T - 4, cd - 20]} m={M.white} />}
      {fronts.map((f, k) => <Front key={k} f={f} bodyW={w} baseY={y} depth={d} look={look} open={open} absY={absY} />)}
      {p.model === "sink" && <Sink w={w} d={d} />}
      {(p.model === "hob" || p.model === "hobOven") && <Hob w={w} d={d} />}
    </group>
  );
}

// ---------------------------------------------------------------- appliances

export function Hood({ w, d, y0, ceiling }: { w: number; d: number; y0: number; ceiling: number }) {
  const chimney = Math.max(0, ceiling - y0 - 300);
  return (
    <group>
      <B p={[0, 30, 0]} s={[w, 60, d]} m={M.steel} />
      <B p={[0, 30, d / 2 - 2]} s={[w - 40, 6, 4]} m={M.darkSteel} />
      <mesh position={[0, 180, -d / 2 + 160]} scale={[w * 0.42, 240, 300]} geometry={UNIT_BOX} material={M.steel} castShadow />
      <B p={[0, 300 + chimney / 2, -d / 2 + 140]} s={[260, chimney, 260]} m={M.steel} />
    </group>
  );
}

export function Appliance({ p, w, d, h, open, mirror, ceiling, y0 }: { p: Product; w: number; d: number; h: number; open: boolean; mirror: boolean; ceiling: number; y0: number }) {
  const look: Look = { front: "white-gloss", handle: "bar-steel", carcass: "white" };
  const body = p.finish === "white" ? M.white : p.finish === "black" ? M.black : M.steel;
  switch (p.model) {
    case "hood":
      return <Hood w={w} d={d} y0={y0} ceiling={ceiling} />;
    case "fridge":
    case "fridgeDouble":
      return (
        <group>
          <B p={[0, h / 2, -15]} s={[w, h, d - 30]} m={body} />
          <B p={[0, h / 2, -15]} s={[w - 30, h - 30, d - 40]} m={M.white} />
          {frontLayout(p, w, h, mirror).map((f, k) => <Front key={k} f={f} bodyW={w} baseY={0} depth={d} look={look} open={open} absY={0} />)}
        </group>
      );
    case "range":
      return (
        <group>
          <B p={[0, (h - 10) / 2, -10]} s={[w, h - 10, d - 20]} m={body} />
          <B p={[0, h - 5, 0]} s={[w, 10, d]} m={M.black} />
          <Hob w={w + 60} d={d} gas />
          {frontLayout(p, w, h - 10, mirror).map((f, k) => <Front key={k} f={f} bodyW={w} baseY={0} depth={d} look={look} open={open} absY={0} />)}
        </group>
      );
    case "washer":
      return (
        <group>
          <B p={[0, h / 2, 0]} s={[w - 4, h, d]} m={body} />
          <B p={[0, h - 60, d / 2 + 1]} s={[w - 4, 100, 2]} m={M.frame} />
          <B p={[w / 2 - 120, h - 60, d / 2 + 3]} s={[160, 50, 4]} m={M.black} />
          <mesh position={[0, h * 0.45, d / 2 + 6]} rotation={[0, 0, 0]} castShadow>
            <torusGeometry args={[200, 28, 16, 48]} />
            <primitive object={M.steel} attach="material" />
          </mesh>
          <C p={[0, h * 0.45, d / 2 + 4]} r={180} h={8} m={M.blackGlass} rot={[Math.PI / 2, 0, 0]} />
        </group>
      );
    case "microwave":
      return (
        <group>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={body} />
          <B p={[-w * 0.12, h / 2, d / 2 + 1]} s={[w * 0.66, h - 60, 2]} m={M.blackGlass} />
          <B p={[w * 0.36, h / 2, d / 2 + 1]} s={[w * 0.18, h - 60, 2]} m={M.darkSteel} />
        </group>
      );
  }
  return null;
}

// ---------------------------------------------------------------- furniture & elements

export function Furniture({ p, w, d, h, color, ceiling, y0 }: { p: Product; w: number; d: number; h: number; color?: string; ceiling: number; y0: number }) {
  const wood = M.oak;
  switch (p.model) {
    case "table":
      return (
        <group>
          <B p={[0, h - 15, 0]} s={[w, 30, d]} m={wood} />
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b], k) => <B key={k} p={[a * (w / 2 - 60), (h - 30) / 2, b * (d / 2 - 60)]} s={[50, h - 30, 50]} m={M.black} />)}
        </group>
      );
    case "roundTable":
      return (
        <group>
          <C p={[0, h - 15, 0]} r={w / 2} h={30} m={wood} />
          <C p={[0, (h - 30) / 2, 0]} r={45} h={h - 30} m={M.black} />
          <C p={[0, 10, 0]} r={w * 0.28} h={20} m={M.black} />
        </group>
      );
    case "chair":
      return (
        <group>
          <B p={[0, 450, 0]} s={[w - 20, 40, d - 60]} m={M.fabric} />
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b], k) => <B key={k} p={[a * (w / 2 - 40), 215, b * (d / 2 - 50)]} s={[30, 430, 30]} m={wood} />)}
          <B p={[0, 700, -d / 2 + 45]} s={[w - 40, 360, 30]} m={M.fabric} />
        </group>
      );
    case "stool":
      return (
        <group>
          <C p={[0, h - 20, 0]} r={w / 2 - 20} h={40} m={M.fabric} />
          {[0, 1, 2, 3].map((k) => {
            const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
            return <B key={k} p={[Math.cos(a) * (w / 2 - 70), (h - 40) / 2, Math.sin(a) * (w / 2 - 70)]} s={[24, h - 40, 24]} m={M.black} />;
          })}
          <mesh position={[0, 280, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[w / 2 - 70, 8, 8, 32]} />
            <primitive object={M.black} attach="material" />
          </mesh>
        </group>
      );
    case "shelf":
      return <B p={[0, h / 2, 0]} s={[w, h, d]} m={wood} />;
    case "pendant": {
      const cord = Math.max(0, ceiling - y0 - h);
      return (
        <group>
          <B p={[0, h + cord / 2, 0]} s={[4, cord, 4]} m={M.black} />
          <mesh position={[0, h * 0.55, 0]} castShadow>
            <coneGeometry args={[w / 2, h * 0.6, 32, 1, true]} />
            <primitive object={M.black} attach="material" />
          </mesh>
          <mesh position={[0, h * 0.28, 0]}>
            <sphereGeometry args={[45, 16, 16]} />
            <primitive object={M.bulb} attach="material" />
          </mesh>
        </group>
      );
    }
    case "bin":
      return (
        <group>
          <C p={[0, h / 2, 0]} r={w / 2} h={h} m={M.steel} />
          <C p={[0, h + 4, 0]} r={w / 2 - 4} h={8} m={M.black} />
        </group>
      );
    case "box":
    case "column":
      return <B p={[0, h / 2, 0]} s={[w, h, d]} m={colorMaterial(color ?? "#e9e5de")} />;
    case "columnRound":
      return <C p={[0, h / 2, 0]} r={w / 2} h={h} m={colorMaterial(color ?? "#e9e5de")} />;
    case "socket":
    case "switch":
      return (
        <group>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={M.frame} />
          {(p.model === "socket" ? [-w / 4, w / 4] : [0]).map((x) => (
            <B key={x} p={[x, h / 2, d / 2 + 1]} s={p.model === "socket" ? [44, 44, 2] : [30, 50, 4]} m={p.model === "socket" ? M.rubber : M.white} />
          ))}
        </group>
      );
    case "radiator":
      return (
        <group>
          {Array.from({ length: Math.max(4, Math.floor(w / 60)) }, (_, k) => {
            const n = Math.max(4, Math.floor(w / 60));
            return <B key={k} p={[-w / 2 + (k + 0.5) * (w / n), h / 2, 0]} s={[w / n - 8, h, d - 30]} m={M.frame} />;
          })}
          <B p={[0, h / 2, -d / 2 + 10]} s={[w, h - 40, 20]} m={M.frame} />
        </group>
      );
    case "vent":
      return (
        <group>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={M.frame} />
          {[0.2, 0.4, 0.6, 0.8].map((k) => <B key={k} p={[0, h * k, d / 2]} s={[w - 30, 8, 4]} m={M.rubber} />)}
        </group>
      );
    case "water":
      return (
        <group>
          <C p={[-50, 60, 0]} r={14} h={120} m={M.steel} />
          <C p={[50, 60, 0]} r={14} h={120} m={M.steel} />
          <C p={[0, 20, 0]} r={26} h={40} m={M.rubber} />
        </group>
      );
  }
  return null;
}
