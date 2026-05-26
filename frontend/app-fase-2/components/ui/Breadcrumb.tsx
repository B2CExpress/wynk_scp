import Link from "next/link";

type Item = {
  label: string;
  href?: string;
};

type Props = {
  items: Item[];
};

export default function Breadcrumb({
  items,
}: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => {
        const isLast =
          index === items.length - 1;

        return (
          <div
            key={item.label}
            className="flex items-center gap-2"
          >
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-black"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-black">
                {item.label}
              </span>
            )}

            {!isLast && <span>/</span>}
          </div>
        );
      })}
    </nav>
  );
}