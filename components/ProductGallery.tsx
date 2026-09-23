"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/products";

export function ProductGallery({ images, alt, ip }: { images: ProductImage[]; alt: string; ip: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="product-stage relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.id} src={current.url} alt={alt} className="absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply sm:p-10" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-navy-500">Photo coming soon</div>
        )}
        <span className="absolute left-4 top-4 rounded-lg bg-navy-950 px-2.5 py-1 text-xs font-bold tracking-wider text-amber-brand">
          {ip}
        </span>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              className={`product-stage relative h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition ${i === active ? "border-amber-brand" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="absolute inset-0 h-full w-full object-contain p-1 mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
