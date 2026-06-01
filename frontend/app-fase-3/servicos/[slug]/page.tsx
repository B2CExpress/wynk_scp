import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function ServicoDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const servico = await getServico(slug);

  if (!servico) {
    notFound();
  }

  return (
    <div>
      <h1>{servico.name}</h1>

      <a href={`tel:${servico.phone}`}>
        {servico.phone}
      </a>
    </div>
  );
}