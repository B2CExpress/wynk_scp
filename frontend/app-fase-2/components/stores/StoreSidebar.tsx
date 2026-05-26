import { formatHours } from "@/lib/format-hours";

type Props = {
  store: any;
};

export default function StoreSidebar({
  store,
}: Props) {
  const formattedHours = formatHours(
    store.hours || []
  );

  return (
    <aside className="rounded-3xl border p-6">
      <h2 className="mb-6 text-2xl font-bold">
        Informações
      </h2>

      <div className="space-y-6">
        {store.floor && (
          <div>
            <p className="text-sm text-gray-500">
              Andar
            </p>

            <p className="mt-1 font-medium">
              {store.floor}
            </p>
          </div>
        )}

        {store.phone && (
          <div>
            <p className="text-sm text-gray-500">
              Telefone
            </p>

            <p className="mt-1 font-medium">
              {store.phone}
            </p>
          </div>
        )}

        {formattedHours.length > 0 && (
          <div>
            <p className="text-sm text-gray-500">
              Horários
            </p>

            <div className="mt-3 space-y-2">
              {formattedHours.map(
                (item: any) => (
                  <div
                    key={item.days}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{item.days}</span>

                    <span>
                      {item.hours}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {store.website_url && (
          <a
            href={store.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 text-white transition hover:opacity-90"
          >
            Site oficial
          </a>
        )}
      </div>
    </aside>
  );
}