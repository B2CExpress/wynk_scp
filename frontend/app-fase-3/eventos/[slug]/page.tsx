import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function EventoDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const evento = await getEvento(slug);

  if (!evento) {
    notFound();
  }

  return (
    <div>
      <h1>{evento.title}</h1>

      <a href={`/api/v1/events/${evento.slug}/calendar.ics`}>
        Adicionar ao calendário
      </a>
    </div>
  );
}