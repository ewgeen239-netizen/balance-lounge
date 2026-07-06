import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { LocationReservation } from "@/components/home/LocationReservation";
import { getBar, getAbout } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bar, about] = await Promise.all([getBar(), getAbout()]);

  return (
    <>
      <Hero image={bar?.heroImage ?? "/hero.webp"} neon={bar?.heroNeon ?? "YOU'RE IN THE RIGHT PLACE"} />

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

      {bar && (
        <LocationReservation
          bar={{
            address: bar.address,
            phone: bar.phone,
            hours: bar.hours,
            instagram: bar.instagram,
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
