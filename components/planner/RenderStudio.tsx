"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SITE_UNITS, unitImages } from "@/lib/planner/site-products";
import { StudioScene, studioFraming } from "./three/Studio";

const W = 1200, H = 1320; // matches the product page's 4:4.4 photo frame

type Job = { file: string; productId: string; width: number; front: string; open: boolean };

const jobs: Job[] = SITE_UNITS.flatMap((u) => unitImages(u).map((im) => ({ file: im.file, productId: u.plannerId, width: u.showWidth, front: im.front, open: im.open })));

/** Once the job's scene has mounted (environment map, door poses), draws one frame and hands back a JPEG. */
function Shutter({ job, onShot }: { job: Job; onShot: (url: string) => void }) {
  const { gl, scene, camera } = useThree();
  const shot = useRef(onShot);
  shot.current = onShot;
  useEffect(() => {
    const f = studioFraming(job.productId, job.width);
    camera.lookAt(f.target);
    camera.updateMatrixWorld();
    const t = setTimeout(() => {
      gl.shadowMap.needsUpdate = true;
      gl.render(scene, camera);
      shot.current(gl.domElement.toDataURL("image/jpeg", 0.9));
    }, 500);
    return () => clearTimeout(t);
  }, [job, gl, scene, camera]);
  return null;
}

export default function RenderStudio() {
  const [index, setIndex] = useState<number | null>(null);
  const [done, setDone] = useState<{ file: string; url: string; saved: boolean }[]>([]);
  const job = index != null ? jobs[index] : null;
  const f = job ? studioFraming(job.productId, job.width) : null;

  const onShot = async (url: string) => {
    if (!job || index == null) return;
    const res = await fetch("/api/dev/product-render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ file: job.file, data: url }) });
    setDone((d) => [...d, { file: job.file, url, saved: res.ok }]);
    setIndex(index + 1 < jobs.length ? index + 1 : null);
  };

  return (
    <section className="wrap py-10">
      <h1 className="display h-lg mb-2">Product renders</h1>
      <p className="mb-6 max-w-[640px] text-[15px] text-ink-2">
        Development tool. Renders {jobs.length} product photos from the Kitchen Planner models into <code>public/images/products</code>. Re-run it after changing a model or finish.
      </p>
      <button type="button" onClick={() => { setDone([]); setIndex(0); }} disabled={index != null} className="btn btn-navy" data-testid="render-all">
        {index != null ? `Rendering ${index + 1} of ${jobs.length}…` : "Render all photos"}
      </button>
      {job && f && (
        <div className="mt-6 border border-line" style={{ width: W, height: H }}>
          <Canvas
            key={job.file}
            dpr={1}
            shadows
            frameloop="demand"
            gl={{ antialias: true, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.NeutralToneMapping;
              gl.toneMappingExposure = 1.05;
            }}
          >
            <PerspectiveCamera makeDefault fov={f.fov} near={0.05} far={50} position={f.position.toArray()} />
            <StudioScene productId={job.productId} width={job.width} front={job.front} open={job.open} />
            <Shutter job={job} onShot={onShot} />
          </Canvas>
        </div>
      )}
      <ul className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
        {done.map((d) => (
          <li key={d.file} className="border border-line bg-white p-2 text-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.url} alt="" className="aspect-[4/4.4] w-full object-cover" />
            <p className="mt-1.5 font-semibold">{d.file}.jpg</p>
            <p className={d.saved ? "text-success" : "text-error"}>{d.saved ? "Saved" : "Not saved"}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
