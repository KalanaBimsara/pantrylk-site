"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { axes } from "@/lib/planner/geometry";
import { ledStrips, lightHex, pointLights, type PointLight, type Strip } from "@/lib/planner/lighting";
import { usePlanner } from "@/lib/planner/store";
import { ledMaterial, UNIT_BOX } from "./materials";

RectAreaLightUniformsLib.init();

/** Every area light costs shader time on every surface, so only this many strips cast light; the rest just glow. */
const MAX_AREA_LIGHTS = 16;

/**
 * Strips that continue each other (a run of wall units, a plinth along a wall) are lit by one long
 * area light instead of one per cabinet: the same light on the worktop for a fraction of the cost.
 */
function mergeStrips(strips: Strip[]): Strip[] {
  const groups = new Map<string, { s: Strip; u0: number; u1: number; across: number }[]>();
  for (const s of strips) {
    const { ax, az } = axes(s.rot);
    const u = s.x * ax.x + s.z * ax.z;
    const across = s.x * az.x + s.z * az.z;
    const rot = Math.round((((s.rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 100);
    const key = `${s.zone}|${s.facing}|${rot}|${Math.round(s.y / 5)}|${Math.round(across / 10)}|${s.span}`;
    const g = groups.get(key) ?? [];
    g.push({ s, u0: u - s.len / 2, u1: u + s.len / 2, across });
    groups.set(key, g);
  }
  const out: Strip[] = [];
  for (const g of groups.values()) {
    g.sort((a, b) => a.u0 - b.u0);
    let cur: (typeof g)[number] | null = null;
    const flush = () => {
      if (!cur) return;
      const { ax, az } = axes(cur.s.rot);
      const u = (cur.u0 + cur.u1) / 2;
      out.push({ ...cur.s, key: `m:${cur.s.key}`, len: cur.u1 - cur.u0, x: ax.x * u + az.x * cur.across, z: ax.z * u + az.z * cur.across });
    };
    for (const e of g) {
      if (cur && e.u0 - cur.u1 < 120) cur.u1 = Math.max(cur.u1, e.u1);
      else {
        flush();
        cur = { ...e };
      }
    }
    flush();
  }
  return out;
}
const MAX_POINT_LIGHTS = 12;
const ZONE_INTENSITY: Record<Strip["zone"], number> = { under: 45, cove: 30, glass: 22, plinth: 20, shelf: 40, custom: 40 };
const WHITE_IDS = new Set(["warm", "natural", "cool"]);

function StripLight({ s, color, intensity }: { s: Strip; color: string; intensity: number }) {
  const ref = useRef<THREE.RectAreaLight>(null);
  useLayoutEffect(() => {
    const l = ref.current;
    if (!l) return;
    const { az } = axes(s.rot);
    const x = s.x / 1000, y = s.y / 1000, z = s.z / 1000;
    l.position.set(x, y, z);
    // Lights look down their -Z; "up" keeps the long side along the strip.
    l.up.set(az.x, 0, az.z);
    l.lookAt(x, y + (s.facing === "down" ? -1 : 1), z);
  }, [s]);
  return <rectAreaLight ref={ref} color={color} intensity={intensity} width={s.len / 1000} height={s.span / 1000} />;
}

function Downlight({ p, color, intensity }: { p: PointLight; color: string; intensity: number }) {
  const ref = useRef<THREE.SpotLight>(null);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.target.position.set(p.x / 1000, 0, p.z / 1000);
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [p, scene]);
  return <spotLight ref={ref} position={[p.x / 1000, p.y / 1000 - 0.02, p.z / 1000]} color={color} intensity={intensity} angle={0.75} penumbra={0.8} decay={2} distance={6} />;
}

export default function KitchenLights() {
  const items = usePlanner((s) => s.design.items);
  const room = usePlanner((s) => s.design.room);
  const lighting = usePlanner((s) => s.design.lighting);
  const d = useMemo(() => ({ items, room, lighting }), [items, room, lighting]);
  const strips = useMemo(() => ledStrips(d), [d]);
  const lit = useMemo(() => mergeStrips(strips), [strips]);
  const points = useMemo(() => pointLights(d), [d]);
  const hex = lightHex(d);
  const evening = lighting.mode === "evening";
  const k = lighting.brightness * (evening ? 1 : 0.45);
  const glow = ledMaterial(hex, evening ? 3 : 1.6);
  const lampColor = WHITE_IDS.has(lighting.color) ? hex : "#ffd9ad";
  return (
    <>
      {strips.map((s) => (
        <mesh key={s.key} geometry={UNIT_BOX} material={glow} position={[s.x / 1000, s.y / 1000, s.z / 1000]} rotation-y={s.rot} scale={[s.len / 1000, 0.006, 0.014]} />
      ))}
      {lit.slice(0, MAX_AREA_LIGHTS).map((s) => <StripLight key={s.key} s={s} color={hex} intensity={ZONE_INTENSITY[s.zone] * k} />)}
      {points.slice(0, MAX_POINT_LIGHTS).map((p) =>
        p.kind === "pendant" ? (
          <pointLight key={p.key} position={[p.x / 1000, p.y / 1000, p.z / 1000]} color="#ffd9ad" intensity={(evening ? 5 : 1) * lighting.brightness} distance={7} decay={2} />
        ) : (
          <Downlight key={p.key} p={p} color={lampColor} intensity={(evening ? 14 : 2.5) * lighting.brightness} />
        ),
      )}
    </>
  );
}
