import { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/ui/Breadcrumb";
import StoreHero from "@/components/stores/StoreHero";
import StoreSidebar from "@/components/stores/StoreSidebar";
import StoreDescription from "@/components/stores/StoreDescription";

import { fetchStore } from "@/lib/fetch-store";

export const revalidate = 60;

type Props = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const store = await fetchStore(params.slug);

  if (!store) {
    return {};
  }

  return {
    title: `${store.name} | Shopping`,
    description: store.description
      ?.replace(/<[^>]*>/g, "")
      .slice(0, 160),

    openGraph: {
      title: store.name,
      description: store.description
        ?.replace(/<[^>]*>/g, "")
        .slice(0, 160),

      images: [
        {
          url: store.cover_image_url,
        },
      ],
    },
  };
}

export default async function StorePage({
  params,
}: Props) {
  const store = await fetchStore(params.slug);

  if (!store) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          {
            label: "Home",
            href: "/",
          },

          {
            label: "Lojas",
            href: "/lojas",
          },

          {
            label:
              store.categories?.[0]?.name ||
              "Categoria",

            href: `/lojas?category=${store.categories?.[0]?.slug}`,
          },

          {
            label: store.name,
          },
        ]}
      />

      <StoreHero store={store} />

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StoreDescription
            description={store.description}
          />
        </div>

        <div>
          <StoreSidebar store={store} />
        </div>
      </div>

      <div className="mt-12 rounded-2xl border p-6">
        <h2 className="text-2xl font-bold">
          Promoções desta loja
        </h2>

        <p className="mt-2 text-gray-500">
          Em breve teremos promoções disponíveis.
        </p>
      </div>
    </div>
  );
}