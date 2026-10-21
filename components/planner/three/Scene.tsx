"use client";

import { Line, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { setItem, setOpening } from "@/lib/planner/actions";
import { getProduct } from "@/lib/planner/catalog";
import { TOP_T, TOP_Y, WALL_T } from "@/lib/planner/finishes";
import {
  bounds, findCollision, isCabinetModel, itemDims, itemOnWall, outerCorners, roomPolygon, roomWalls, snapItem, wallPieces, wallPoint, worktopRuns,
  type Wall, type WallPiece,
} from "@/lib/planner/geometry";
import { commitFrom, getState, setUI, toast, update, usePlanner } from "@/lib/planner/store";
import type { Item, KitchenStyle, Opening, Room, Vec2 } from "@/lib/planner/types";
import { floorMaterial, M, wallMaterial, worktopMaterial } from "./materials";
import { measure } from "./measure";
import { Appliance, B, Cabinet, Furniture } from "./models";

const APPLIANCE_MODELS = new Set(["hood", "fridge", "fridgeDouble", "range", "washer", "microwave"]);
const EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
const OUTLINE = new THREE.LineBasicMaterial({ color: "#2f7be0" });
const OUTLINE_BAD = new THREE.LineBasicMaterial({ color: "#d4402b" });
const STUB = 140;

/** Imperative hooks shared with the DOM UI (snapshots, walk buttons). */
export const sceneApi = {
  capture: null as null | (() => string),
  camera: null as THREE.Camera | null,
  walkKeys: new Set<string>(),
};

const dragApi = { start: null as null | ((s: { kind: "item" | "opening"; id: string; point: THREE.Vector3; x: number; y: number }) => void) };

function prism(poly: Vec2[], y0: number, y1: number) {
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    area += a.x * b.z - b.x * a.z;
  }
  const p = area > 0 ? [...poly].reverse() : poly;
  const v: number[] = [];
  const push = (q: Vec2, y: number) => v.push(q.x, y, q.z);
  for (let i = 1; i < p.length - 1; i++) {
    push(p[0], y1); push(p[i], y1); push(p[i + 1], y1);
    push(p[0], y0); push(p[i + 1], y0); push(p[i], y0);
  }
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    push(a, y0); push(b, y0); push(b, y1);
    push(a, y0); push(b, y1); push(a, y1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

const setCursor = (c: string) => {
  document.body.style.cursor = c;
};

// ---------------------------------------------------------------- room

const WallMesh = memo(function WallMesh({ w, outer, count, openings, room, selected, autoHide, editable, selOpening }: {
  w: Wall; outer: Vec2[]; count: number; openings: Opening[]; room: Room; selected: boolean; autoHide: boolean; editable: boolean; selOpening: string | null;
}) {
  const full = useRef<THREE.Group>(null);
  const stub = useRef<THREE.Group>(null);
  const pieces = useMemo(() => wallPieces(w, outer, count, openings, room.ceiling), [w, outer, count, openings, room.ceiling]);
  const geos = useMemo(() => {
    const cap = (ps: WallPiece[], top: number) => ps.filter((p) => p.y1 >= top - 0.5).map((p) => prism(p.poly, top, top + 2));
    const low = pieces.filter((p) => p.y0 < STUB).map((p) => ({ ...p, y1: Math.min(p.y1, STUB) }));
    return {
      full: pieces.map((p) => prism(p.poly, p.y0, p.y1)),
      fullCap: cap(pieces, room.ceiling),
      stub: low.map((p) => prism(p.poly, p.y0, p.y1)),
      stubCap: cap(low, STUB),
    };
  }, [pieces, room.ceiling]);
  useEffect(() => () => Object.values(geos).flat().forEach((g) => g.dispose()), [geos]);

  const mid = { x: (w.a.x + w.b.x) / 2 / 1000, z: (w.a.z + w.b.z) / 2 / 1000 };
  useFrame(({ camera }) => {
    if (!full.current || !stub.current) return;
    const cut = autoHide && (camera.position.x - mid.x) * w.n.x + (camera.position.z - mid.z) * w.n.z < -0.05;
    full.current.visible = !cut;
    stub.current.visible = cut;
  });
  const mat = selected ? M.selected : wallMaterial(room.wallColor);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!editable || e.delta > 4) return;
    e.stopPropagation();
    setUI({ sel: { type: "wall", id: String(w.i) }, panel: { kind: "room" } });
  };
  return (
    <group>
      <group ref={full}>
        {geos.full.map((g, k) => <mesh key={k} geometry={g} material={mat} castShadow receiveShadow onClick={onClick} />)}
        {geos.fullCap.map((g, k) => <mesh key={k} geometry={g} material={M.plinth} />)}
        {openings.map((o) => <OpeningMesh key={o.id} o={o} w={w} editable={editable} selected={selOpening === o.id} />)}
      </group>
      <group ref={stub}>
        {geos.stub.map((g, k) => <mesh key={k} geometry={g} material={mat} receiveShadow onClick={onClick} />)}
        {geos.stubCap.map((g, k) => <mesh key={k} geometry={g} material={M.plinth} />)}
      </group>
    </group>
  );
});

