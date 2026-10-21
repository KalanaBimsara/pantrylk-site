"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getProduct } from "@/lib/planner/catalog";
import { BASE_BODY, plinthFor, TOP_D, TOP_Y } from "@/lib/planner/finishes";
import { isCabinetModel, itemBoxes, itemDims } from "@/lib/planner/geometry";
import type { Item, Room } from "@/lib/planner/types";
import { worktopMaterial } from "./materials";
import { Cabinet } from "./models";
import { slab, topProfile } from "./worktop";

const ROOM: Room = { shape: { kind: "rect", width: 4000, depth: 4000 }, ceiling: 2700, floor: "light-oak", wallColor: "#ffffff" };
const TOP_T = 30;

export type StudioProps = {
  productId: string;
  width: number;
  front: string;
  handle?: string;
  open?: boolean;
  /** Worktop shown on base units (null for none). */
  top?: string | null;
  background?: string;
};

const studioItem = (productId: string, width: number): Item => ({ id: "studio", product: productId, x: 0, z: 0, rot: 0, width });

/** Camera that frames a unit in a three-quarter view (corner units from the side that shows both doors). */
export function studioFraming(productId: string, width: number, top = true) {
  const p = getProduct(productId)!;
  const dm = itemDims(studioItem(productId, width), p, ROOM);
  const h = (p.worktop && top ? TOP_Y : dm.h) / 1000;
  const w = dm.w / 1000, d = dm.d / 1000;
  const target = new THREE.Vector3(0, h / 2, 0);
  const dir = (p.model === "cornerL" ? new THREE.Vector3(0.95, 0.5, 1) : new THREE.Vector3(-0.6, 0.42, 1)).normalize();
  const fov = 30;
  const radius = 0.5 * Math.hypot(w, h, d);
  const dist = (radius / Math.sin(((fov / 2) * Math.PI) / 180)) * 1.02;
  return { fov, target, position: target.clone().add(dir.multiplyScalar(dist)), radius };
}

function StudioSetup({ background }: { background: string }) {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    scene.background = new THREE.Color(background);
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene, background, invalidate]);
  return null;
}

export function StudioScene({ productId, width, front, handle = "bar-steel", open = false, top = "black-granite", background = "#f3f0ea" }: StudioProps) {
  const p = getProduct(productId)!;
  const item = studioItem(productId, width);
  const dm = itemDims(item, p, ROOM);
  const withTop = !!(p.worktop && top && isCabinetModel(p));
  const shown = withTop ? { ...p, plinth: plinthFor(TOP_T), height: plinthFor(TOP_T) + BASE_BODY } : p;
  const boxes = useMemo(() => (withTop ? itemBoxes(item, p, dm) : []), [withTop, productId, width]); // eslint-disable-line react-hooks/exhaustive-deps
  const geos = useMemo(() => boxes.map((b) => slab(b.w, topProfile(TOP_D, TOP_T, "eased"))), [boxes]);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  return (
    <>
      <StudioSetup background={background} />
      <hemisphereLight args={["#ffffff", "#d8d2c8"]} intensity={0.75} />
      <directionalLight
        castShadow
        position={[-2.2, 4.2, 3.2]}
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[3, 1.6, 2.4]} intensity={0.35} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
      <group scale={0.001}>
        {/* Wall units are photographed standing on the floor; absY keeps their handles at the bottom edge. */}
        <Cabinet p={shown} w={dm.w} d={dm.d} h={shown.height} look={{ front, handle, carcass: "white" }} open={open} mirror={false} absY={p.layer === "wall" ? p.elev : 0} />
        {boxes.map((b, k) => (
          // Back edge flush with the cabinet back, so the overhang is all at the front.
          <group key={k} position={[b.x + Math.sin(b.rot) * ((TOP_D - b.d) / 2), TOP_Y - TOP_T + k * 0.2, b.z + Math.cos(b.rot) * ((TOP_D - b.d) / 2)]} rotation-y={b.rot}>
            <mesh geometry={geos[k]} material={worktopMaterial(top!)} castShadow receiveShadow />
          </group>
        ))}
      </group>
    </>
  );
}
