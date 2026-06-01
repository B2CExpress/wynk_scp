import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function NoticiaDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const noticia = await getNoticia(slug);

  if (!noticia) {
    notFound();
  }

  return (
    <div>
      <h1>{noticia.title}</h1>
    </div>
  );
}