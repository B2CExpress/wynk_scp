import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchNewsDetail, type PublicNews } from '../../../lib/news/api';
import styles from '../../content.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function NoticiaDetalhe({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';

  let article: PublicNews;
  try {
    article = await fetchNewsDetail(host, slug);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    throw error;
  }

  return (
    <div className={styles.page}>
      <Link href="/noticias" className={styles.back}>
        Voltar para notícias
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailCopy}>
          <p className={styles.kicker}>{article.category}</p>
          <h1>{article.title}</h1>
          <div className={styles.metaRow}>
            <span>{formatDate(article.publishedAt)}</span>
            <span>Por {article.author}</span>
          </div>
        </div>
        <div className={styles.detailMedia}>
          <Image
            src={article.coverImageUrl ?? `https://picsum.photos/seed/${article.slug}/800/450`}
            alt={article.title}
            fill
            unoptimized
            className={styles.detailImage}
          />
        </div>
      </section>

      <article className={styles.detailBody} dangerouslySetInnerHTML={{ __html: article.body }} />
    </div>
  );
}
