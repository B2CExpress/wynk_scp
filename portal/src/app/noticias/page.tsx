import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchNews } from '../../lib/news/api';
import styles from '../content.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default async function NoticiasPage() {
  const host = (await headers()).get('host') ?? '';
  const news = await fetchNews(host);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Fique por dentro</p>
        <h1>Notícias</h1>
        <p className={styles.lead}>Novidades, avisos e bastidores do shopping.</p>
      </header>

      {news.length === 0 ? (
        <div className={styles.emptyState}>Nenhuma notícia publicada no momento.</div>
      ) : (
        <div className={styles.grid}>
          {news.map((article) => (
            <Link key={article.id} href={`/noticias/${article.slug}`} className={styles.card}>
              <div className={styles.cardMedia}>
                <Image
                  src={
                    article.coverImageUrl ?? `https://picsum.photos/seed/${article.slug}/600/400`
                  }
                  alt={article.title}
                  fill
                  unoptimized
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardMeta}>{formatDate(article.publishedAt)}</span>
                <span className={styles.cardTitle}>{article.title}</span>
                <span className={styles.cardExcerpt}>{article.summary}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
