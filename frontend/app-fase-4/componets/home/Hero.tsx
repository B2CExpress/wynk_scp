interface Props {
  hero: any;
}

export default function Hero({ hero }: Props) {
  return (
    <section className="relative h-[600px]">
      {hero.background_image_url ? (
        <img
          src={hero.background_image_url}
          alt={hero.title}
          className="object-cover w-full h-full absolute inset-0"
        />
      ) : null}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex h-full items-center">
        <div className="container">
          <h1 className="text-5xl font-bold text-white">
            {hero.title}
          </h1>

          <p className="mt-4 text-xl text-white">
            {hero.subtitle}
          </p>

          {hero.cta_url && (
            <a
              href={hero.cta_url}
              className="btn-primary mt-6 inline-block"
            >
              {hero.cta_label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}