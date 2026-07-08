"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Forces the page to the top on reload and on route change, instead of the
// browser restoring the previous scroll position.
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