function OpeningMesh({ o, w, editable, selected }: { o: Opening; w: Wall; editable: boolean; selected: boolean }) {
  const pos = wallPoint(w, o.offset);
  const T = WALL_T;
  const fw = 50;
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!editable || e.button !== 0 || getState().ui.view === "walk") return;
    e.stopPropagation();
    setUI({ sel: { type: "opening", id: o.id }, panel: { kind: "openings", type: o.type } });
    dragApi.start?.({ kind: "opening", id: o.id, point: e.point, x: e.clientX, y: e.clientY });
  };
  const hover = editable ? { onPointerOver: () => setCursor("ew-resize"), onPointerOut: () => setCursor("auto") } : {};
  const sliding = o.preset === "door-sliding";
  const leaves = o.preset === "door-double" ? 2 : 1;
  return (
    <group position={[pos.x, 0, pos.z]} rotation-y={w.rot} onPointerDown={onDown} {...hover}>
      {o.type === "window" && (
        <group position={[0, o.sill, 0]}>
          <B p={[0, o.height - fw / 2, -T / 2]} s={[o.width, fw, T * 0.6]} m={M.frame} />
          <B p={[0, fw / 2, -T / 2]} s={[o.width, fw, T * 0.6]} m={M.frame} />
          <B p={[-o.width / 2 + fw / 2, o.height / 2, -T / 2]} s={[fw, o.height, T * 0.6]} m={M.frame} />
          <B p={[o.width / 2 - fw / 2, o.height / 2, -T / 2]} s={[fw, o.height, T * 0.6]} m={M.frame} />
          {o.width > 900 && <B p={[0, o.height / 2, -T / 2]} s={[40, o.height - 2 * fw, T * 0.5]} m={M.frame} />}
          <mesh position={[0, o.height / 2, -T / 2]} scale={[o.width - 2 * fw, o.height - 2 * fw, 6]} geometry={PANE} material={M.glass} />
          <B p={[0, -12, -T / 2 + 20]} s={[o.width + 80, 24, T / 2 + 80]} m={M.frame} />
        </group>
      )}
      {o.type === "door" && (
        <group>
          <B p={[0, o.height + 30, 6]} s={[o.width + 120, 60, 12]} m={M.frame} />
          <B p={[-o.width / 2 - 30, o.height / 2, 6]} s={[60, o.height, 12]} m={M.frame} />
          <B p={[o.width / 2 + 30, o.height / 2, 6]} s={[60, o.height, 12]} m={M.frame} />
          {sliding ? (
            <>
              <B p={[-o.width / 4, o.height / 2, -T / 2 - 15]} s={[o.width / 2, o.height, 40]} m={M.black} />
              <mesh position={[-o.width / 4, o.height / 2, -T / 2 - 15]} scale={[o.width / 2 - 100, o.height - 100, 44]} geometry={PANE} material={M.glass} />
              <B p={[o.width / 4, o.height / 2, -T / 2 + 25]} s={[o.width / 2, o.height, 40]} m={M.black} />
              <mesh position={[o.width / 4, o.height / 2, -T / 2 + 25]} scale={[o.width / 2 - 100, o.height - 100, 44]} geometry={PANE} material={M.glass} />
            </>
          ) : (
            Array.from({ length: leaves }, (_, k) => {
              const lw = o.width / leaves;
              const x = -o.width / 2 + lw * (k + 0.5);
              const hingeLeft = leaves === 2 ? k === 0 : o.hinge !== "r";
              return (
                <group key={k}>
                  <B p={[x, o.height / 2, -T / 2]} s={[lw - 6, o.height - 6, 40]} m={M.door} />
                  <B p={[x + (hingeLeft ? lw / 2 - 70 : -lw / 2 + 70), 1000, -T / 2 + 40]} s={[120, 18, 30]} m={M.steel} />
                </group>
              );
            })
          )}
        </group>
      )}
      {selected && <mesh position={[0, o.sill + o.height / 2, -T / 2]} scale={[o.width + 20, o.height + 20, T + 20]} geometry={PANE} material={M.selected} />}
    </group>
  );
}
const PANE = new THREE.BoxGeometry(1, 1, 1);

