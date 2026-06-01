interface Props {
  items: any[];
}

import PromotionCard from "./PromotionCard";

export default function PromotionGrid({
  items,
}: Props) {
  return (
    <div
      className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-3
      gap-6
    "
    >
      {items.map((item) => (
        <div key={item.id || item.title}>
          <PromotionCard promotion={item} />
        </div>
      ))}
    </div>
  );
}