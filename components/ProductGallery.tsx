"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/products";

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative flex aspect-[4/3] items-center justify-center bg-white">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={current.id} src={current.url} alt={alt} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-grey">Photo coming soon</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              className={`flex h-16 w-20 shrink-0 cursor-pointer items-center justify-center border-2 bg-white p-1 ${i === active ? "border-orange" : "border-line hover:border-navy"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="max-h-full max-w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
