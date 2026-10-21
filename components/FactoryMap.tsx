"use client";

import { useState } from "react";

/** Google map that loads only on request: no third-party requests or cookies until the visitor asks. */
export default function FactoryMap({ embedUrl, label }: { embedUrl: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden border border-line bg-stone">
      {show ? (
        <iframe src={embedUrl} title={label} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setShow(true)} className="slot absolute inset-0 flex-col gap-2 hover:text-navy">
          <span className="text-[16px] font-semibold">Show map</span>
          <span className="max-w-[320px] text-[13px] font-normal">Loads Google Maps, which may set its own cookies.</span>
        </button>
      )}
    </div>
  );
}