function DoorSwings({ walls, openings }: { walls: Wall[]; openings: Opening[] }) {
  return (
    <>
      {openings.filter((o) => o.type === "door" && o.preset !== "door-sliding").map((o) => {
        const w = walls[o.wall];
        if (!w) return null;
        const leaves = o.preset === "door-double" ? 2 : 1;
        const lw = o.width / leaves;
        return Array.from({ length: leaves }, (_, k) => {
          const left = leaves === 2 ? k === 0 : o.hinge !== "r";
          const hu = left ? o.offset - o.width / 2 : o.offset + o.width / 2;
          const pts: [number, number, number][] = [];
          for (let s = 0; s <= 24; s++) {
            const a = (s / 24) * (Math.PI / 2);
            const along = Math.cos(a) * lw * (left ? 1 : -1);
            const p = wallPoint(w, hu + along, Math.sin(a) * lw);
            pts.push([p.x, 4, p.z]);
          }
          const h = wallPoint(w, hu, 0), tip = wallPoint(w, hu, lw);
          return (
            <group key={`${o.id}${k}`}>
              <Line points={pts} color="#7d8590" lineWidth={1} dashed dashSize={60} gapSize={40} />
              <Line points={[[h.x, 4, h.z], [tip.x, 4, tip.z]]} color="#7d8590" lineWidth={1.5} />
            </group>
          );
        });
      })}
    </>
  );
}

function RoomMesh() {
  const room = usePlanner((s) => s.design.room);
  const openings = usePlanner((s) => s.design.openings);
  const sel = usePlanner((s) => s.ui.sel);
  const step = usePlanner((s) => s.ui.step);
  const view = usePlanner((s) => s.ui.view);
  const walls = useMemo(() => roomWalls(room.shape), [room.shape]);
  const outer = useMemo(() => outerCorners(walls), [walls]);
  const byWall = useMemo(() => walls.map((w) => openings.filter((o) => o.wall === w.i)), [walls, openings]);
  const floor = useMemo(() => {
    const pts = roomPolygon(room.shape);
    const shape = new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z)));
    return new THREE.ShapeGeometry(shape);
  }, [room.shape]);
  const base = useMemo(() => {
    const shape = new THREE.Shape(outer.map((p) => new THREE.Vector2(p.x, -p.z)));
    return new THREE.ShapeGeometry(shape);
  }, [outer]);
  useEffect(() => () => { floor.dispose(); base.dispose(); }, [floor, base]);
  const autoHide = view === "3d" || view === "elevation";
  return (
    <group>
      <mesh geometry={base} rotation-x={-Math.PI / 2} position-y={-3} material={M.plinth} />
      <mesh
        geometry={floor}
        rotation-x={-Math.PI / 2}
        material={floorMaterial(room.floor)}
        receiveShadow
        onClick={(e) => {
          if (e.delta > 4) return;
          e.stopPropagation();
          setUI((ui) => ({ sel: null, panel: ui.panel?.kind === "selected" || ui.panel?.kind === "openings" ? null : ui.panel }));
        }}
      />
      {walls.map((w) => (
        <WallMesh
          key={w.i}
          w={w}
          outer={outer}
          count={walls.length}
          openings={byWall[w.i]}
          room={room}
          selected={sel?.type === "wall" && sel.id === String(w.i)}
          autoHide={autoHide}
          editable={step === 1}
          selOpening={sel?.type === "opening" ? sel.id : null}
        />
      ))}
      {view === "plan" && <DoorSwings walls={walls} openings={openings} />}
    </group>
  );
}

