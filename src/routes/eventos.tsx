import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, ExternalLink, Users } from "lucide-react";
import { getEvents } from "@/server/event.functions";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Ipê Village Check-In" },
      { name: "description", content: "Calendário de eventos do Ipê Village" },
    ],
  }),
  component: EventosPage,
});

type Event = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  organizer: string | null;
  location: string | null;
  url: string | null;
};

const APP_TIME_ZONE = "America/Sao_Paulo";

function getTodayKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useState(() => {
    getEvents().then((e) => {
      setEvents(e);
      setLoaded(true);
    });
  });

  const today = getTodayKey();

  const byDate: Record<string, Event[]> = {};
  for (const event of events) {
    if (!byDate[event.date]) byDate[event.date] = [];
    byDate[event.date].push(event);
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground text-sm mt-1">Calendário de eventos Ipê Village</p>
        </div>

        {!loaded && <p className="text-muted-foreground text-sm">Carregando...</p>}

        {loaded && events.length === 0 && (
          <div className="glass rounded-3xl py-16 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum evento cadastrado</p>
          </div>
        )}

        {Object.entries(byDate).map(([date, dayEvents]) => {
          const isToday = date === today;
          const isPast = date < today;

          return (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground capitalize">
                  {formatDate(date)}
                </h3>
                {isToday && (
                  <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs">Hoje</Badge>
                )}
                {isPast && (
                  <Badge variant="secondary" className="text-xs rounded-lg opacity-60">Passado</Badge>
                )}
              </div>

              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`glass rounded-2xl p-5 space-y-2 ${isPast ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{event.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {event.time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {event.organizer && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          {event.organizer}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
