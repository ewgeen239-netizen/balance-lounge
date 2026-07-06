import { getBar, getAbout } from "@/lib/data";
import { AboutSection } from "@/components/home/AboutSection";
import { LocationReservation } from "@/components/home/LocationReservation";
import { Gallery } from "@/components/about/Gallery";
import { PageHeading } from "@/components/PageHeading";
import { parseJSON } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [bar, about] = await Promise.all([getBar(), getAbout()]);
  const gallery = parseJSON<string[]>(bar?.gallery, []);

  return (
    <div className="pt-10">
      <PageHeading titleKey="nav.about" />

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

      <Gallery images={gallery} />

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
    </div>
  );
}
