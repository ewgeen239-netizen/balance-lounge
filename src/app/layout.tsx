import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-mont",
  display: "swap",
});
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReservationProvider } from "@/components/booking/ReservationModal";
import { ScrollReset } from "@/components/ScrollReset";
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
    <html lang="pl" className={montserrat.variable}>
      <body>
        <LangProvider>
          <ReservationProvider hours={hours} loggedIn={!!guest}>
            <ScrollReset />
            <Header />
            <main className="min-h-[60vh]">{children}</main>
            <Footer
              address={bar?.address ?? ""}
              phone={bar?.phone ?? ""}
              instagram={bar?.instagram ?? ""}
              facebook={bar?.facebook ?? ""}
              whatsapp={bar?.whatsapp ?? ""}
              telegram={bar?.telegram ?? ""}
            />
          </ReservationProvider>
        </LangProvider>
      </body>
    </html>
  );
}
