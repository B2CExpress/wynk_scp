interface Props {
  title: string;
  href: string;
  accent?: boolean;
  children?: any;
}

export default function Section({
  title,
  href,
  accent,
  children,
}: Props) {
  return (
    <section
      className={`py-16 ${
        accent
          ? "bg-muted/50"
          : ""
      }`}
    >
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            {title}
          </h2>

          <a href={href} className="font-medium">
            Ver todas →
          </a>
        </div>

        {children}
      </div>
    </section>
  );
}