'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/utils/cn';

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0] ?? '';

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-blush">
        <Image
          src={activeImage}
          alt={name}
          width={720}
          height={720}
          priority
          className="size-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`View image ${index + 1} of ${name}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative aspect-square w-20 overflow-hidden rounded-(--radius) border-2 transition-colors',
                index === activeIndex
                  ? 'border-brand-primary'
                  : 'border-transparent hover:border-border-strong',
              )}
            >
              <Image
                src={image}
                alt=""
                width={160}
                height={160}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
