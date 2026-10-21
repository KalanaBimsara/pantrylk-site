import * as THREE from "three";
import { byId, CARCASSES, FLOORS, FRONTS, HANDLES, WORKTOPS, type Surface } from "@/lib/planner/finishes";

/** Seeded RNG so procedural textures look the same on every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function canvas(size: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, seed = 7) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function surfaceTexture(surface: Surface, base: string, vein: string, seed = 7) {
  if (surface === "wood")
    return canvas(512, (g, r) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 90; i++) {
        g.strokeStyle = vein;
        g.globalAlpha = 0.08 + r() * 0.25;
        g.lineWidth = 0.6 + r() * 2.4;
        let x = r() * 512;
        g.beginPath();
        g.moveTo(x, 0);
        for (let y = 0; y <= 512; y += 32) {
          x += (r() - 0.5) * 6;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    }, seed);
  if (surface === "marble")
    return canvas(1024, (g, r) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 14; i++) {
        g.strokeStyle = vein;
        g.globalAlpha = 0.15 + r() * 0.35;
        g.lineWidth = 0.8 + r() * 3;
        g.beginPath();
        let x = r() * 1024, y = 0;
        g.moveTo(x, y);
        while (y < 1024) {
          const nx = x + (r() - 0.4) * 160, ny = y + 60 + r() * 120;
          g.quadraticCurveTo(x + (r() - 0.5) * 120, (y + ny) / 2, nx, ny);
          x = nx;
          y = ny;
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    }, seed);
  if (surface === "speckle")
    return canvas(512, (g, r) => {
      g.fillStyle = base;
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = r() > 0.5 ? vein : "#ffffff";
        g.globalAlpha = 0.15 + r() * 0.5;
        g.fillRect(r() * 512, r() * 512, 1 + r() * 2.5, 1 + r() * 2.5);
      }
      g.globalAlpha = 1;
    }, seed);
  return null;
}

const cache = new Map<string, THREE.Material>();
const memo = <T extends THREE.Material>(key: string, make: () => T): T => {
  let m = cache.get(key);
  if (!m) cache.set(key, (m = make()));
  return m as T;
};

export const frontMaterial = (id: string) =>
  memo(`front:${id}`, () => {
    const f = byId(FRONTS, id);
    const map = surfaceTexture(f.surface, f.color, f.grain ?? f.color, id.length * 13);
    return new THREE.MeshStandardMaterial({ color: map ? "#ffffff" : f.color, map, roughness: f.rough, metalness: 0, envMapIntensity: f.rough < 0.3 ? 1.2 : 0.6 });
  });

export const carcassMaterial = (id: string, front: string) =>
  id === "match" ? frontMaterial(front) : memo(`carcass:${id}`, () => new THREE.MeshStandardMaterial({ color: byId(CARCASSES, id).color, roughness: 0.8 }));

export const handleMaterial = (id: string) =>
  memo(`handle:${id}`, () => {
    const h = byId(HANDLES, id);
    return new THREE.MeshStandardMaterial({ color: h.color, metalness: h.metal, roughness: h.metal > 0.5 ? 0.3 : 0.5 });
  });

export const worktopMaterial = (id: string) =>
  memo(`top:${id}`, () => {
    const w = byId(WORKTOPS, id);
    const map = surfaceTexture(w.surface, w.color, w.vein ?? w.color, 31);
    // Run the grain along the worktop's length.
    if (map && w.surface === "wood") {
      map.center.set(0.5, 0.5);
      map.rotation = Math.PI / 2;
    }
    return new THREE.MeshStandardMaterial({ color: map ? "#ffffff" : w.color, map, roughness: w.rough, envMapIntensity: 0.9 });
  });

export const floorMaterial = (id: string) =>
  memo(`floor:${id}`, () => {
    const f = byId(FLOORS, id);
    let map: THREE.CanvasTexture;
    if (f.pattern === "planks")
      map = canvas(1024, (g, r) => {
        const rows = 8, h = 1024 / rows;
        for (let row = 0; row < rows; row++) {
          let x = -r() * 600;
          while (x < 1024) {
            const len = 420 + r() * 500;
            const shade = (r() - 0.5) * 0.18;
            g.fillStyle = f.color;
            g.fillRect(x, row * h, len, h);
            g.fillStyle = shade > 0 ? `rgba(255,255,255,${shade})` : `rgba(0,0,0,${-shade})`;
            g.fillRect(x, row * h, len, h);
            g.strokeStyle = f.accent;
            for (let k = 0; k < 7; k++) {
              g.globalAlpha = 0.12 + r() * 0.2;
              g.beginPath();
              const yy = row * h + r() * h;
              g.moveTo(x, yy);
              g.bezierCurveTo(x + len / 3, yy + (r() - 0.5) * 10, x + (2 * len) / 3, yy + (r() - 0.5) * 10, x + len, yy);
              g.stroke();
            }
            g.globalAlpha = 0.55;
            g.fillStyle = "#00000055";
            g.fillRect(x, row * h, 2, h);
            g.globalAlpha = 1;
            x += len;
          }
          g.fillStyle = "#00000040";
          g.fillRect(0, row * h, 1024, 2);
        }
      }, 3);
    else if (f.pattern === "tiles")
      map = canvas(512, (g, r) => {
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++) {
            g.fillStyle = f.color;
            g.fillRect(i * 128, j * 128, 128, 128);
            g.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
            g.fillRect(i * 128, j * 128, 128, 128);
          }
        g.strokeStyle = f.accent;
        g.lineWidth = 3;
        for (let k = 0; k <= 4; k++) {
          g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.stroke();
          g.beginPath(); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke();
        }
      }, 5);
    else
      map = canvas(512, (g, r) => {
        g.fillStyle = f.color;
        g.fillRect(0, 0, 512, 512);
        const chips = ["#8f8578", "#b6a48d", "#5f5a55", "#d9c9b0", "#a5735a"];
        for (let i = 0; i < 900; i++) {
          g.fillStyle = chips[Math.floor(r() * chips.length)];
          g.beginPath();
          g.ellipse(r() * 512, r() * 512, 1 + r() * 5, 1 + r() * 4, r() * 3, 0, 7);
          g.fill();
        }
      }, 9);
    // Floor shape UVs are in millimetres: one texture tile per 1.6 m (planks) or 1.2 m.
    const tile = f.pattern === "planks" ? 1600 : 1200;
    map.repeat.set(1 / tile, 1 / tile);
    return new THREE.MeshStandardMaterial({ map, roughness: f.pattern === "tiles" ? 0.35 : 0.7 });
  });

export const wallMaterial = (hex: string) => memo(`wall:${hex}`, () => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 }));

export const M = {
  get steel() { return memo("steel", () => new THREE.MeshStandardMaterial({ color: "#c9ccce", metalness: 0.85, roughness: 0.32 })); },
  get darkSteel() { return memo("darkSteel", () => new THREE.MeshStandardMaterial({ color: "#6d7175", metalness: 0.8, roughness: 0.4 })); },
  get blackGlass() { return memo("blackGlass", () => new THREE.MeshStandardMaterial({ color: "#121315", metalness: 0.2, roughness: 0.08 })); },
  get glass() { return memo("glass", () => new THREE.MeshPhysicalMaterial({ color: "#dfeef5", roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.35, thickness: 4 })); },
  get white() { return memo("white", () => new THREE.MeshStandardMaterial({ color: "#f4f4f2", roughness: 0.5 })); },
  get frame() { return memo("frame", () => new THREE.MeshStandardMaterial({ color: "#fbfbfa", roughness: 0.6 })); },
  get black() { return memo("black", () => new THREE.MeshStandardMaterial({ color: "#1b1c1e", roughness: 0.5 })); },
  get rubber() { return memo("rubber", () => new THREE.MeshStandardMaterial({ color: "#2b2c2e", roughness: 0.9 })); },
  get fabric() { return memo("fabric", () => new THREE.MeshStandardMaterial({ color: "#8a8378", roughness: 1 })); },
  get oak() { return frontMaterial("natural-oak"); },
  get plinth() { return memo("plinth", () => new THREE.MeshStandardMaterial({ color: "#2a2b2d", roughness: 0.7 })); },
  get basin() { return memo("basin", () => new THREE.MeshStandardMaterial({ color: "#9ea3a6", metalness: 0.9, roughness: 0.25 })); },
  get bulb() { return memo("bulb", () => new THREE.MeshStandardMaterial({ color: "#fff6dc", emissive: "#ffe9b0", emissiveIntensity: 1.4 })); },
  get door() { return memo("doorLeaf", () => new THREE.MeshStandardMaterial({ color: "#f2efe8", roughness: 0.55 })); },
  get selected() { return memo("selected", () => new THREE.MeshStandardMaterial({ color: "#3d8be0", transparent: true, opacity: 0.5, roughness: 0.6 })); },
};

export const colorMaterial = (hex: string) => memo(`color:${hex}`, () => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8 }));

export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const UNIT_CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
