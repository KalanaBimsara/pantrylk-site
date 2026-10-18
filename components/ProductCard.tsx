import Image from "next/image";
import Link from "next/link";
import { priceLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col border border-line bg-white transition-colors hover:border-navy">
      {cover ? (
        <div className="card-img aspect-square">
          <Image src={cover.src} alt={cover.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" className="object-cover" />
        </div>
      ) : (
        <div className="slot aspect-square">Photo coming soon</div>
      )}
      <div className="flex flex-1 flex-col gap-1.5 px-[18px] pb-5 pt-[18px]">
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-gold-deep">{product.categoryName}</span>
        <h3 className="display text-[21px] leading-tight">{product.name}</h3>
        {product.summary && <p className="text-[14.5px] text-muted">{product.summary}</p>}
        {product.finishes.length > 0 && <p className="text-[13.5px] text-muted">{product.finishes.length} finishes</p>}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#ece7de] pt-3.5">
          <span className="text-[14.5px] font-semibold">{priceLabel(product.priceMode, product.price)}</span>
          <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold">
            View Details <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
