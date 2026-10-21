"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { duplicateItem, removeSelection, rotateItem } from "@/lib/planner/actions";
import { usePlanner } from "@/lib/planner/store";
import { measure } from "./three/measure";
import { sceneApi } from "./three/Scene";
import { Icon } from "./ui";

/** DOM labels pinned to 3D points; positions are updated every animation frame. */
export default function Overlay() {
  const st = usePlanner((s) => s);
  const m = useMemo(() => measure(st), [st]);
  const box = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const v = new THREE.Vector3();
    const anchors = [...m.labels.map((l) => [l.key, l.p] as const), ...(m.tools ? [["tools", m.tools.p] as const] : [])];
    // Runs on the frames the 3D view renders, so labels cost nothing while the scene is still.
    const place = () => {
      const cam = sceneApi.camera;
      const el = box.current;
      if (!cam || !el) return;
      const W = el.clientWidth, H = el.clientHeight;
      for (const [key, p] of anchors) {
        const n = nodes.current.get(key);
        if (!n) continue;
        v.set(p[0] / 1000, p[1] / 1000, p[2] / 1000).project(cam);
        const on = v.z > -1 && v.z < 1;
        n.style.visibility = on ? "visible" : "hidden";
        n.style.transform = `translate(${((v.x + 1) / 2) * W}px, ${((1 - v.y) / 2) * H}px) translate(-50%, -50%)`;
      }
    };
    sceneApi.frameListeners.add(place);
    place();
    sceneApi.invalidate?.();
    return () => {
      sceneApi.frameListeners.delete(place);
    };
  }, [m]);

  const bind = (key: string) => (n: HTMLElement | null) => {
    if (n) nodes.current.set(key, n);
    else nodes.current.delete(key);
  };
  const tools = m.tools;
  return (
    <div ref={box} className="no-print pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {m.labels.map((l) => (
        <span
          key={l.key}
          ref={bind(l.key)}
          style={{ visibility: "hidden" }}
          className={`absolute left-0 top-0 whitespace-nowrap rounded-[2px] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm ${l.tone === "blue" ? "bg-[#2f7be0] text-white" : "bg-white/95 text-navy ring-1 ring-line"}`}
        >
          {l.text}
        </span>
      ))}
      {tools && (
        <div ref={bind("tools")} style={{ visibility: "hidden" }} className="pointer-events-auto absolute left-0 top-0 flex overflow-hidden rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-line">
          {[
            { l: "Rotate left", i: "rotate", c: "-scale-x-100", f: () => rotateItem(tools.id, -1) },
            { l: "Rotate right", i: "rotate", c: "", f: () => rotateItem(tools.id, 1) },
            { l: "Duplicate", i: "duplicate", c: "", f: () => duplicateItem(tools.id) },
            { l: "Remove", i: "trash", c: "", f: () => removeSelection() },
          ].map((b) => (
            <button key={b.l} type="button" title={b.l} aria-label={b.l} onClick={b.f} className="grid h-8 w-8 place-items-center text-navy hover:bg-stone">
              <Icon name={b.i} size={16} className={b.c} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