// ---------------------------------------------------------------- items

const ItemNode = memo(function ItemNode({ item, room, style, selected, hidden, invalid }: { item: Item; room: Room; style: KitchenStyle; selected: boolean; hidden: boolean; invalid: boolean }) {
  const p = getProduct(item.product);
  if (!p) return null;
  const dm = itemDims(item, p, room);
  const look = { front: item.front ?? style.front, handle: item.handle ?? style.handle, carcass: style.carcass };
  const open = !!item.open;
  const body = isCabinetModel(p) ? (
    <Cabinet p={p} w={dm.w} d={dm.d} h={dm.h} look={look} open={open} mirror={!!item.mirror} absY={dm.y0} />
  ) : APPLIANCE_MODELS.has(p.model) ? (
    <Appliance p={p} w={dm.w} d={dm.d} h={dm.h} open={open} mirror={!!item.mirror} ceiling={room.ceiling} y0={dm.y0} />
  ) : (
    <Furniture p={p} w={dm.w} d={dm.d} h={dm.h} color={item.color} ceiling={room.ceiling} y0={dm.y0} />
  );
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || getState().ui.view === "walk") return;
    e.stopPropagation();
    const ui = getState().ui;
    setUI({ sel: { type: "item", id: item.id }, panel: ui.panel?.kind === "selected" ? ui.panel : ui.panel?.kind === "catalog" || ui.panel?.kind === "search" ? ui.panel : null });
    dragApi.start?.({ kind: "item", id: item.id, point: e.point, x: e.clientX, y: e.clientY });
  };
  return (
    <group
      position={[item.x, dm.y0, item.z]}
      rotation-y={item.rot}
      visible={!hidden}
      onPointerDown={onDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setUI({ sel: { type: "item", id: item.id }, panel: { kind: "selected", tab: "modify" } });
      }}
      onPointerOver={() => setCursor("grab")}
      onPointerOut={() => setCursor("auto")}
    >
      {body}
      {selected && (
        <lineSegments geometry={EDGES} material={invalid ? OUTLINE_BAD : OUTLINE} position={[0, dm.h / 2, 0]} scale={[dm.w + 12, dm.h + 12, dm.d + 12]} />
      )}
    </group>
  );
});

function Items() {
  const items = usePlanner((s) => s.design.items);
  const room = usePlanner((s) => s.design.room);
  const style = usePlanner((s) => s.design.style);
  const sel = usePlanner((s) => s.ui.sel);
  const showWall = usePlanner((s) => s.ui.showWallUnits);
  const invalid = usePlanner((s) => s.ui.dragInvalid);
  return (
    <>
      {items.map((it) => {
        const isSel = sel?.type === "item" && sel.id === it.id;
        return (
          <ItemNode
            key={it.id}
            item={it}
            room={room}
            style={style}
            selected={isSel}
            invalid={isSel && invalid}
            hidden={!showWall && getProduct(it.product)?.layer === "wall"}
          />
        );
      })}
    </>
  );
}

