type Props = {
  description?: string;
};

export default function StoreDescription({
  description,
}: Props) {
  if (!description) {
    return (
      <div className="rounded-3xl border p-6">
        <h2 className="mb-4 text-2xl font-bold">
          Sobre a loja
        </h2>

        <p className="text-gray-500">
          Esta loja ainda não possui descrição.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border p-6">
      <h2 className="mb-6 text-2xl font-bold">
        Sobre a loja
      </h2>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: description,
        }}
      />
    </div>
  );
}