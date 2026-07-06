import { getBar } from "@/lib/data";
import { getGuestSession } from "@/lib/auth";
import { BookingForm } from "@/components/booking/BookingForm";
import { PageHeading } from "@/components/PageHeading";
import { parseJSON, type HoursRow } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [bar, guest] = await Promise.all([getBar(), getGuestSession()]);
  const hours = parseJSON<HoursRow[]>(bar?.hours, []);

  return (
    <div className="pb-16 pt-10">
      <PageHeading titleKey="book.title" />
      <div className="container-x">
        <BookingForm hours={hours} loggedIn={!!guest} />
      </div>
    </div>
  );
}