function Worktops() {
  const items = usePlanner((s) => s.design.items);
  const room = usePlanner((s) => s.design.room);
  const top = usePlanner((s) => s.design.style.worktop);
  const runs = useMemo(() => worktopRuns({ items, room }), [items, room]);
  const m = worktopMaterial(top);
  return (
    <>
      {runs.map((r, k) => (
        <group key={k} position={[r.x, TOP_Y - TOP_T / 2 + k * 0.2, r.z]} rotation-y={r.rot}>
          <B p={[0, 0, 0]} s={[r.len, TOP_T, r.depth]} m={m} />
        </group>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- dimensions & floating actions

function Dimensions() {
  const st = usePlanner((x) => x);
  const m = useMemo(() => measure(st), [st]);
  return (
    <>
      {m.lines.map((l) => <Line key={l.key} points={[l.a, l.b]} color="#2f7be0" lineWidth={1.5} />)}
    </>
  );
}

/** Exposes the active camera so the DOM overlay can position labels. */
function CameraBridge() {
  const camera = useThree((x) => x.camera);
  useEffect(() => {
    sceneApi.camera = camera;
  }, [camera]);
  return null;
}

// ---------------------------------------------------------------- drag & drop

function DragController() {
  const { camera, gl } = useThree();
  const get = useThree((s) => s.get);
  useEffect(() => {
    dragApi.start = (s) => {
      const before = getState().design;
      const walls = roomWalls(before.room.shape);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -s.point.y);
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const hit = new THREE.Vector3();
      const item = s.kind === "item" ? before.items.find((i) => i.id === s.id) : undefined;
      const opening = s.kind === "opening" ? before.openings.find((o) => o.id === s.id) : undefined;
      if (!item && !opening) return;
      const grab = { x: s.point.x * 1000, z: s.point.z * 1000 };
      let moved = false;
      let lastValid: Pick<Item, "x" | "z" | "rot"> | null = null;
      const controls = get().controls as unknown as { enabled: boolean } | null;
      if (controls) controls.enabled = false;

      const move = (ev: PointerEvent) => {
        if (!moved && Math.hypot(ev.clientX - s.x, ev.clientY - s.y) < 4) return;
        if (!moved) {
          moved = true;
          setUI({ dragging: true });
          setCursor("grabbing");
        }
        const r = gl.domElement.getBoundingClientRect();
        ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        if (!ray.ray.intersectPlane(plane, hit)) return;
        const pt = { x: hit.x * 1000, z: hit.z * 1000 };
        if (item) {
          const d = getState().design;
          const cur = d.items.find((i) => i.id === item.id)!;
          const snapped = snapItem(d, cur, { x: item.x + pt.x - grab.x, z: item.z + pt.z - grab.z }, walls);
          const bad = !!findCollision(d, { ...cur, ...snapped }, walls);
          if (!bad) lastValid = snapped;
          setItem(item.id, snapped, false);
          if (bad !== getState().ui.dragInvalid) setUI({ dragInvalid: bad });
        } else if (opening) {
          const w = walls[opening.wall];
          const du = (pt.x - grab.x) * w.dir.x + (pt.z - grab.z) * w.dir.z;
          setOpening(opening.id, { offset: Math.round(opening.offset + du) }, false);
        }
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        if (controls) controls.enabled = true;
        setCursor("auto");
        if (!moved) return;
        if (item && getState().ui.dragInvalid) {
          if (lastValid) setItem(item.id, lastValid, false);
          else update(() => before, false);
          toast("Not enough space there — moved back to the nearest free spot.");
        }
        commitFrom(before);
        setUI({ dragging: false, dragInvalid: false });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    };
    return () => {
      dragApi.start = null;
    };
  }, [camera, gl, get]);
  return null;
}

// ---------------------------------------------------------------- cameras

type Controls = { target: THREE.Vector3; update: () => void; enabled: boolean };
const saved3d = { has: false, pos: new THREE.Vector3(), target: new THREE.Vector3() };

function WalkControls({ box }: { box: ReturnType<typeof bounds> }) {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
  useEffect(() => {
    const el = gl.domElement;
    let down: { x: number; y: number } | null = null;
    const pd = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const pm = (e: PointerEvent) => {
      if (!down) return;
      yaw.current -= (e.clientX - down.x) * 0.004;
      pitch.current = Math.max(-1.2, Math.min(1.2, pitch.current - (e.clientY - down.y) * 0.004));
      down = { x: e.clientX, y: e.clientY };
    };
    const pu = () => (down = null);
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    const kd = (e: KeyboardEvent) => !typing(e) && sceneApi.walkKeys.add(e.key.toLowerCase());
    const ku = (e: KeyboardEvent) => sceneApi.walkKeys.delete(e.key.toLowerCase());
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      sceneApi.walkKeys.clear();
    };
  }, [gl]);
  useFrame((_, dt) => {
    const k = sceneApi.walkKeys;
    const f = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
    const r = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
    const turn = (k.has("arrowleft") ? 1 : 0) - (k.has("arrowright") ? 1 : 0);
    yaw.current += turn * dt * 1.6;
    const sp = 1.5 * dt;
    const fx = -Math.sin(yaw.current), fz = -Math.cos(yaw.current);
    camera.position.x = Math.min(box.maxX / 1000 - 0.25, Math.max(box.minX / 1000 + 0.25, camera.position.x + (fx * f - fz * r) * sp));
    camera.position.z = Math.min(box.maxZ / 1000 - 0.25, Math.max(box.minZ / 1000 + 0.25, camera.position.z + (fz * f + fx * r) * sp));
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
  });
  return null;
}

function CameraRig() {
  const view = usePlanner((s) => s.ui.view);
  const elevWall = usePlanner((s) => s.ui.elevWall);
  const shape = usePlanner((s) => s.design.room.shape);
  const ceiling = usePlanner((s) => s.design.room.ceiling);
  const cmd = usePlanner((s) => s.ui.cmd);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const get = useThree((s) => s.get);
  const resetN = useRef(0);
  if (cmd?.type === "reset" && cmd.n !== resetN.current) {
    resetN.current = cmd.n;
    saved3d.has = false;
  }
  const box = useMemo(() => bounds(roomPolygon(shape)), [shape]);
  const walls = useMemo(() => roomWalls(shape), [shape]);
  const cx = box.cx / 1000, cz = box.cz / 1000;
  const W = (box.w + 2 * WALL_T) / 1000, D = (box.d + 2 * WALL_T) / 1000;

  const cfg = useMemo(() => {
    if (view === "plan") return { pos: [cx, 40, cz + 0.001] as const, target: [cx, 0, cz] as const, zoom: Math.min(size.width / (W + 1.4), size.height / (D + 1.4)) };
    if (view === "elevation") {
      const w = walls[elevWall] ?? walls[0];
      const mx = (w.a.x + w.b.x) / 2000, mz = (w.a.z + w.b.z) / 2000, y = ceiling / 2000;
      return { pos: [mx + w.n.x * 20, y, mz + w.n.z * 20] as const, target: [mx, y, mz] as const, zoom: Math.min(size.width / (w.len / 1000 + 1.2), size.height / (ceiling / 1000 + 1)) };
    }
    if (view === "walk") return { pos: [cx, 1.6, cz + D * 0.3] as const, target: [cx, 1.6, cz - 1] as const, zoom: 1 };
    // Pull back far enough that the room also fits a narrow (portrait) screen.
    const hfov = Math.atan(Math.tan((21 * Math.PI) / 180) * (size.width / size.height));
    const dist = Math.max(Math.max(W, D) * 1.15 + 2.2, (Math.max(W, D) * 0.75) / Math.tan(hfov));
    return { pos: [cx + dist * 0.35, dist * 0.85, cz + dist * 0.9] as const, target: [cx, 0.7, cz] as const, zoom: 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, elevWall, shape, ceiling, size.width, size.height, resetN.current]);
  const pos = useMemo(() => (view === "3d" && saved3d.has ? saved3d.pos.toArray() : [...cfg.pos]) as [number, number, number], [cfg, view]);
  const target = useMemo(() => (view === "3d" && saved3d.has ? saved3d.target.toArray() : [...cfg.target]) as [number, number, number], [cfg, view]);

  // Remember the orbit pose so switching views and back keeps the user's angle.
  useFrame(({ camera: cam, controls }) => {
    if (view !== "3d" || !controls || !(cam as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    saved3d.pos.copy(cam.position);
    saved3d.target.copy((controls as unknown as Controls).target);
    saved3d.has = true;
  });

  const last = useRef(0);
  useEffect(() => {
    if (!cmd || cmd.n === last.current) return;
    last.current = cmd.n;
    const c = get().controls as unknown as Controls | null;
    const cam = camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (cmd.type === "zoomIn" || cmd.type === "zoomOut") {
      const f = cmd.type === "zoomIn" ? 1.25 : 0.8;
      if ((cam as THREE.OrthographicCamera).isOrthographicCamera) {
        cam.zoom *= f;
        cam.updateProjectionMatrix();
      } else if (c) {
        const off = cam.position.clone().sub(c.target).multiplyScalar(1 / f);
        cam.position.copy(c.target).add(off);
      }
      c?.update();
    }
    if (cmd.type === "focus" && cmd.id && c) {
      const d = getState().design;
      const it = d.items.find((i) => i.id === cmd.id);
      const p = it && getProduct(it.product);
      if (!it || !p) return;
      const dm = itemDims(it, p, d.room);
      const pt = new THREE.Vector3(it.x / 1000, (dm.y0 + dm.h / 2) / 1000, it.z / 1000);
      if ((cam as THREE.OrthographicCamera).isOrthographicCamera) {
        const delta = pt.clone().sub(c.target);
        delta.y = 0;
        cam.position.add(delta);
        c.target.add(delta);
        cam.zoom = Math.max(cam.zoom, cfg.zoom * 2);
        cam.updateProjectionMatrix();
      } else {
        const dir = cam.position.clone().sub(c.target).normalize();
        c.target.copy(pt);
        cam.position.copy(pt).add(dir.multiplyScalar(Math.max(1.6, dm.w / 600 + 1.2)));
      }
      c.update();
    }
  }, [cmd, camera, get, cfg.zoom]);

  const key = `${view}-${elevWall}-${resetN.current}`;
  if (view === "plan" || view === "elevation")
    return (
      <>
        <OrthographicCamera key={`c${key}`} makeDefault position={pos} zoom={cfg.zoom} near={view === "elevation" ? 18.4 : 0.1} far={view === "elevation" ? 20.5 : 100} />
        <OrbitControls key={`o${key}`} makeDefault target={target} enableRotate={false} screenSpacePanning zoomSpeed={1.2} minZoom={cfg.zoom * 0.4} maxZoom={cfg.zoom * 8} />
      </>
    );
  if (view === "walk")
    return (
      <>
        <PerspectiveCamera key={`c${key}`} makeDefault fov={68} near={0.05} far={100} position={pos} />
        <WalkControls box={box} />
      </>
    );
  return (
    <>
      <PerspectiveCamera key={`c${key}`} makeDefault fov={42} near={0.05} far={200} position={pos} />
      <OrbitControls key={`o${key}`} makeDefault target={target} maxPolarAngle={Math.PI * 0.495} minDistance={0.6} maxDistance={35} enableDamping dampingFactor={0.12} />
    </>
  );
}

// ---------------------------------------------------------------- environment

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Lights() {
  const shape = usePlanner((s) => s.design.room.shape);
  const scene = useThree((s) => s.scene);
  const light = useRef<THREE.DirectionalLight>(null);
  const b = useMemo(() => bounds(roomPolygon(shape)), [shape]);
  const cx = b.cx / 1000, cz = b.cz / 1000, r = Math.max(b.w, b.d) / 1000 / 2 + 1.5;
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(cx, 0, cz);
    scene.add(l.target);
    return () => {
      scene.remove(l.target);
    };
  }, [cx, cz, scene]);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#d9d2c6", 0.75]} />
      <directionalLight
        ref={light}
        castShadow
        position={[cx + 2.2, 7, cz + 3.4]}
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <pointLight position={[cx, 2.4, cz]} intensity={1.2} distance={9} decay={1.6} />
    </>
  );
}

function Capture() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    sceneApi.capture = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    };
    return () => {
      sceneApi.capture = null;
    };
  }, [gl, scene, camera]);
  return null;
}

export default function PlannerScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => setUI((ui) => ({ sel: null, panel: ui.panel?.kind === "selected" || ui.panel?.kind === "openings" ? null : ui.panel }))}
      className="touch-none"
    >
      <color attach="background" args={["#f1efea"]} />
      <Environment />
      <Lights />
      <CameraRig />
      <group scale={0.001}>
        <RoomMesh />
        <Items />
        <Worktops />
        <Dimensions />
      </group>
      <DragController />
      <CameraBridge />
      <Capture />
    </Canvas>
  );
}
