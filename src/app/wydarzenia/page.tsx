import type { Metadata } from "next";
import { PageHeading } from "@/components/PageHeading";
import { EventsView } from "@/components/events/EventsView";
import { getPublicEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
title: "Nasze wydarzenia — BALANCE",
  description: "Wieczory tematyczne, muzyka i wyjątkowe okazje w BALANCE Cocktails & Shisha w Szczecinie.",
};

export default async function EventsPage() {
  const events = await getPublicEvents();
  return (
    <div className="pt-10">
      <PageHeading titleKey="events.title" compact />
      <EventsView events={events} serverNow={Date.now()} />
    </div>
  );
}
