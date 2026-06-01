'use client';

import { useEffect, useState } from 'react';
import type { HomeBanner } from '../../lib/home/api';
import styles from '../home.module.css';

interface Props {
  banners: HomeBanner[];
}

const AUTOPLAY_MS = 5000;

export default function BannerCarousel({ banners }: Props) {
  const [current, setCurrent] = useState(0);
  const total = banners.length;

  const goTo = (index: number) => setCurrent(((index % total) + total) % total);

  useEffect(() => {
    if (total <= 1) {
      return;
    }
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [total]);

  if (total === 0) {
    return null;
  }

  return (
    <section className={styles.carousel}>
      <div className={styles.carouselViewport}>
        <div
          className={styles.carouselTrack}
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner) => (
            <a key={banner.id} href={banner.linkUrl} className={styles.slide}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.imageUrl} alt={banner.title} className={styles.slideImage} />
              <span className={styles.slideTitle}>{banner.title}</span>
            </a>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              className={`${styles.carouselNav} ${styles.prev}`}
              onClick={() => goTo(current - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próximo"
              className={`${styles.carouselNav} ${styles.next}`}
              onClick={() => goTo(current + 1)}
            >
              ›
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className={styles.dots}>
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir para o banner ${index + 1}`}
              className={`${styles.dot} ${index === current ? styles.dotActive : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
