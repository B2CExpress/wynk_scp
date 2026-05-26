import { db } from "@/lib/db";

export async function fetchStore(
  slug: string
) {
  const tenantId = "tenant-id-aqui";

  const store = await db.store.findFirst({
    where: {
      slug,
      tenant_id: tenantId,
    },

    include: {
      categories: true,
    },
  });

  return store;
}