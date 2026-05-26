import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">
        Loja não encontrada
      </h1>

      <p className="mt-4 max-w-md text-gray-500">
        A loja que você está procurando não
        existe ou não está disponível neste
        shopping.
      </p>

      <Link
        href="/lojas"
        className="mt-6 rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
      >
        Voltar para lojas
      </Link>
    </div>
  );
}