import { notFound } from "next/navigation";
import Countdown from "@/components/editorial/Countdown";

export const revalidate = 60;

export default async function PromocaoDetalhe({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const promocao = await getPromocao(slug);

  if (!promocao) {
    notFound();
  }

  return (
    <div>
      <h1>{promocao.title}</h1>

      <Countdown
        targetDate={promocao.valid_until}
      />
    </div>
  );
}