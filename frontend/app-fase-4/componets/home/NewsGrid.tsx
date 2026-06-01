import NewsCard from "./NewsCard";

interface Props {
  news: any[];
}

export default function NewsGrid({
  news,
}: Props) {
  return (
    <div
      className="
      grid
      grid-cols-1
      md:grid-cols-2
      lg:grid-cols-3
      gap-6
    "
    >
      {news.map((item) => (
        <div key={item.id || item.title}>
          <NewsCard article={item} />
        </div>
      ))}
    </div>
  );
}