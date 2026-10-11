import { NewsSection } from "@/components/home/NewsSection";
import { readMobileMetadata } from "@/lib/mobile-data";
import { emptyContent } from "@/lib/mobile-contract";
import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { LocationReservation } from "@/components/home/LocationReservation";
import { getBar, getAbout, getPublicEvents } from "@/lib/data";
import { EventsStrip } from "@/components/home/EventsStrip";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bar, about, mobile, events] = await Promise.all([getBar(), getAbout(), readMobileMetadata().catch(() => ({ data: { content: emptyContent } })), getPublicEvents()]);

  return (
    <>
      <Hero image={bar?.heroImage ?? "/hero.webp"} neon={bar?.heroNeon ?? "YOU'RE IN THE RIGHT PLACE"} />

      <NewsSection content={mobile.data.content || emptyContent} />

      {about && (
        <AboutSection
          about={{
            heading: about.heading,
            subheading: about.subheading,
            body: about.body,
            images: about.images,
          }}
        />
      )}

      <EventsStrip events={events} serverNow={Date.now()} />

      {bar && (
        <LocationReservation
          bar={{
            address: bar.address,
            phone: bar.phone,
            hours: bar.hours,
            instagram: bar.instagram,
            facebook: bar.facebook,
            whatsapp: bar.whatsapp,
            telegram: bar.telegram,
            lat: bar.lat,
            lng: bar.lng,
          }}
        />
      )}
    </>
  );
}
