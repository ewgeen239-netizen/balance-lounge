import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReservationProvider } from "@/components/booking/ReservationModal";
import { getBar } from "@/lib/data";
import { getGuestSession } from "@/lib/auth";
import { parseJSON, type HoursRow } from "@/lib/utils";

export const metadata: Metadata = {
  title: "BALANCE — Coctails & Shisha | Szczecin",
  description:
    "Balance to nowoczesna przestrzeń lounge w Szczecinie z dopracowaną kartą koktajli i szerokim wyborem shishy premium.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bar, guest] = await Promise.all([getBar(), getGuestSession()]);
  const hours = parseJSON<HoursRow[]>(bar?.hours, []);

  return (
    <html lang="pl">
      <body>
        <LangProvider>
          <ReservationProvider hours={hours} loggedIn={!!guest}>
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer
              address={bar?.address ?? ""}
              phone={bar?.phone ?? ""}
              instagram={bar?.instagram ?? ""}
              whatsapp={bar?.whatsapp ?? ""}
              telegram={bar?.telegram ?? ""}
            />
          </ReservationProvider>
        </LangProvider>
      </body>
    </html>
  );
}
