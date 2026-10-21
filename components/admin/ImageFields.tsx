"use client";

import { useId, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { mediaUrl } from "@/lib/supabase/public";
import { AlertIcon, SpinnerIcon } from "@/components/Icons";
import { slugify } from "./ui";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Upload one image to the public site-media bucket (storage RLS allows admins only). Returns its path. */
async function uploadImage(file: File, folder: string): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name}: use a JPG, PNG, WebP or AVIF image.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB. Resize it before uploading.`);
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : file.type.split("/")[1];
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name).slice(0, 50) || "image";
  const path = `${folder}/${new Date().getFullYear()}/${crypto.randomUUID().slice(0, 8)}-${base}.${ext}`;
  const { error } = await getBrowserSupabase().storage.from("site-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    if (/row-level security|unauthori[sz]ed|403/i.test(error.message)) throw new Error("Upload refused: your session may have expired. Sign in again.");
    if (/bucket not found/i.test(error.message)) throw new Error("The site-media storage bucket is missing. Run supabase/migrations/0001_init.sql.");
    throw new Error(`Upload failed: ${error.message}`);
  }
  return path;
}

function Preview({ path, alt }: { path: string; alt: string }) {
  const src = mediaUrl(path);
  if (!src) return <div className="slot aspect-[4/3] w-full text-[12px]">No image</div>;
  // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary storage paths
  return <img src={src} alt={alt} className="aspect-[4/3] w-full bg-stone object-cover" />;
}

function UploadButton({ folder, multiple, label, onUploaded }: { folder: string; multiple?: boolean; label: string; onUploaded: (paths: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const paths: string[] = [];
    try {
      for (const f of files) paths.push(await uploadImage(f, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (paths.length) onUploaded(paths);
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept={TYPES.join(",")} multiple={multiple} onChange={onChange} className="sr-only" tabIndex={-1} aria-hidden />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-outline min-h-10 px-4 text-[14px]">
        {busy && <SpinnerIcon className="motion-safe:animate-spin" />} {busy ? "Uploading…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-[13.5px] text-error">
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  );
}

export type SingleImage = { path: string; alt: string };

/**
 * One image with alt text (category image, project cover, before/after). Posts `<name>_path` and
 * `<name>_alt` with the form.
 */
export function ImageField({ name, label, folder, initial, hint }: { name: string; label: string; folder: string; initial: SingleImage; hint?: string }) {
  const [img, setImg] = useState<SingleImage>(initial);
  const id = useId();
  return (
    <fieldset className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <legend className="field-label">{label}</legend>
      <div className="w-full max-w-[240px]">
        <Preview path={img.path} alt={img.alt} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <UploadButton folder={folder} label={img.path ? "Replace image" : "Upload image"} onUploaded={([p]) => setImg((v) => ({ ...v, path: p }))} />
          {img.path && (
            <button type="button" onClick={() => setImg({ path: "", alt: "" })} className="text-[14px] font-semibold text-error underline">
              Remove
            </button>
          )}
        </div>
        <div>
          <label htmlFor={`${id}-alt`} className="mb-1 block text-[13px] font-semibold">
            Alt text
          </label>
          <input
            id={`${id}-alt`}
            name={`${name}_alt`}
            value={img.alt}
            onChange={(e) => setImg({ ...img, alt: e.target.value })}
            placeholder="Describe what the photo shows"
            className="field min-h-10 text-[15px]"
          />
        </div>
        <div>
          <label htmlFor={`${id}-path`} className="mb-1 block text-[13px] font-semibold text-muted">
            File path
          </label>
          <input
            id={`${id}-path`}
            name={`${name}_path`}
            value={img.path}
            onChange={(e) => setImg({ ...img, path: e.target.value })}
            placeholder="Uploaded automatically, or /images/… for a bundled photo"
            className="field min-h-10 font-mono text-[13px]"
          />
        </div>
        {hint && <p className="text-[13px] text-muted">{hint}</p>}
      </div>
    </fieldset>
  );
}

type GalleryItem = { k: string; path: string; alt: string; caption: string };
export type GalleryImage = { path: string; alt: string; caption: string | null };

/** An ordered gallery with alt text and captions. Posts JSON in a hidden `<name>` input. */
export function ImageListField({ name, label, folder, initial, hint }: { name: string; label: string; folder: string; initial: GalleryImage[]; hint?: React.ReactNode }) {
  const [items, setItems] = useState<GalleryItem[]>(() => initial.map((im) => ({ k: crypto.randomUUID(), path: im.path, alt: im.alt, caption: im.caption ?? "" })));
  const update = (k: string, patch: Partial<GalleryItem>) => setItems((list) => list.map((it) => (it.k === k ? { ...it, ...patch } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return list;
      const next = list.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const value = JSON.stringify(items.map(({ path, alt, caption }) => ({ path, alt, caption: caption.trim() || null })));

  return (
    <div>
      <p className="field-label">{label}</p>
      {hint && <p className="-mt-1 mb-3 text-[13px] text-muted">{hint}</p>}
      <input type="hidden" name={name} value={value} />
      {items.length > 0 && (
        <ol className="mb-4 flex flex-col gap-3">
          {items.map((it, i) => (
            <li key={it.k} className="grid gap-4 border border-line p-3 sm:grid-cols-[150px_1fr_auto]">
              <div className="w-full max-w-[200px]">
                <Preview path={it.path} alt={it.alt} />
                {i === 0 && <p className="mt-1 text-[12px] font-semibold text-gold-deep">Main photo</p>}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  aria-label={`Image ${i + 1} alt text`}
                  value={it.alt}
                  onChange={(e) => update(it.k, { alt: e.target.value })}
                  placeholder="Alt text: describe what the photo shows (required)"
                  className="field min-h-10 text-[15px]"
                  aria-invalid={!it.alt.trim() || undefined}
                />
                <input
                  aria-label={`Image ${i + 1} caption`}
                  value={it.caption}
                  onChange={(e) => update(it.k, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="field min-h-10 text-[15px]"
                />
                <input
                  aria-label={`Image ${i + 1} file path`}
                  value={it.path}
                  onChange={(e) => update(it.k, { path: e.target.value })}
                  className="field min-h-9 font-mono text-[12.5px] text-muted"
                />
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-outline min-h-9 px-3 text-[13px]" aria-label={`Move image ${i + 1} up`}>
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="btn btn-outline min-h-9 px-3 text-[13px]" aria-label={`Move image ${i + 1} down`}>
                  ↓
                </button>
                <button type="button" onClick={() => setItems((l) => l.filter((x) => x.k !== it.k))} className="btn min-h-9 px-3 text-[13px] text-error" aria-label={`Remove image ${i + 1}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <UploadButton
        folder={folder}
        multiple
        label={items.length ? "Add images" : "Upload images"}
        onUploaded={(paths) => setItems((l) => [...l, ...paths.map((path) => ({ k: crypto.randomUUID(), path, alt: "", caption: "" }))])}
      />
    </div>
  );
}
