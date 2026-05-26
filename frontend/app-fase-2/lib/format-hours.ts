const DAYS = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sab",
  "Dom",
];

export function formatHours(hours: any[]) {
  if (!hours.length) {
    return [];
  }

  const grouped = [];

  let start = 0;

  while (start < hours.length) {
    let end = start;

    while (
      end + 1 < hours.length &&
      hours[end].open ===
        hours[end + 1].open &&
      hours[end].close ===
        hours[end + 1].close
    ) {
      end++;
    }

    grouped.push({
      days:
        start === end
          ? DAYS[start]
          : `${DAYS[start]}-${DAYS[end]}`,

      hours: `${hours[start].open}h-${hours[start].close}h`,
    });

    start = end + 1;
  }

  return grouped;
}