interface Props {
  events: any[];
}

import EventCard from "./EventCard";

export default function EventGrid({
  events,
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
      {events.map((event) => (
        <div key={event.id || event.title}>
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}