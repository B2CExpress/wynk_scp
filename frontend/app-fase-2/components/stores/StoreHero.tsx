import Image from "next/image";
import Link from "next/link";

type Props = {
  store: any;
};

export default function StoreHero({
  store,
}: Props) {
  return (
    <section className="relative mt-6">
      <div className="relative h-[320px] w-full overflow-hidden rounded-3xl">
        <Image
          src={store.cover_image_url}
          alt={store.name}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="absolute -bottom-12 left-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-lg">
          <Image
            src={store.logo_url}
            alt={store.name}
            fill
            className="object-contain p-2"
          />
        </div>

        <div className="pb-2 text-white">
          <h1 className="text-3xl font-bold md:text-4xl">
            {store.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {store.categories?.map(
              (category: any) => (
                <Link
                  key={category.id}
                  href={`/lojas?category=${category.slug}`}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur"
                >
                  {category.name}
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      <div className="h-20" />
    </section>
  );
}