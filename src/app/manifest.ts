import type { MetadataRoute } from "next";

// Web app manifest — Android Chrome reads its icons for tabs, shortcuts and
// the home screen, which is what keeps the globe placeholder away on mobile.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BALANCE — Coctails & Shisha",
    short_name: "BALANCE",
    description:
      "Balance to nowoczesna przestrzeń lounge w Szczecinie z dopracowaną kartą koktajli i szerokim wyborem shishy premium.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pl",
    categories: ["food", "lifestyle"],
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press on the app icon (Android) jumps straight to these.
    shortcuts: [
      { name: "Menu", url: "/menu", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Wydarzenia", url: "/wydarzenia", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Rezerwacja", url: "/booking", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
