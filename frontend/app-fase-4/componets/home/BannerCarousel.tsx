"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Props {
  banners: any[];
}

export default function BannerCarousel({
  banners,
}: Props) {
  const [emblaRef, emblaApi] =
    useEmblaCarousel(
      {
        loop: true,
      },
      [
        Autoplay({
          delay: 5000,
          stopOnMouseEnter: true,
        }),
      ]
    );

  return (
    <section className="py-8">
      <div
        className="overflow-hidden"
        ref={emblaRef}
      >
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="min-w-full"
            >
              {/* Banner */}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {/* Dots */}
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
      >
        Prev
      </button>

      <button
        onClick={() => emblaApi?.scrollNext()}
      >
        Next
      </button>
    </section>
  );
}