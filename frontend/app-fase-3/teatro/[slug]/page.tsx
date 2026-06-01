import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function TeatroDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const show = await getShow(slug);

  if (!show) {
    notFound();
  }

  return (
    <div>
      <h1>{show.title}</h1>

      {show.sessions.map((session: any) => (
        <div key={session.id}>
          <a
            href={session.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Comprar ingresso
          </a>
        </div>
      ))}
    </div>
  );
}